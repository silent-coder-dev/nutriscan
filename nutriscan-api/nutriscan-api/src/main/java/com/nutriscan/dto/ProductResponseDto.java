package com.nutriscan.dto;

import com.nutriscan.entity.Product;
import com.nutriscan.service.VegClassifier;
import com.nutriscan.util.NutriScores;

public record ProductResponseDto(
        Long id,
        String barcode,
        String productName,
        String brand,
        String nutriScore,
        String imageUrl,
        String ingredientsText,
        String simplifiedIngredients,
        String allergens,
        Double calories100g,
        Double sugars100g,
        Double fat100g,
        Double proteins100g,
        Double sodium100g,
        String source,
        // VEG | NON_VEG | UNKNOWN (Indian veg mark)
        String vegStatus,
        boolean isNewDiscovery,
        int earnedPoints,
        int totalScoutScore,
        int totalUniqueDiscoveries
) {
    public static ProductResponseDto fromEntity(
            Product product,
            boolean isNewDiscovery,
            int earnedPoints,
            int totalScoutScore,
            int totalUniqueDiscoveries
    ) {
        return new ProductResponseDto(
                product.getId(),
                product.getBarcode(),
                product.getProductName(),
                product.getBrand(),
                NutriScores.normalize(product.getNutriScore()),
                product.getImageUrl(),
                product.getIngredientsText(),
                product.getSimplifiedIngredients(),
                product.getAllergens(),
                product.getCalories100g(),
                product.getSugars100g(),
                product.getFat100g(),
                product.getProteins100g(),
                product.getSodium100g(),
                product.getSource() != null ? product.getSource().name() : null,
                VegClassifier.classify(product),
                isNewDiscovery,
                earnedPoints,
                totalScoutScore,
                totalUniqueDiscoveries
        );
    }

    public static ProductResponseDto fromEntity(Product product) {
        return fromEntity(product, false, 0, 0, 0);
    }
}
