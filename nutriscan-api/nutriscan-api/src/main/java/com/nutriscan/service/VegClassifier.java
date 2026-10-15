package com.nutriscan.service;

import com.nutriscan.entity.Product;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Veg / non-veg mark in the Indian (FSSAI) sense: meat, fish, seafood, eggs and
 * animal-derived additives make a product non-veg; milk and honey do not.
 * Keyword-based on the label text, so "VEG" means nothing non-veg was found.
 */
public final class VegClassifier {

    public static final String VEG = "VEG";
    public static final String NON_VEG = "NON_VEG";
    public static final String UNKNOWN = "UNKNOWN";

    private static final List<String> NON_VEG_WORDS = List.of(
            "meat", "beef", "pork", "chicken", "mutton", "lamb", "veal", "turkey", "ham", "bacon", "lard", "salami",
            "pepperoni", "sausage", "meatball", "viande", "boeuf", "bœuf", "porc", "poulet", "agneau", "jambon", "dinde",
            "fish", "anchovy", "anchovies", "tuna", "salmon", "sardine", "mackerel", "cod", "poisson", "anchois", "thon", "saumon",
            "shrimp", "prawn", "crab", "lobster", "crustacean", "shellfish", "mollusc", "squid", "oyster", "mussel", "crevette",
            "egg", "oeuf", "œuf", "huevo", "albumen",
            "gelatin", "gelatine", "gélatine", "collagen", "carmine", "cochineal", "e120", "e441", "e542", "e904");

    // "may contain traces of egg" is a cross-contamination warning, not an ingredient
    private static final Pattern TRACES = Pattern.compile(
            "(may contain|traces? of|can contain|peut contenir|traces? d[e']|puede contener)[^.;]*", Pattern.UNICODE_CASE);

    // Plant-based look-alikes
    private static final List<String> FALSE_FRIENDS = List.of("eggplant", "egg-free", "egg free", "fish sauce-free", "hamamelis");

    private VegClassifier() {
    }

    public static String classify(Product product) {
        String ingredients = product.getIngredientsText();
        String allergens = product.getAllergens();
        boolean hasLabel = (ingredients != null && !ingredients.isBlank()) || (allergens != null && !allergens.isBlank());
        if (!hasLabel) {
            return UNKNOWN;
        }

        String text = ((ingredients == null ? "" : ingredients) + " " + (allergens == null ? "" : allergens))
                .toLowerCase(Locale.ROOT);
        text = TRACES.matcher(text).replaceAll(" ");
        for (String phrase : FALSE_FRIENDS) {
            text = text.replace(phrase, " ");
        }

        for (String word : NON_VEG_WORDS) {
            // Whole word (plural allowed): "ham" must not match "champignon", nor "cod" match "codium"
            if (Pattern.compile("(?<![\\p{L}])" + Pattern.quote(word) + "(?:s|es)?(?![\\p{L}])", Pattern.UNICODE_CASE)
                    .matcher(text).find()) {
                return NON_VEG;
            }
        }
        return VEG;
    }
}
