package com.nutriscan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenFoodFactsProductDto(

        @JsonProperty("product_name")
        String productName,

        @JsonProperty("product_name_en")
        String productNameEn,

        @JsonProperty("generic_name")
        String genericName,

        @JsonProperty("brands")
        String brands,

        @JsonProperty("nutriscore_grade")
        String nutriScore,

        @JsonProperty("image_url")
        String imgUrl,

        @JsonProperty("ingredients_text")
        String ingredientText,

        @JsonProperty("ingredients_text_en")
        String ingredientTextEn,

        @JsonProperty("allergens")
        String allergens,

        // e.g. ["en:milk", "en:nuts"]: language-neutral, preferred over the free-text field
        @JsonProperty("allergens_tags")
        List<String> allergensTags,

        @JsonProperty("nutriments")
        NutrimentsDto nutriments,

        // General -> specific, e.g. ["en:beverages", "en:sodas", "en:colas"]
        @JsonProperty("categories_tags")
        List<String> categoriesTags
) {
    /** Comma-separated list of every field the mapper reads, for the OFF "fields" filter. */
    public static final String REQUESTED_FIELDS = String.join(",",
            "product_name", "product_name_en", "generic_name", "brands", "nutriscore_grade",
            "image_url", "ingredients_text", "ingredients_text_en", "allergens", "allergens_tags",
            "nutriments", "categories_tags");

    /**
     * Up to the four most specific English category tags, general -> specific, comma-separated.
     * Only taxonomy slugs count: OFF also lists unrecognised user text like "en:Produits à tartiner".
     */
    public static String englishCategoryTags(List<String> tags) {
        if (tags == null) return null;
        List<String> english = tags.stream()
                .filter(OpenFoodFactsProductDto::isTaxonomyTag)
                .toList();
        if (english.isEmpty()) return null;
        return String.join(",", english.subList(Math.max(0, english.size() - 4), english.size()));
    }

    public static boolean isTaxonomyTag(String tag) {
        return tag != null && tag.matches("en:[a-z0-9]+(-[a-z0-9]+)*");
    }
}
