package com.nutriscan.service;

import com.nutriscan.entity.Product;
import com.nutriscan.util.NutriScores;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HealthVerdictCalculatorTest {

    @Test
    void usesNutriScoreWhenGraded() {
        assertThat(HealthVerdictCalculator.evaluate(product("A", null, null, null))).isEqualTo("Clean");
        assertThat(HealthVerdictCalculator.evaluate(product("b", null, null, null))).isEqualTo("Clean");
        assertThat(HealthVerdictCalculator.evaluate(product("C", null, null, null))).isEqualTo("Moderate");
        assertThat(HealthVerdictCalculator.evaluate(product("E", 1.0, 1.0, 0.01))).isEqualTo("Avoid");
    }

    @Test
    void fallsBackToNutrientThresholds() {
        assertThat(HealthVerdictCalculator.evaluate(product("UNKNOWN", 30.0, 1.0, 0.01))).isEqualTo("Avoid");
        assertThat(HealthVerdictCalculator.evaluate(product(null, 1.0, 1.0, 1.0))).isEqualTo("Avoid"); // 2.5 g salt
        assertThat(HealthVerdictCalculator.evaluate(product("not-applicable", 2.0, 1.0, 0.05))).isEqualTo("Clean");
        assertThat(HealthVerdictCalculator.evaluate(product(null, 10.0, 5.0, 0.2))).isEqualTo("Moderate");
    }

    @Test
    void missingNutrientsAreNeverClean() {
        assertThat(HealthVerdictCalculator.evaluate(product(null, null, null, null))).isEqualTo("Moderate");
        assertThat(HealthVerdictCalculator.evaluate(product(null, 1.0, null, 0.01))).isEqualTo("Moderate");
    }

    @Test
    void normalizesNutriScores() {
        assertThat(NutriScores.normalize(" e ")).isEqualTo("E");
        assertThat(NutriScores.normalize("not-applicable")).isEqualTo("UNKNOWN");
        assertThat(NutriScores.normalize(null)).isEqualTo("UNKNOWN");
    }

    private static Product product(String nutriScore, Double sugars, Double fat, Double sodium) {
        return Product.builder()
                .barcode("3017620422003")
                .nutriScore(nutriScore)
                .sugars100g(sugars)
                .fat100g(fat)
                .sodium100g(sodium)
                .build();
    }
}
