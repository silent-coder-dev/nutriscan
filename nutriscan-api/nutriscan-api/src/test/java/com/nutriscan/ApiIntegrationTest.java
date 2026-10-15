package com.nutriscan;

import com.nutriscan.dto.AiProductResponseDto;
import com.nutriscan.dto.NutrimentsDto;
import com.nutriscan.dto.OffSearchResponseDto;
import com.nutriscan.dto.OpenFoodFactsProductDto;
import com.nutriscan.service.OpenFoodFactsService;
import com.nutriscan.service.OpenRouterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Exercises the real HTTP surface (security, validation, error bodies, rate limiting,
 * persistence) against the nutriscandb_test database. External APIs are mocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    private static final String PASSWORD = "Str0ng!Pass";
    private static final AtomicInteger SEQ = new AtomicInteger();
    // Unique per JVM run so reruns against a reused schema never collide
    private static final String RUN = Long.toString(System.nanoTime() % 100_000, 36);

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private OpenFoodFactsService openFoodFactsService;
    @MockitoBean private OpenRouterService openRouterService;

    @BeforeEach
    void defaultProvidersFindNothing() {
        when(openFoodFactsService.fetchProductByBarcode(anyString())).thenReturn(Optional.empty());
        when(openRouterService.fetchProductFromAi(anyString())).thenReturn(Optional.empty());
    }

    // ---------------------------------------------------------------- auth

    @Test
    void registerValidationErrorsReturnJson400() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ab\",\"fullName\":\"\",\"email\":\"bad\",\"password\":\"weak\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.password").exists())
                .andExpect(jsonPath("$.fieldErrors.username").exists());
    }

    @Test
    void usernameWithoutDigitsOrSymbolsIsAccepted() throws Exception {
        // The web form says numbers and symbols are optional; the API used to reject these
        String username = "plain" + uniqueSuffix().replaceAll("[^a-z]", "x");
        register(username, username + "@example.com", List.of())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value(username));
    }

    @Test
    void duplicateRegistrationReturns409() throws Exception {
        String username = newUsername();
        register(username, username + "@example.com", List.of()).andExpect(status().isCreated());

        register(username, "other" + username + "@example.com", List.of())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username @" + username + " is already taken."));
        register(newUsername(), username + "@example.com", List.of())
                .andExpect(status().isConflict());
    }

    @Test
    void loginWorksWithUsernameOrEmailAndRejectsBadPassword() throws Exception {
        String username = newUsername();
        register(username, username + "@example.com", List.of()).andExpect(status().isCreated());

        login(username, PASSWORD).andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
        login(username.toUpperCase() + "@EXAMPLE.COM", PASSWORD).andExpect(status().isOk());
        login(username, "Wrong!Pass1")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username/email or password credentials."));
        login("nobody-" + username, PASSWORD).andExpect(status().isUnauthorized());
    }

    @Test
    void malformedJsonAndWrongContentTypeAreClientErrors() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{bad json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.TEXT_PLAIN).content("hi"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void checkUsernameReportsAvailability() throws Exception {
        String username = newUsername();
        mvc.perform(get("/api/v1/auth/check-username").param("username", username))
                .andExpect(status().isOk()).andExpect(jsonPath("$.available").value(true));
        register(username, username + "@example.com", List.of()).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/auth/check-username").param("username", username.toUpperCase()))
                .andExpect(jsonPath("$.available").value(false));
        mvc.perform(get("/api/v1/auth/check-username"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required parameter 'username' is missing."));
    }

    // ---------------------------------------------------------------- security

    @Test
    void protectedEndpointsReturnJson401WithoutValidToken() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
        mvc.perform(get("/api/v1/users/me/scans").header(HttpHeaders.AUTHORIZATION, "Bearer garbage"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/users/profile").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownRouteForSignedInUserIs404() throws Exception {
        String token = registerAndGetToken(newUsername());
        mvc.perform(get("/api/v1/does-not-exist").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        int status = mvc.perform(get("/actuator/health")).andReturn().getResponse().getStatus();
        // Redis is intentionally unreachable in tests, so health may be DOWN (503), but never 401/403
        assertThat(status).isIn(200, 503);
    }

    // ---------------------------------------------------------------- products

    @Test
    void invalidBarcodesAreRejectedWithoutCallingProviders() throws Exception {
        for (String bad : List.of("history", "abc", "1234", "123456789012345")) {
            mvc.perform(get("/api/v1/products/" + bad).with(ip("10.1.0.1")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }
        verifyNoInteractions(openFoodFactsService, openRouterService);
    }

    @Test
    void guestsGetFiveScansAndFakeTokensDoNotBypassTheLimit() throws Exception {
        String barcode = stubOffProduct("C");
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.2.0.1")))
                .andExpect(status().isOk())
                .andExpect(header().string("X-RateLimit-Remaining", "4"));

        for (int i = 0; i < 4; i++) {
            // A junk bearer token must still count as a guest scan
            mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.2.0.1"))
                            .header(HttpHeaders.AUTHORIZATION, "Bearer garbage"))
                    .andExpect(status().isOk());
        }
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.2.0.1")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("RATE_LIMIT_EXCEEDED"));

        // Signed-in users are not limited
        String token = registerAndGetToken(newUsername());
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.2.0.1"))
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("X-RateLimit-Remaining"));
    }

    @Test
    void unknownProductReturns404() throws Exception {
        mvc.perform(get("/api/v1/products/" + validBarcode()).with(ip("10.3.0.1")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("Product not found")));
    }

    @Test
    void firstDiscoveryAwardsPointsAndIsLoggedInHistory() throws Exception {
        String username = newUsername();
        String token = registerAndGetToken(username);
        String barcode = stubOffProduct("E");

        mvc.perform(get("/api/v1/products/" + barcode).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewDiscovery").value(true))
                .andExpect(jsonPath("$.earnedPoints").value(10))
                .andExpect(jsonPath("$.totalScoutScore").value(10))
                .andExpect(jsonPath("$.source").value("OPEN_FOOD_FACTS"))
                .andExpect(jsonPath("$.nutriScore").value("E"))
                .andExpect(jsonPath("$.allergens").value("Milk, Nuts"));

        // Second lookup comes from the database: no new points
        mvc.perform(get("/api/v1/products/" + barcode).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(jsonPath("$.isNewDiscovery").value(false))
                .andExpect(jsonPath("$.earnedPoints").value(0))
                .andExpect(jsonPath("$.totalScoutScore").value(10));
        verify(openFoodFactsService, times(1)).fetchProductByBarcode(barcode);

        mvc.perform(get("/api/v1/users/me/scans").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].barcode").value(barcode))
                .andExpect(jsonPath("$[0].healthVerdict").value("Avoid"))
                .andExpect(jsonPath("$[0].isDiscovery").value(false))
                .andExpect(jsonPath("$[1].isDiscovery").value(true));

        mvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(jsonPath("$.scoutScore").value(10))
                .andExpect(jsonPath("$.uniqueDiscoveries").value(1));

        String board = mvc.perform(get("/api/v1/users/leaderboard"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode ranks = objectMapper.readTree(board);
        assertThat(ranks.size()).isLessThanOrEqualTo(10);
        assertThat(board).contains("\"username\":\"" + username + "\"");
    }

    @Test
    void aiEstimatesAreLabelledAndEarnNoPoints() throws Exception {
        String token = registerAndGetToken(newUsername());
        String barcode = validBarcode();
        when(openRouterService.fetchProductFromAi(barcode)).thenReturn(Optional.of(new AiProductResponseDto(
                "Guessed Biscuits", "Acme", "d", "https://invented.example/img.png", "wheat flour, sucre", "gluten",
                480.0, 30.0, 20.0, 6.0, 0.4)));

        mvc.perform(get("/api/v1/products/" + barcode).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("AI_ESTIMATE"))
                .andExpect(jsonPath("$.earnedPoints").value(0))
                .andExpect(jsonPath("$.imageUrl").doesNotExist())
                .andExpect(jsonPath("$.simplifiedIngredients").value("wheat flour, Sugar"));
    }

    @Test
    void aiIsNotAskedAboutBarcodesWithBadCheckDigits() throws Exception {
        String good = validBarcode();
        String bad = good.substring(0, 12) + ((good.charAt(12) - '0' + 1) % 10);

        mvc.perform(get("/api/v1/products/" + bad).with(ip("10.4.0.1"))).andExpect(status().isNotFound());
        verify(openFoodFactsService).fetchProductByBarcode(bad);
        verify(openRouterService, never()).fetchProductFromAi(bad);
    }

    @Test
    void guestScansAreMigratedOnceOnLogin() throws Exception {
        String barcode = stubOffProduct("A");
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.5.0.1"))).andExpect(status().isOk());

        String username = newUsername();
        register(username, username + "@example.com", List.of(barcode, barcode, "junk"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.migratedScansCount").value(1));

        // Same guest list again: already in the log, so nothing new
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(new LoginBody(username, PASSWORD, List.of(barcode)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.migratedScansCount").value(0));
    }

    // ---------------------------------------------------------------- profile

    @Test
    void emailChangeReturnsAWorkingNewToken() throws Exception {
        String username = newUsername();
        String oldToken = registerAndGetToken(username);
        String newEmail = "moved-" + username + "@example.com";

        String body = mvc.perform(put("/api/v1/users/profile").header(HttpHeaders.AUTHORIZATION, bearer(oldToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ProfileBody("New Name", username, newEmail, "Vegan", "Peanuts", "None"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(newEmail))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String newToken = objectMapper.readTree(body).get("token").asText();

        mvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, bearer(newToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("New Name"));
        // The old token names an email that no longer exists
        mvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, bearer(oldToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usernameChangeIsRateLimitedAndReported() throws Exception {
        String username = newUsername();
        String token = registerAndGetToken(username);
        String renamed = newUsername();

        String body = mvc.perform(put("/api/v1/users/profile").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ProfileBody("Name", renamed, username + "@example.com", null, null, null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(renamed))
                .andExpect(jsonPath("$.lastUsernameChange").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String token2 = objectMapper.readTree(body).get("token").asText();

        mvc.perform(put("/api/v1/users/profile").header(HttpHeaders.AUTHORIZATION, bearer(token2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ProfileBody("Name", newUsername(), username + "@example.com", null, null, null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("once every 20 days")));
    }

    @Test
    void profileFieldsAreLengthLimited() throws Exception {
        String username = newUsername();
        String token = registerAndGetToken(username);
        mvc.perform(put("/api/v1/users/profile").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ProfileBody("Name", username, username + "@example.com", null, null, "x".repeat(300)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.medicalConditions").exists());
    }

    @Test
    void changePasswordValidatesAndApplies() throws Exception {
        String username = newUsername();
        String token = registerAndGetToken(username);

        changePassword(token, "Wrong!Pass1", "New!Pass99")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Incorrect current password."));
        changePassword(token, PASSWORD, "weakpass")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.newPassword").exists());
        changePassword(token, PASSWORD, PASSWORD)
                .andExpect(status().isBadRequest());
        changePassword(token, PASSWORD, "New!Pass99").andExpect(status().isOk());

        login(username, PASSWORD).andExpect(status().isUnauthorized());
        login(username, "New!Pass99").andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- helpers

    private record RegisterBody(String username, String fullName, String email, String password, List<String> guestBarcodes) {}
    private record LoginBody(String email, String password, List<String> guestBarcodes) {}
    private record ProfileBody(String fullName, String username, String email, String dietaryPreference, String allergies, String medicalConditions) {}
    private record PasswordBody(String currentPassword, String newPassword) {}

    private org.springframework.test.web.servlet.ResultActions register(String username, String email, List<String> guestBarcodes) throws Exception {
        return mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterBody(username, "Test User", email, PASSWORD, guestBarcodes))));
    }

    private org.springframework.test.web.servlet.ResultActions login(String identifier, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json(new LoginBody(identifier, password, null))));
    }

    private org.springframework.test.web.servlet.ResultActions changePassword(String token, String current, String next) throws Exception {
        return mvc.perform(post("/api/v1/users/change-password").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(json(new PasswordBody(current, next))));
    }

    private String registerAndGetToken(String username) throws Exception {
        String body = register(username, username + "@example.com", List.of())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    /** Stubs Open Food Facts to know a fresh barcode and returns it. */
    private String stubOffProduct(String nutriScore) {
        String barcode = validBarcode();
        when(openFoodFactsService.fetchProductByBarcode(barcode)).thenReturn(Optional.of(new OpenFoodFactsProductDto(
                "Test Spread", null, null, "Acme", nutriScore.toLowerCase(), "https://images.example/x.jpg",
                "Sucre, huile de palme, lait écrémé", null, "lait", List.of("en:milk", "en:nuts"),
                new NutrimentsDto(539.0, 56.3, 30.9, 6.3, 0.04),
                List.of("en:spreads", "en:sweet-spreads", "fr:pâtes-à-tartiner"))));
        return barcode;
    }

    // ---------------------------------------------------------------- insights

    @Test
    void insightsRequireAScannedProduct() throws Exception {
        mvc.perform(get("/api/v1/products/" + validBarcode() + "/insights"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Scan this product first to see its analysis."));
        mvc.perform(get("/api/v1/products/abc/insights")).andExpect(status().isBadRequest());
    }

    @Test
    void insightsExplainTheProductAndSuggestBetterAlternatives() throws Exception {
        String barcode = stubOffProduct("E");
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.6.0.1"))).andExpect(status().isOk());

        when(openFoodFactsService.searchByCategory(eq("en:sweet-spreads"), eq(List.of("a", "b", "c")), anyInt()))
                .thenReturn(List.of(
                        new OffSearchResponseDto.Hit("3000000000017", "Pâte noisette", null, List.of("Bio"), "c", null),
                        new OffSearchResponseDto.Hit(barcode, "Same product", null, null, "a", null),
                        new OffSearchResponseDto.Hit("3000000000024", "Date spread", "Date spread", List.of("Fruity"), "a", "https://img/x.jpg"),
                        new OffSearchResponseDto.Hit("not-a-barcode", "Broken", null, null, "a", null)));

        mvc.perform(get("/api/v1/products/" + barcode + "/insights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verdict").value("Avoid"))
                .andExpect(jsonPath("$.summarySource").value("NUTRIBOT"))
                .andExpect(jsonPath("$.summary").value(org.hamcrest.Matchers.containsString("occasional treat")))
                .andExpect(jsonPath("$.highlights[?(@.title == 'High in sugar')].tone").value("bad"))
                .andExpect(jsonPath("$.highlights[?(@.title == 'Contains palm oil')]").exists())
                .andExpect(jsonPath("$.personalized").value(false))
                .andExpect(jsonPath("$.personalAlerts.length()").value(0))
                .andExpect(jsonPath("$.alternativesCategory").value("Sweet spreads"))
                .andExpect(jsonPath("$.alternatives.length()").value(2))
                .andExpect(jsonPath("$.alternatives[0].barcode").value("3000000000024"))
                .andExpect(jsonPath("$.alternatives[0].nutriScore").value("A"))
                .andExpect(jsonPath("$.alternatives[1].brand").value("Bio"));

        // Cached: the search service is not called again
        mvc.perform(get("/api/v1/products/" + barcode + "/insights")).andExpect(status().isOk());
        verify(openFoodFactsService, times(1)).searchByCategory(anyString(), any(), anyInt());
    }

    @Test
    void insightsArePersonalisedForSignedInUsers() throws Exception {
        String username = newUsername();
        String token = registerAndGetToken(username);
        mvc.perform(put("/api/v1/users/profile").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ProfileBody("Name", username, username + "@example.com", "Vegan", "Dairy, Peanuts", "Type 2 diabetes"))))
                .andExpect(status().isOk());

        String barcode = stubOffProduct("E");
        mvc.perform(get("/api/v1/products/" + barcode).header(HttpHeaders.AUTHORIZATION, bearer(token))).andExpect(status().isOk());

        mvc.perform(get("/api/v1/products/" + barcode + "/insights").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalized").value(true))
                .andExpect(jsonPath("$.personalAlerts[?(@.title == 'Contains Dairy')].tone").value("bad"))
                .andExpect(jsonPath("$.personalAlerts[?(@.title == 'May not be vegan')]").exists())
                .andExpect(jsonPath("$.personalAlerts[?(@.title == 'Watch the sugar')]").exists())
                .andExpect(jsonPath("$.personalAlerts[?(@.title == 'Contains Peanuts')]").doesNotExist());
    }

    @Test
    void aiSummaryIsUsedWhenAvailable() throws Exception {
        String barcode = stubOffProduct("C");
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.7.0.1"))).andExpect(status().isOk());
        when(openRouterService.summarizeProduct(any(), anyBoolean()))
                .thenReturn(Optional.of("A sweet spread with 56 g of sugar per 100 g. Use it sparingly."));

        mvc.perform(get("/api/v1/products/" + barcode + "/insights"))
                .andExpect(jsonPath("$.summarySource").value("AI"))
                .andExpect(jsonPath("$.summary").value("A sweet spread with 56 g of sugar per 100 g. Use it sparingly."));
    }

    /** A unique EAN-13 with a correct check digit. */
    private static String validBarcode() {
        String payload = String.format("29%05d%05d", Math.abs(RUN.hashCode()) % 100_000, SEQ.incrementAndGet());
        int sum = 0;
        for (int i = payload.length() - 1, pos = 0; i >= 0; i--, pos++) {
            int d = payload.charAt(i) - '0';
            sum += (pos % 2 == 0) ? d * 3 : d;
        }
        return payload + ((10 - sum % 10) % 10);
    }

    private static String newUsername() {
        return "u" + uniqueSuffix();
    }

    // Lowercase/digits only, at most 14 chars
    private static String uniqueSuffix() {
        return (RUN + SEQ.incrementAndGet()).toLowerCase();
    }

    private static RequestPostProcessor ip(String address) {
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private String json(Object value) {
        return objectMapper.writeValueAsString(value);
    }
}
