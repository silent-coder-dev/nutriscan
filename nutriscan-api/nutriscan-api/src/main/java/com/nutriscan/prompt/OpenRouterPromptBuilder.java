package com.nutriscan.prompt;

import com.nutriscan.entity.Product;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class OpenRouterPromptBuilder {

    public String builProductPrompt(String barcode) {
        return """
                You are a food nutrition database assistant. Given the product barcode "%s", identify the exact food product if known, or estimate realistic values based on typical products for this barcode prefix.

                Respond ONLY with a valid JSON object matching this schema without markdown fences:
                {
                  "productName": "string",
                  "brand": "string",
                  "nutriScore": "A|B|C|D|E|UNKNOWN",
                  "imageUrl": null,
                  "ingredientsText": "string",
                  "allergens": "string",
                  "calories100g": 0.0,
                  "sugars100g": 0.0,
                  "fat100g": 0.0,
                  "proteins100g": 0.0,
                  "sodium100g": 0.0
                }

                If completely unable to find or estimate any product info, return: {}
                """.formatted(barcode);
    }

    /** Asks for a short, factual verdict grounded only in the product data we hold. */
    public String buildSummaryPrompt(Product product, boolean isBeverage) {
        String unit = isBeverage ? "100 ml" : "100 g";

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("name", product.getProductName());
        data.put("brand", product.getBrand());
        data.put("nutriScore", product.getNutriScore());
        data.put("per", unit);
        data.put("energyKcal", product.getCalories100g());
        data.put("sugarsG", product.getSugars100g());
        data.put("fatG", product.getFat100g());
        data.put("proteinG", product.getProteins100g());
        data.put("saltG", product.getSodium100g() != null ? Math.round(product.getSodium100g() * 2.5 * 100) / 100.0 : null);
        data.put("ingredients", truncate(product.getIngredientsText(), 600));
        data.put("allergens", product.getAllergens());

        String facts = data.entrySet().stream()
                .filter(e -> e.getValue() != null)
                .map(e -> "- " + e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining("\n"));

        return """
                You are NutriBot, the friendly guide inside a food-scanning app.
                Write a plain-English verdict on this product for a general adult, in 2 or 3 short sentences (under 60 words).
                Lead with the single most important concern or benefit, quoting the numbers given (per %s), then give one practical tip.
                No markdown, no lists, no emojis, no medical claims. Use only the facts below; do not invent anything.

                Product facts:
                %s
                """.formatted(unit, facts);
    }

    private static String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
