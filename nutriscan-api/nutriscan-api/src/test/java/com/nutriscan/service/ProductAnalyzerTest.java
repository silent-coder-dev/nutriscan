package com.nutriscan.service;

import com.nutriscan.dto.InsightPointDto;
import com.nutriscan.entity.Product;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProductAnalyzerTest {

    @Test
    void sugaryTreatGetsClearReasons() {
        Product nutella = Product.builder()
                .productName("Nutella").nutriScore("E")
                .sugars100g(56.3).fat100g(30.9).sodium100g(0.0428).proteins100g(6.3).calories100g(539.0)
                .ingredientsText("Sugar, palm oil, hazelnuts 13%, emulsifier: lecithins (soy) E322, vanillin")
                .allergens("Milk, Nuts, Soybeans")
                .categoryTags("en:spreads,en:sweet-spreads")
                .build();

        ProductAnalyzer.Analysis analysis = ProductAnalyzer.analyze(nutella);

        assertThat(analysis.verdict()).isEqualTo("Avoid");
        assertThat(analysis.beverage()).isFalse();
        assertThat(analysis.summary())
                .startsWith("Nutella is best kept as an occasional treat.")
                .contains("high in sugar and fat")
                .contains("56.3 g of sugar per 100 g (about 14 teaspoons)")
                .contains("palm oil");
        assertThat(titles(analysis.highlights()))
                .contains("Nutri-Score E", "High in sugar", "High in fat", "Low in salt", "Energy-dense",
                        "Contains palm oil", "1 additive", "Allergens");
    }

    @Test
    void drinksUsePer100mlThresholds() {
        Product cola = Product.builder()
                .productName("Cola").nutriScore("UNKNOWN")
                .sugars100g(10.6).fat100g(0.0).sodium100g(0.0)
                .ingredientsText("carbonated water, sugar, colour (caramel E150d), acid (E338)")
                .categoryTags("en:beverages,en:sodas,en:colas")
                .build();

        ProductAnalyzer.Analysis analysis = ProductAnalyzer.analyze(cola);

        assertThat(analysis.beverage()).isTrue();
        assertThat(analysis.highlights())
                .anySatisfy(p -> {
                    assertThat(p.title()).isEqualTo("Some sugar");
                    assertThat(p.detail()).isEqualTo("10.6 g per 100 ml, about 3 teaspoons.");
                });
        assertThat(titles(analysis.highlights())).contains("2 additives").doesNotContain("Energy-dense");
        assertThat(analysis.summary()).contains("moderate amount of sugar: 10.6 g per 100 ml");
    }

    @Test
    void healthyFoodIsPraised() {
        Product oats = Product.builder()
                .productName("Rolled oats").nutriScore("A")
                .sugars100g(1.1).fat100g(2.8).sodium100g(0.004).proteins100g(13.5).calories100g(372.0)
                .build();

        ProductAnalyzer.Analysis analysis = ProductAnalyzer.analyze(oats);

        assertThat(analysis.verdict()).isEqualTo("Clean");
        assertThat(analysis.summary()).isEqualTo("Rolled oats is a good everyday choice. It's low in sugar, fat and salt.");
        assertThat(titles(analysis.highlights())).contains("Good source of protein").noneMatch(t -> t.startsWith("High"));
    }

    @Test
    void missingDataIsSaidPlainly() {
        Product unknown = Product.builder().productName("Unknown Product").build();
        assertThat(ProductAnalyzer.analyze(unknown).summary())
                .isEqualTo("This product doesn't have full nutrition data yet, so check the label on the pack.");
    }

    @Test
    void recognisesPalmOilHoweverItIsWritten() {
        for (String ingredients : List.of("Sugar, vegetable fat (palm), hazelnuts", "sucre, huile de palme",
                "aceite de palma", "graisse de palmiste", "palm oil")) {
            Product p = Product.builder().productName("X").sugars100g(1.0).ingredientsText(ingredients).build();
            assertThat(titles(ProductAnalyzer.analyze(p).highlights())).as(ingredients).contains("Contains palm oil");
        }
        Product vitaminC = Product.builder().productName("X").sugars100g(1.0).ingredientsText("ascorbyl palmitate").build();
        assertThat(titles(ProductAnalyzer.analyze(vitaminC).highlights())).doesNotContain("Contains palm oil");
    }

    @Test
    void findsDistinctAdditives() {
        assertThat(ProductAnalyzer.additives("E330, e-330, E 471, colour E150d")).containsExactly("E330", "E471", "E150d");
    }

    private static List<String> titles(List<InsightPointDto> points) {
        return points.stream().map(InsightPointDto::title).toList();
    }
}
