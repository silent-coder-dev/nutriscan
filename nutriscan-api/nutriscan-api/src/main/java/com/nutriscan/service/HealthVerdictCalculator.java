package com.nutriscan.service;

import com.nutriscan.entity.Product;
import com.nutriscan.util.NutriScores;

/**
 * Turns a product into the Clean / Moderate / Avoid verdict shown in the scan log.
 * Uses the Nutri-Score when available, otherwise UK FSA front-of-pack
 * "traffic light" thresholds per 100 g.
 */
public final class HealthVerdictCalculator {

    public static final String CLEAN = "Clean";
    public static final String MODERATE = "Moderate";
    public static final String AVOID = "Avoid";

    // FSA thresholds per 100 g (food)
    private static final double SUGAR_HIGH = 22.5, SUGAR_LOW = 5.0;
    private static final double FAT_HIGH = 17.5, FAT_LOW = 3.0;
    private static final double SALT_HIGH = 1.5, SALT_LOW = 0.3;
    private static final double SODIUM_TO_SALT = 2.5;

    private HealthVerdictCalculator() {
    }

    public static String evaluate(Product product) {
        switch (NutriScores.normalize(product.getNutriScore())) {
            case "A", "B" -> { return CLEAN; }
            case "C" -> { return MODERATE; }
            case "D", "E" -> { return AVOID; }
            default -> { /* fall through to nutrient thresholds */ }
        }

        Double sugars = product.getSugars100g();
        Double fat = product.getFat100g();
        Double salt = product.getSodium100g() != null ? product.getSodium100g() * SODIUM_TO_SALT : null;

        if (isAbove(sugars, SUGAR_HIGH) || isAbove(fat, FAT_HIGH) || isAbove(salt, SALT_HIGH)) {
            return AVOID;
        }
        if (isAtMost(sugars, SUGAR_LOW) && isAtMost(fat, FAT_LOW) && isAtMost(salt, SALT_LOW)) {
            return CLEAN;
        }
        return MODERATE;
    }

    private static boolean isAbove(Double value, double limit) {
        return value != null && value > limit;
    }

    // Missing data never counts as "low"
    private static boolean isAtMost(Double value, double limit) {
        return value != null && value <= limit;
    }
}
