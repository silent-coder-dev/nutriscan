package com.nutriscan.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.nutriscan.dto.InsightPointDto;
import com.nutriscan.dto.OffSearchResponseDto;
import com.nutriscan.dto.OpenFoodFactsProductDto;
import com.nutriscan.dto.ProductAlternativeDto;
import com.nutriscan.dto.ProductInsightsDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.ProductSource;
import com.nutriscan.entity.User;
import com.nutriscan.exception.ApiException;
import com.nutriscan.mapper.ProductMapper;
import com.nutriscan.repository.ProductRepository;
import com.nutriscan.repository.UserRepository;
import com.nutriscan.util.NutriScores;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Builds the "NutriBot's take" panel: summary, findings, personal alerts and
 * better-rated alternatives. Network-backed parts (AI summary, alternatives) are
 * cached per barcode; personal alerts are computed per request and never cached.
 */
@Slf4j
@Service
public class ProductInsightService {

    private static final int MAX_ALTERNATIVES = 4;
    private static final Duration CACHE_TTL = Duration.ofHours(6);

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OpenFoodFactsService openFoodFactsService;
    private final OpenRouterService openRouterService;
    private final ProductMapper productMapper;
    private final IngredientSimplifierService ingredientSimplifierService;

    private final Cache<String, String> aiSummaries = Caffeine.newBuilder()
            .expireAfterWrite(CACHE_TTL).maximumSize(5_000).build();
    private final Cache<String, AlternativeSet> alternatives = Caffeine.newBuilder()
            .expireAfterWrite(CACHE_TTL).maximumSize(5_000).build();
    // Barcodes whose categories were already looked up, so misses are not re-fetched on every view
    private final Cache<String, Boolean> categoryLookups = Caffeine.newBuilder()
            .expireAfterWrite(CACHE_TTL).maximumSize(5_000).build();

    private record AlternativeSet(List<ProductAlternativeDto> items, String category) {
        static final AlternativeSet EMPTY = new AlternativeSet(List.of(), null);
    }

    public ProductInsightService(ProductRepository productRepository, UserRepository userRepository,
                                 OpenFoodFactsService openFoodFactsService, OpenRouterService openRouterService,
                                 ProductMapper productMapper, IngredientSimplifierService ingredientSimplifierService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.openFoodFactsService = openFoodFactsService;
        this.openRouterService = openRouterService;
        this.productMapper = productMapper;
        this.ingredientSimplifierService = ingredientSimplifierService;
    }

    public ProductInsightsDto getInsights(String barcode, String userEmail) {
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> ApiException.notFound("Scan this product first to see its analysis."));

        ensureCategories(product);
        ProductAnalyzer.Analysis analysis = ProductAnalyzer.analyze(product);

        Optional<String> aiSummary = aiSummary(product, analysis.beverage());
        AlternativeSet alternativeSet = alternatives(product);

        Optional<User> user = Optional.ofNullable(userEmail)
                .flatMap(email -> userRepository.findByEmail(email.toLowerCase(Locale.ROOT).trim()));
        List<InsightPointDto> personalAlerts = user
                .map(u -> PersonalAlertChecker.check(product, u, analysis.beverage()))
                .orElse(List.of());

