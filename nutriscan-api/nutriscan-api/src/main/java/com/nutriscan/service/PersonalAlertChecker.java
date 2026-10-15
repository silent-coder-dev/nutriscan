package com.nutriscan.service;

import com.nutriscan.dto.InsightPointDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.User;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Matches a product against the user's declared allergies, diet and medical notes.
 * Keyword-based (English and the French/Spanish terms common in Open Food Facts),
 * so it can flag what it finds but can never prove a product is safe.
 */
public final class PersonalAlertChecker {

    // Allergy chip in the profile -> words that indicate it on a label
    private static final Map<String, List<String>> ALLERGENS = new LinkedHashMap<>();
    static {
        ALLERGENS.put("peanuts", List.of("peanut", "arachide", "groundnut", "cacahuète", "cacahuete"));
        ALLERGENS.put("gluten", List.of("gluten", "wheat", "blé", "barley", "orge", "rye", "seigle", "spelt", "épeautre", "malt"));
        ALLERGENS.put("dairy", List.of("milk", "lait", "leche", "dairy", "whey", "lactose", "lactoserum", "lactosérum",
                "butter", "beurre", "cream", "crème", "cheese", "fromage", "casein", "caséine", "yogurt", "yoghurt", "yaourt"));
        ALLERGENS.put("soy", List.of("soy", "soja", "soya"));
        ALLERGENS.put("tree nuts", List.of("hazelnut", "noisette", "almond", "amande", "walnut", "cashew", "cajou",
                "pistachio", "pistache", "pecan", "macadamia", "brazil nut", "nuts", "fruits à coque", "avellana"));
        ALLERGENS.put("eggs", List.of("egg", "oeuf", "œuf", "huevo"));
        ALLERGENS.put("shellfish", List.of("shrimp", "prawn", "crab", "lobster", "crustacean", "shellfish", "crevette", "mollusc"));
    }

    // Look-alike phrases rewritten before matching, keeping the word that still matters
    // ("peanut butter" is not dairy, but is still peanut)
    private static final Map<String, String> FALSE_FRIENDS = new LinkedHashMap<>();
    static {
        FALSE_FRIENDS.put("cocoa butter", "cocoa");
        FALSE_FRIENDS.put("cacao butter", "cacao");
        FALSE_FRIENDS.put("beurre de cacao", "cacao");
        FALSE_FRIENDS.put("manteca de cacao", "cacao");
        FALSE_FRIENDS.put("shea butter", "shea");
        FALSE_FRIENDS.put("peanut butter", "peanut");
        FALSE_FRIENDS.put("coconut milk", "coconut");
        FALSE_FRIENDS.put("coconut cream", "coconut");
        FALSE_FRIENDS.put("lait de coco", "coco");
        FALSE_FRIENDS.put("almond milk", "almond");
        FALSE_FRIENDS.put("soy milk", "soy");
        FALSE_FRIENDS.put("oat milk", "oat");
        FALSE_FRIENDS.put("eggplant", "aubergine");
        FALSE_FRIENDS.put("maltodextrine", "dextrin");
        FALSE_FRIENDS.put("maltodextrin", "dextrin");
        FALSE_FRIENDS.put("maltitol", "polyol");
        FALSE_FRIENDS.put("maltose", "sugar");
        FALSE_FRIENDS.put("wine vinegar", "vinegar");
    }

    private static final List<String> MEAT = List.of("beef", "boeuf", "bœuf", "pork", "porc", "chicken", "poulet", "meat",
            "viande", "ham", "jambon", "bacon", "lard", "turkey", "dinde", "lamb", "agneau", "veal", "veau", "gelatin",
            "gélatine", "gelatine", "rennet", "présure");
    private static final List<String> FISH = List.of("fish", "poisson", "anchovy", "anchois", "tuna", "thon", "salmon", "saumon");
    private static final List<String> ANIMAL = List.of("honey", "miel", "carmine", "e120", "cochineal", "shellac", "e904");
    private static final List<String> NOT_HALAL = List.of("pork", "porc", "lard", "bacon", "ham", "jambon", "gelatin",
            "gélatine", "gelatine", "alcohol", "alcool", "wine", "rum", "rhum", "beer", "bière");

    private PersonalAlertChecker() {
    }

