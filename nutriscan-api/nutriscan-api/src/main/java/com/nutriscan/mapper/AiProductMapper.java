package com.nutriscan.mapper;

import com.nutriscan.dto.AiProductResponseDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.ProductSource;
import com.nutriscan.util.NutriScores;
import org.springframework.stereotype.Component;

@Component
public class AiProductMapper {

    public Product toEntity(String barcode , AiProductResponseDto aiDto){
        return Product.builder()
                .barcode(barcode)
                .productName(aiDto.productName() != null && !aiDto.productName().isBlank() ? aiDto.productName().trim() : "Unknown Product")
                .brand(aiDto.brand())
                .nutriScore(NutriScores.normalize(aiDto.nutriScore()))
                // The prompt asks for null; never trust a model-invented image URL
                .imageUrl(null)
                .ingredientsText(aiDto.ingredientsText())
                .allergens(aiDto.allergens())
                .calories100g(aiDto.calories100g())
                .sugars100g(aiDto.sugars100g())
                .fat100g(aiDto.fat100g())
                .proteins100g(aiDto.proteins100g())
                .sodium100g(aiDto.sodium100g())
                .source(ProductSource.AI_ESTIMATE)
                .build();
    }
}
