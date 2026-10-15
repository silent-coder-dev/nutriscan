package com.nutriscan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiProductResponseDto(
        String productName,
        String brand,
        String nutriScore,
        String imageUrl,
        String ingredientsText,
        String allergens,
        Double calories100g,
        Double sugars100g,
        Double fat100g,
        Double proteins100g,
        Double sodium100g
) {
}
