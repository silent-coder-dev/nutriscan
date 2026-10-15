package com.nutriscan.dto;

/** A better-rated product from the same category, scannable by its barcode. */
public record ProductAlternativeDto(
        String barcode,
        String productName,
        String brand,
        String nutriScore,
        String imageUrl
) {
}
