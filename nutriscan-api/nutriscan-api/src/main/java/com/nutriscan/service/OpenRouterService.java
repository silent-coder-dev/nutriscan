package com.nutriscan.service;

import com.nutriscan.dto.AiProductResponseDto;
import com.nutriscan.entity.Product;
import com.nutriscan.parser.AiResponseParser;
import com.nutriscan.prompt.OpenRouterPromptBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class OpenRouterService {

    private static final String PLACEHOLDER_KEY = "dummy_key";

    private final RestClient restClient;
    private final OpenRouterPromptBuilder promptBuilder;
    private final AiResponseParser responseParser;
    private final String apiKey;
    private final String modelName;

    public OpenRouterService(
            @Qualifier("openRouterRestClient") RestClient restClient,
            OpenRouterPromptBuilder promptBuilder,
            AiResponseParser responseParser,
            @Value("${openrouter.api.key:" + PLACEHOLDER_KEY + "}") String apiKey,
            @Value("${openrouter.model:apodex/apodex-1.1-mini:free}") String modelName
    ) {
        this.restClient = restClient;
        this.promptBuilder = promptBuilder;
        this.responseParser = responseParser;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.modelName = modelName;

        if (!isConfigured()) {
            log.warn("OPENROUTER_API_KEY is not set: the AI product fallback is disabled.");
        }
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty() && !PLACEHOLDER_KEY.equals(apiKey);
    }

    public Optional<AiProductResponseDto> fetchProductFromAi(String barcode) {
        if (!isConfigured()) {
            return Optional.empty();
        }

        log.info("[OpenRouter] Querying model {} for barcode {}", modelName, barcode);

        Map<String, Object> requestBody = Map.of(
                "model", modelName,
                "messages", List.of(Map.of("role", "user", "content", promptBuilder.builProductPrompt(barcode)))
        );

        try {
            String rawResponse = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            log.debug("[OpenRouter] Raw response: {}", rawResponse);

            Optional<AiProductResponseDto> parsed = responseParser.parseProductResponse(rawResponse);
            log.info("[OpenRouter] Barcode {} resolved: {}", barcode, parsed.isPresent());
            return parsed;
        } catch (Exception e) {
            log.warn("[OpenRouter] Request failed for barcode {}: {}", barcode, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * A short plain-English verdict on a known product, written by the model from its
     * stored data. Empty when the AI is not configured or the call fails.
     */
    public Optional<String> summarizeProduct(Product product, boolean isBeverage) {
        if (!isConfigured()) {
            return Optional.empty();
        }

        Map<String, Object> requestBody = Map.of(
                "model", modelName,
                "max_tokens", 220,
                "temperature", 0.4,
                "messages", List.of(Map.of("role", "user", "content", promptBuilder.buildSummaryPrompt(product, isBeverage)))
        );

        try {
            String rawResponse = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
            return responseParser.parseTextResponse(rawResponse, 600);
        } catch (Exception e) {
            log.warn("[OpenRouter] Summary failed for barcode {}: {}", product.getBarcode(), e.getMessage());
            return Optional.empty();
        }
    }
}
