package com.nutriscan.service;

import com.nutriscan.dto.InsightPointDto;
import com.nutriscan.entity.Product;
import com.nutriscan.util.NutriScores;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rule-based reading of a product's label: a short verdict plus key findings.
 * Uses UK FSA front-of-pack thresholds (separate limits for drinks), so it works
 * without any AI service and every statement is traceable to the data.
 */
public final class ProductAnalyzer {

    public record Analysis(String verdict, String summary, List<InsightPointDto> highlights, boolean beverage) {
    }

    private record Thresholds(double sugarHigh, double sugarLow, double fatHigh, double fatLow,
                              double saltHigh, double saltLow) {
    }

    private enum Level { LOW, MEDIUM, HIGH, UNKNOWN }

    // FSA per 100 g (food) / per 100 ml (drinks)
    private static final Thresholds FOOD = new Thresholds(22.5, 5.0, 17.5, 3.0, 1.5, 0.3);
    private static final Thresholds DRINK = new Thresholds(11.25, 2.5, 8.75, 1.5, 0.75, 0.3);

    private static final double SODIUM_TO_SALT = 2.5;
    private static final double GRAMS_PER_TEASPOON = 4.0;
    private static final double REFERENCE_KCAL = 2000.0;

    private static final Pattern E_NUMBER = Pattern.compile("\\b[eE][\\s-]?(\\d{3,4}[a-dA-D]?)\\b");
    // "palm oil", "vegetable fat (palm)", "huile de palme", "aceite de palma", "palmiste"; not "palmitate"
    private static final Pattern PALM_OIL = Pattern.compile("\\bpalm(?:e|a)?\\b|palmiste|palm kernel");
    private static final List<String> SWEETENERS = List.of("aspartame", "sucralose", "acesulfame", "saccharin", "cyclamate", "e950", "e951", "e952", "e954", "e955", "e962");

    private ProductAnalyzer() {
    }

    public static boolean isBeverage(Product product) {
        String tags = product.getCategoryTags();
        if (tags == null) return false;
        String lower = tags.toLowerCase(Locale.ROOT);
        return lower.contains("beverage") || lower.contains("drinks") || lower.contains("sodas")
                || lower.contains("juices") || lower.contains("waters");
    }

    public static Analysis analyze(Product product) {
        boolean beverage = isBeverage(product);
        Thresholds limits = beverage ? DRINK : FOOD;
        String per = beverage ? "per 100 ml" : "per 100 g";
        String verdict = HealthVerdictCalculator.evaluate(product);

        Double sugars = product.getSugars100g();
        Double fat = product.getFat100g();
        Double salt = product.getSodium100g() != null ? product.getSodium100g() * SODIUM_TO_SALT : null;

        Level sugarLevel = level(sugars, limits.sugarLow(), limits.sugarHigh());
        Level fatLevel = level(fat, limits.fatLow(), limits.fatHigh());
        Level saltLevel = level(salt, limits.saltLow(), limits.saltHigh());

        String ingredients = lower(product.getIngredientsText());
        boolean palmOil = ingredients != null && PALM_OIL.matcher(ingredients).find();
        boolean sweeteners = containsAny(ingredients, SWEETENERS);
        Set<String> additives = additives(product.getIngredientsText());

        List<InsightPointDto> points = new ArrayList<>();

        // Nutri-Score
        String grade = NutriScores.normalize(product.getNutriScore());
        switch (grade) {
            case "A", "B" -> points.add(InsightPointDto.good("Nutri-Score " + grade, "Among the healthier choices in its category."));
            case "C" -> points.add(InsightPointDto.warn("Nutri-Score C", "Middle of the pack for its category."));
            case "D", "E" -> points.add(InsightPointDto.bad("Nutri-Score " + grade, "One of the less healthy options in its category."));
            default -> { /* not graded */ }
        }

        // Sugar, fat, salt
        if (sugarLevel == Level.HIGH) {
            points.add(InsightPointDto.bad("High in sugar", grams(sugars) + " " + per + ", about " + teaspoons(sugars) + "."));
        } else if (sugarLevel == Level.MEDIUM) {
            points.add(InsightPointDto.warn("Some sugar", grams(sugars) + " " + per + ", about " + teaspoons(sugars) + "."));
        } else if (sugarLevel == Level.LOW) {
            points.add(InsightPointDto.good("Low in sugar", grams(sugars) + " " + per + "."));
        }
        if (fatLevel == Level.HIGH) {
            points.add(InsightPointDto.bad("High in fat", grams(fat) + " " + per + "."));
        } else if (fatLevel == Level.LOW) {
            points.add(InsightPointDto.good("Low in fat", grams(fat) + " " + per + "."));
        }
        if (saltLevel == Level.HIGH) {
            points.add(InsightPointDto.bad("High in salt", grams(salt) + " " + per + " (the daily limit is 5 g)."));
        } else if (saltLevel == Level.LOW) {
            points.add(InsightPointDto.good("Low in salt", grams(salt) + " " + per + "."));
        }

        // Protein and energy (food only: per-100 ml values are not comparable)
        Double protein = product.getProteins100g();
        if (!beverage && protein != null && protein >= 10) {
            points.add(InsightPointDto.good("Good source of protein", grams(protein) + " " + per + "."));
        }
        Double kcal = product.getCalories100g();
        if (!beverage && kcal != null && kcal >= 400) {
            long share = Math.round(kcal / REFERENCE_KCAL * 100);
            points.add(InsightPointDto.warn("Energy-dense", Math.round(kcal) + " kcal " + per + ", about " + share + "% of a 2,000 kcal day."));
        }

        // Ingredients
        if (palmOil) {
            points.add(InsightPointDto.warn("Contains palm oil", "High in saturated fat and linked to deforestation."));
        }
        if (sweeteners) {
            points.add(InsightPointDto.info("Contains sweeteners", "Sweetness comes partly from additives instead of sugar."));
        }
        if (!additives.isEmpty()) {
            String list = String.join(", ", additives.stream().limit(5).toList());
            String title = additives.size() == 1 ? "1 additive" : additives.size() + " additives";
            points.add(additives.size() >= 3 ? InsightPointDto.warn(title, list + ".") : InsightPointDto.info(title, list + "."));
        }
        if (product.getAllergens() != null && !product.getAllergens().isBlank()) {
            points.add(InsightPointDto.info("Allergens", product.getAllergens() + "."));
        }

        String summary = summarize(product, verdict, per, sugars, sugarLevel, fatLevel, saltLevel, palmOil, sweeteners);
        return new Analysis(verdict, summary, points, beverage);
    }

