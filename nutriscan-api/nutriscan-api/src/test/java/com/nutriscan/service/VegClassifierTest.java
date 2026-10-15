package com.nutriscan.service;

import com.nutriscan.entity.Product;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VegClassifierTest {

    @Test
    void milkAndHoneyAreVeg() {
        assertThat(classify("Sugar, palm oil, hazelnuts, skimmed milk powder, honey", "Milk, Nuts")).isEqualTo("VEG");
    }

    @Test
    void meatFishEggsAndGelatinAreNonVeg() {
        assertThat(classify("Chicken (60%), water, salt", null)).isEqualTo("NON_VEG");
        assertThat(classify("Wheat flour, egg yolk, sugar", null)).isEqualTo("NON_VEG");
        assertThat(classify("glucose syrup, gélatine, citric acid", null)).isEqualTo("NON_VEG");
        assertThat(classify("rice, tuna, oil", null)).isEqualTo("NON_VEG");
        assertThat(classify("sugar, colour (E120)", null)).isEqualTo("NON_VEG");
        assertThat(classify("flour, sugar", "Eggs")).isEqualTo("NON_VEG");
    }

    @Test
    void tracesAndLookAlikesDoNotCount() {
        assertThat(classify("Wheat flour, sugar. May contain traces of egg and fish.", null)).isEqualTo("VEG");
        assertThat(classify("eggplant, champignons, codium seaweed, hamamelis", null)).isEqualTo("VEG");
        assertThat(classify("Eggs, sugar, anchovies", null)).isEqualTo("NON_VEG"); // plurals still count
    }

    @Test
    void noLabelMeansUnknown() {
        assertThat(classify(null, null)).isEqualTo("UNKNOWN");
        assertThat(classify("  ", "")).isEqualTo("UNKNOWN");
    }

    private static String classify(String ingredients, String allergens) {
        return VegClassifier.classify(Product.builder().ingredientsText(ingredients).allergens(allergens).build());
    }
}
