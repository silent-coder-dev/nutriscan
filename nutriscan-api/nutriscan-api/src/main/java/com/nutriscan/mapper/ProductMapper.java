package com.nutriscan.mapper;

import com.nutriscan.dto.NutrimentsDto;
import com.nutriscan.dto.OpenFoodFactsProductDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.ProductSource;
import com.nutriscan.util.NutriScores;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public Product toEntity(String barcode , OpenFoodFactsProductDto dto){
        NutrimentsDto nutrimentsDto = dto.nutriments();
        return Product.builder()
                .barcode(barcode)
                .productName(firstNonBlank(dto.productName(), dto.productNameEn(), dto.genericName(), "Unknown Product"))
                .brand(blankToNull(dto.brands()))
                .nutriScore(NutriScores.normalize(dto.nutriScore()))
                .imageUrl(blankToNull(dto.imgUrl()))
                // English text when available, so the UI is not shown e.g. French labels
                .ingredientsText(firstNonBlank(dto.ingredientTextEn(), dto.ingredientText(), null))
                .allergens(readableAllergens(dto))
                .calories100g(nutrimentsDto != null ? nutrimentsDto.calories100g() : null)
                .sugars100g(nutrimentsDto != null ? nutrimentsDto.sugars100g() : null)
                .fat100g(nutrimentsDto != null ? nutrimentsDto.fat100g() : null)
                .proteins100g(nutrimentsDto != null ? nutrimentsDto.proteins100g() : null)
                .sodium100g(nutrimentsDto != null ? nutrimentsDto.sodium100g() : null)
                .source(ProductSource.OPEN_FOOD_FACTS)
                .categoryTags(OpenFoodFactsProductDto.englishCategoryTags(dto.categoriesTags()))
                .build();
    }

    // ["en:milk", "en:soybeans"] -> "Milk, Soybeans"; falls back to the raw text field
    private static String readableAllergens(OpenFoodFactsProductDto dto) {
        List<String> tags = dto.allergensTags();
        if (tags != null && !tags.isEmpty()) {
            String joined = tags.stream()
                    .filter(tag -> tag != null && !tag.isBlank())
                    .map(ProductMapper::humanizeTag)
                    .distinct()
                    .collect(Collectors.joining(", "));
            if (!joined.isBlank()) {
                return joined;
            }
        }
        return blankToNull(dto.allergens());
    }

    private static String humanizeTag(String tag) {
        String value = tag.contains(":") ? tag.substring(tag.indexOf(':') + 1) : tag;
        value = value.replace('-', ' ').trim();
        if (value.isEmpty()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }

    private static String firstNonBlank(String a, String b, String fallback) {
        if (a != null && !a.isBlank()) return a.trim();
        if (b != null && !b.isBlank()) return b.trim();
        return fallback;
    }

    private static String firstNonBlank(String a, String b, String c, String fallback) {
        return firstNonBlank(a, b, firstNonBlank(c, null, fallback));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

}
