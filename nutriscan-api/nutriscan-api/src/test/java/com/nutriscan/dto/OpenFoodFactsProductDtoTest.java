package com.nutriscan.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OpenFoodFactsProductDtoTest {

    @Test
    void keepsOnlyEnglishTaxonomyTagsMostSpecificLast() {
        // Real Nutella categories: valid slugs followed by unrecognised user text
        List<String> tags = List.of("en:breakfasts", "en:spreads", "en:sweet-spreads", "en:confectionary-based-spreads",
                "en:Petit-déjeuners", "en:Produits à tartiner", "fr:Goûter", "fr:Nutella");

        assertThat(OpenFoodFactsProductDto.englishCategoryTags(tags))
                .isEqualTo("en:breakfasts,en:spreads,en:sweet-spreads,en:confectionary-based-spreads");
    }

    @Test
    void capsAtFourAndHandlesMissingTags() {
        List<String> tags = List.of("en:beverages-and-beverages-preparations", "en:beverages", "en:carbonated-drinks",
                "en:soft-drinks", "en:sodas", "en:colas");
        assertThat(OpenFoodFactsProductDto.englishCategoryTags(tags)).isEqualTo("en:carbonated-drinks,en:soft-drinks,en:sodas,en:colas");
        assertThat(OpenFoodFactsProductDto.englishCategoryTags(null)).isNull();
        assertThat(OpenFoodFactsProductDto.englishCategoryTags(List.of("fr:goûter"))).isNull();
    }
}
