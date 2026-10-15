package com.nutriscan.service;

import com.nutriscan.dto.InsightPointDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PersonalAlertCheckerTest {

    private static final Product CHOCOLATE = Product.builder()
            .productName("Milk chocolate").sugars100g(55.0).sodium100g(0.04)
            .ingredientsText("Sugar, cocoa butter, whole milk powder, hazelnuts, emulsifier (soy lecithin)")
            .build();

    @Test
    void flagsDeclaredAllergiesFoundOnTheLabel() {
        List<String> titles = titles(PersonalAlertChecker.check(CHOCOLATE, user("Dairy, Tree Nuts, Peanuts", null, null), false));
        assertThat(titles).containsExactly("Contains Dairy", "Contains Tree Nuts");
    }

    @Test
    void plantBasedLookAlikesAreNotDairy() {
        Product darkChocolate = Product.builder()
                .ingredientsText("cocoa mass, sugar, cocoa butter, coconut milk, peanut butter").build();
        List<String> titles = titles(PersonalAlertChecker.check(darkChocolate, user("Dairy, Peanuts", "Vegan", null), false));
        // Peanut butter is still peanut, but none of these are dairy or animal products
        assertThat(titles).containsExactly("Contains Peanuts");
    }

    @Test
    void checksDietAndMedicalNotes() {
        List<String> titles = titles(PersonalAlertChecker.check(CHOCOLATE, user("None", "Vegan", "Type 2 diabetes"), false));
        assertThat(titles).containsExactly("May not be vegan", "Watch the sugar");

        Product gummies = Product.builder().ingredientsText("glucose syrup, sugar, gelatine, wine vinegar").build();
        assertThat(titles(PersonalAlertChecker.check(gummies, user(null, "Halal", null), false)))
                .containsExactly("Check halal status");
        assertThat(titles(PersonalAlertChecker.check(gummies, user(null, "Vegetarian", null), false)))
                .containsExactly("May not be vegetarian");
    }

    @Test
    void noFalseAlarmsOnWordFragments() {
        Product snack = Product.builder()
                .ingredientsText("coconuts, eggplant, maltodextrin, champignons").build();
        assertThat(PersonalAlertChecker.check(snack, user("Tree Nuts, Eggs, Gluten", "Halal", null), false)).isEmpty();
    }

    private static User user(String allergies, String diet, String medical) {
        return User.builder().allergies(allergies).dietaryPreference(diet).medicalConditions(medical).build();
    }

    private static List<String> titles(List<InsightPointDto> points) {
        return points.stream().map(InsightPointDto::title).toList();
    }
}
