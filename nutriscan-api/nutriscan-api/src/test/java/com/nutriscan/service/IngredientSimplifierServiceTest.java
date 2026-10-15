package com.nutriscan.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IngredientSimplifierServiceTest {

    private final IngredientSimplifierService simplifier = new IngredientSimplifierService();

    @Test
    void translatesKnownTermsAndUnescapesHtml() {
        assertThat(simplifier.simplify("Sucre, huile de palme, NOISETTES 13% &amp; vanilline"))
                .isEqualTo("Sugar, Palm Oil, Hazelnuts 13% & Vanillin (flavor enhancer)");
    }

    @Test
    void handlesBlankInput() {
        assertThat(simplifier.simplify(null)).isEqualTo("No ingredients provided.");
        assertThat(simplifier.simplify("  ")).isEqualTo("No ingredients provided.");
    }
}