    private static String summarize(Product product, String verdict, String per, Double sugars,
                                    Level sugar, Level fat, Level salt, boolean palmOil, boolean sweeteners) {
        String name = product.getProductName() == null || product.getProductName().equals("Unknown Product")
                ? "This product" : product.getProductName();

        if (sugar == Level.UNKNOWN && fat == Level.UNKNOWN && salt == Level.UNKNOWN) {
            return name + " doesn't have full nutrition data yet, so check the label on the pack.";
        }

        StringBuilder text = new StringBuilder();
        text.append(switch (verdict) {
            case HealthVerdictCalculator.CLEAN -> name + " is a good everyday choice.";
            case HealthVerdictCalculator.AVOID -> name + " is best kept as an occasional treat.";
            default -> name + " is fine in moderation.";
        });

        List<String> highs = new ArrayList<>();
        if (sugar == Level.HIGH) highs.add("sugar");
        if (fat == Level.HIGH) highs.add("fat");
        if (salt == Level.HIGH) highs.add("salt");

        if (!highs.isEmpty()) {
            text.append(" It's high in ").append(joinWords(highs));
            if (sugar == Level.HIGH) {
                text.append(", with ").append(grams(sugars)).append(" of sugar ").append(per)
                        .append(" (about ").append(teaspoons(sugars)).append(")");
            }
            text.append('.');
        } else if (sugar == Level.LOW && fat == Level.LOW && salt == Level.LOW) {
            text.append(" It's low in sugar, fat and salt.");
        } else if (sugar == Level.MEDIUM) {
            text.append(" It has a moderate amount of sugar: ").append(grams(sugars)).append(' ').append(per).append('.');
        }

        if (palmOil) {
            text.append(" It also contains palm oil.");
        } else if (sweeteners) {
            text.append(" Some of its sweetness comes from sweeteners.");
        }

        text.append(switch (verdict) {
            case HealthVerdictCalculator.AVOID -> " Have a look at the better-rated swaps below.";
            case HealthVerdictCalculator.MODERATE -> " Keep an eye on the portion size.";
            default -> "";
        });
        return text.toString();
    }

    private static Level level(Double value, double low, double high) {
        if (value == null) return Level.UNKNOWN;
        if (value > high) return Level.HIGH;
        if (value <= low) return Level.LOW;
        return Level.MEDIUM;
    }

    static Set<String> additives(String ingredients) {
        Set<String> found = new LinkedHashSet<>();
        if (ingredients == null) return found;
        Matcher matcher = E_NUMBER.matcher(ingredients);
        while (matcher.find()) {
            found.add("E" + matcher.group(1).toLowerCase(Locale.ROOT));
        }
        return found;
    }

    private static boolean containsAny(String text, List<String> needles) {
        if (text == null) return false;
        String compact = text.replace(" ", "").replace("-", "");
        for (String needle : needles) {
            // E-numbers are often written "E 951" or "E-951"
            if (text.contains(needle) || (needle.startsWith("e9") && compact.contains(needle))) {
                return true;
            }
        }
        return false;
    }

    private static String lower(String text) {
        return text == null ? null : text.toLowerCase(Locale.ROOT);
    }

    static String grams(Double value) {
        if (value == null) return "?";
        double rounded = value >= 10 ? Math.round(value * 10) / 10.0 : Math.round(value * 100) / 100.0;
        String number = rounded == Math.rint(rounded) ? String.valueOf((long) rounded) : String.valueOf(rounded);
        return number + " g";
    }

    private static String teaspoons(Double sugars) {
        long count = Math.max(1, Math.round(sugars / GRAMS_PER_TEASPOON));
        return count + (count == 1 ? " teaspoon" : " teaspoons");
    }

    private static String joinWords(List<String> words) {
        if (words.size() == 1) return words.get(0);
        return String.join(", ", words.subList(0, words.size() - 1)) + " and " + words.get(words.size() - 1);
    }
}