        return new ProductInsightsDto(
                product.getBarcode(),
                analysis.verdict(),
                aiSummary.orElse(analysis.summary()),
                aiSummary.isPresent() ? "AI" : "NUTRIBOT",
                analysis.highlights(),
                personalAlerts,
                user.isPresent(),
                alternativeSet.items(),
                alternativeSet.category()
        );
    }

    // Rows saved before categories were tracked: fetch them once from Open Food Facts
    private void ensureCategories(Product product) {
        if (!categoryTags(product).isEmpty() || product.getSource() == ProductSource.AI_ESTIMATE
                || categoryLookups.getIfPresent(product.getBarcode()) != null) {
            return;
        }
        categoryLookups.put(product.getBarcode(), Boolean.TRUE);
        openFoodFactsService.fetchProductByBarcode(product.getBarcode()).ifPresent(dto -> {
            product.setCategoryTags(OpenFoodFactsProductDto.englishCategoryTags(dto.categoriesTags()));

            // Rows saved before source tracking also predate the English label mapping: refresh the text
            if (product.getSource() == null) {
                Product fresh = productMapper.toEntity(product.getBarcode(), dto);
                product.setSource(ProductSource.OPEN_FOOD_FACTS);
                product.setAllergens(fresh.getAllergens());
                if (fresh.getIngredientsText() != null) {
                    product.setIngredientsText(fresh.getIngredientsText());
                    product.setSimplifiedIngredients(ingredientSimplifierService.simplify(fresh.getIngredientsText()));
                }
            }
            try {
                productRepository.save(product);
            } catch (RuntimeException e) {
                log.warn("Could not refresh {} from Open Food Facts: {}", product.getBarcode(), e.getMessage());
            }
        });
    }

    private Optional<String> aiSummary(Product product, boolean beverage) {
        String cached = aiSummaries.getIfPresent(product.getBarcode());
        if (cached != null) {
            return Optional.of(cached);
        }
        // Failures are not cached, so a later request can try again
        Optional<String> summary = openRouterService.summarizeProduct(product, beverage);
        summary.ifPresent(text -> aiSummaries.put(product.getBarcode(), text));
        return summary;
    }

    private AlternativeSet alternatives(Product product) {
        AlternativeSet cached = alternatives.getIfPresent(product.getBarcode());
        if (cached != null) {
            return cached;
        }

        List<String> betterGrades = betterGrades(NutriScores.normalize(product.getNutriScore()));
        List<String> categories = categoryTags(product);
        if (betterGrades.isEmpty() || categories.isEmpty()) {
            return AlternativeSet.EMPTY;
        }

        try {
            // Most specific category first; widen once if it has too few better options
            AlternativeSet result = AlternativeSet.EMPTY;
            for (int i = categories.size() - 1; i >= Math.max(0, categories.size() - 2); i--) {
                String category = categories.get(i);
                List<ProductAlternativeDto> found = toAlternatives(
                        openFoodFactsService.searchByCategory(category, betterGrades, 16), product.getBarcode());
                if (found.size() > result.items().size()) {
                    result = new AlternativeSet(found, humanizeCategory(category));
                }
                if (found.size() >= 2) break;
            }
            alternatives.put(product.getBarcode(), result);
            return result;
        } catch (Exception e) {
            log.warn("Alternative search failed for {}: {}", product.getBarcode(), e.getMessage());
            return AlternativeSet.EMPTY;
        }
    }

    private static List<ProductAlternativeDto> toAlternatives(List<OffSearchResponseDto.Hit> hits, String excludeBarcode) {
        List<ProductAlternativeDto> items = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();
        for (OffSearchResponseDto.Hit hit : hits) {
            String name = firstNonBlank(hit.productNameEn(), hit.productName());
            if (hit.code() == null || name == null || hit.code().equals(excludeBarcode)) continue;
            if (!hit.code().matches("\\d{8,14}")) continue;
            if (!seenNames.add(name.toLowerCase(Locale.ROOT))) continue;

            String brand = hit.brands() == null || hit.brands().isEmpty() ? null : hit.brands().get(0).trim();
            items.add(new ProductAlternativeDto(hit.code(), name.trim(), brand,
                    NutriScores.normalize(hit.nutriscoreGrade()), hit.imageUrl()));
        }
        // Best grade first; popularity order is kept within a grade (stable sort)
        items.sort(Comparator.comparing(ProductAlternativeDto::nutriScore));
        return items.subList(0, Math.min(MAX_ALTERNATIVES, items.size()));
    }

    /** Grades strictly better than the current one, as lowercase search values. */
    static List<String> betterGrades(String grade) {
        return switch (grade) {
            case "B" -> List.of("a");
            case "C", NutriScores.UNKNOWN -> List.of("a", "b");
            case "D", "E" -> List.of("a", "b", "c");
            default -> List.of(); // A is already the best
        };
    }

    private static List<String> categoryTags(Product product) {
        if (product.getCategoryTags() == null || product.getCategoryTags().isBlank()) return List.of();
        // Rows stored before tag validation may hold non-taxonomy text; those are ignored (and re-fetched)
        return List.of(product.getCategoryTags().split(",")).stream()
                .map(String::trim)
                .filter(OpenFoodFactsProductDto::isTaxonomyTag)
                .toList();
    }

    // "en:hazelnut-spreads" -> "Hazelnut spreads"
    static String humanizeCategory(String tag) {
        String value = tag.contains(":") ? tag.substring(tag.indexOf(':') + 1) : tag;
        value = value.replace('-', ' ').trim();
        return value.isEmpty() ? null : value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }
}