    public static List<InsightPointDto> check(Product product, User user, boolean beverage) {
        List<InsightPointDto> alerts = new ArrayList<>();
        String label = labelText(product);

        // Allergies ("Peanuts, Dairy" or free text)
        for (String allergy : splitList(user.getAllergies())) {
            String key = allergy.toLowerCase(Locale.ROOT);
            if (key.equals("none") || key.length() < 3) continue;
            List<String> words = ALLERGENS.getOrDefault(key, List.of(key));
            firstMatch(label, words).ifPresent(word -> alerts.add(InsightPointDto.bad(
                    "Contains " + allergy, "The label mentions \"" + word + "\". You listed a " + allergy.toLowerCase(Locale.ROOT) + " allergy.")));
        }

        // Diet
        String diet = user.getDietaryPreference() == null ? "" : user.getDietaryPreference().toLowerCase(Locale.ROOT);
        if (diet.contains("vegan")) {
            List<String> animal = new ArrayList<>(ALLERGENS.get("dairy"));
            animal.addAll(ALLERGENS.get("eggs"));
            animal.addAll(MEAT);
            animal.addAll(FISH);
            animal.addAll(ANIMAL);
            firstMatch(label, animal).ifPresent(word -> alerts.add(InsightPointDto.warn(
                    "May not be vegan", "The label mentions \"" + word + "\".")));
        } else if (diet.contains("vegetarian")) {
            List<String> notVegetarian = new ArrayList<>(MEAT);
            notVegetarian.addAll(FISH);
            notVegetarian.add("carmine");
            notVegetarian.add("e120");
            firstMatch(label, notVegetarian).ifPresent(word -> alerts.add(InsightPointDto.warn(
                    "May not be vegetarian", "The label mentions \"" + word + "\".")));
        } else if (diet.contains("pescatarian")) {
            firstMatch(label, MEAT).ifPresent(word -> alerts.add(InsightPointDto.warn(
                    "May not be pescatarian", "The label mentions \"" + word + "\".")));
        } else if (diet.contains("halal")) {
            firstMatch(label, NOT_HALAL).ifPresent(word -> alerts.add(InsightPointDto.warn(
                    "Check halal status", "The label mentions \"" + word + "\".")));
        } else if (diet.contains("keto")) {
            Double sugars = product.getSugars100g();
            if (sugars != null && sugars > 5) {
                alerts.add(InsightPointDto.warn("Not keto-friendly",
                        ProductAnalyzer.grams(sugars) + " of sugar " + (beverage ? "per 100 ml" : "per 100 g") + "."));
            }
        }

        // Medical notes (free text)
        String notes = user.getMedicalConditions() == null ? "" : user.getMedicalConditions().toLowerCase(Locale.ROOT);
        Double sugars = product.getSugars100g();
        Double salt = product.getSodium100g() != null ? product.getSodium100g() * 2.5 : null;
        double sugarLimit = beverage ? 2.5 : 5.0;
        double saltLimit = 0.3;

        if (notes.contains("diabet") && sugars != null && sugars > sugarLimit) {
            alerts.add(InsightPointDto.bad("Watch the sugar",
                    "You mentioned diabetes; this has " + ProductAnalyzer.grams(sugars) + " of sugar " + (beverage ? "per 100 ml" : "per 100 g") + "."));
        }
        if ((notes.contains("hypertension") || notes.contains("blood pressure")) && salt != null && salt > saltLimit) {
            alerts.add(InsightPointDto.warn("Watch the salt",
                    "You mentioned blood pressure; this has " + ProductAnalyzer.grams(salt) + " of salt " + (beverage ? "per 100 ml" : "per 100 g") + "."));
        }
        if ((notes.contains("coeliac") || notes.contains("celiac")) && !mentionsAllergy(alerts, "gluten")) {
            firstMatch(label, ALLERGENS.get("gluten")).ifPresent(word -> alerts.add(InsightPointDto.bad(
                    "Contains gluten", "The label mentions \"" + word + "\". You mentioned coeliac disease.")));
        }

        return alerts;
    }

    private static boolean mentionsAllergy(List<InsightPointDto> alerts, String allergy) {
        return alerts.stream().anyMatch(a -> a.title().toLowerCase(Locale.ROOT).contains(allergy));
    }

    private static String labelText(Product product) {
        String text = ((product.getAllergens() == null ? "" : product.getAllergens()) + " "
                + (product.getIngredientsText() == null ? "" : product.getIngredientsText())).toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> entry : FALSE_FRIENDS.entrySet()) {
            text = text.replace(entry.getKey(), entry.getValue());
        }
        return text;
    }

    private static Optional<String> firstMatch(String text, List<String> words) {
        for (String word : words) {
            // Word start only, so "nuts" does not match "coconuts"
            if (Pattern.compile("(?<![\\p{L}])" + Pattern.quote(word), Pattern.UNICODE_CASE).matcher(text).find()) {
                return Optional.of(word);
            }
        }
        return Optional.empty();
    }

    private static List<String> splitList(String value) {
        if (value == null || value.isBlank()) return List.of();
        return List.of(value.split("\\s*,\\s*")).stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
