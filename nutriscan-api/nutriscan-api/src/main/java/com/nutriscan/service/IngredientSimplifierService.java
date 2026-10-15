package com.nutriscan.service;

import org.apache.commons.text.StringEscapeUtils;
import org.springframework.stereotype.Service;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class IngredientSimplifierService {

    private static final Map<String, String> DICTIONARY = new LinkedHashMap<>();

    static {
        // --- Sugars & Syrups ---
        DICTIONARY.put("sucre", "Sugar");
        DICTIONARY.put("azúcar", "Sugar");
        DICTIONARY.put("sirop de glucose", "Glucose Syrup");
        DICTIONARY.put("jarabe de glucosa", "Glucose Syrup");

        // --- Oils & Fats ---
        DICTIONARY.put("huile de palme", "Palm Oil");
        DICTIONARY.put("aceite de palma", "Palm Oil");
        DICTIONARY.put("beurre de cacao", "Cocoa Butter");
        DICTIONARY.put("manteca de cacao", "Cocoa Butter");

        // --- Dairy & Nuts ---
        DICTIONARY.put("noisettes", "Hazelnuts");
        DICTIONARY.put("avellanas", "Hazelnuts");
        DICTIONARY.put("cacao maigre", "Fat-Reduced Cocoa Powder");
        DICTIONARY.put("lait écrémé en poudre", "Skimmed Milk Powder");
        DICTIONARY.put("leche desnatada en polvo", "Skimmed Milk Powder");
        DICTIONARY.put("lactoserum en poudre", "Whey Powder (milk dairy)");
        DICTIONARY.put("lactosérum en poudre", "Whey Powder (milk dairy)");
        DICTIONARY.put("suero de leche en polvo", "Whey Powder");

        // --- Emulsifiers, Flavorings & Preservatives ---
        DICTIONARY.put("émulsifiants: lécithines [soja)", "Soy Lecithin (natural emulsifier)");
        DICTIONARY.put("émulsifiants: lécithines", "Soy Lecithin (emulsifier)");
        DICTIONARY.put("emulsionante: lecitina de soja", "Soy Lecithin (emulsifier)");
        DICTIONARY.put("vanilline", "Vanillin (flavor enhancer)");
        DICTIONARY.put("sans gluten", "Gluten-Free");
        DICTIONARY.put("sin gluten", "Gluten-Free");

        // --- Beverages & Additives ---
        DICTIONARY.put("agua carbonatada", "Carbonated Water");
        DICTIONARY.put("eau gazeuse", "Carbonated Water");
        DICTIONARY.put("colorante (e-150d)", "Caramel Color IV (adds dark tint)");
        DICTIONARY.put("acidulante (ácido fosfórico)", "Phosphoric Acid (tartness & preservative)");
        DICTIONARY.put("aromas naturales (contiene cafeína)", "Natural Flavors (including Caffeine)");
    }

    public String simplify(String rawIngredients) {
        if (rawIngredients == null || rawIngredients.isBlank()) {
            return "No ingredients provided.";
        }

        // 1. Unescape HTML entities (&quot; -> ", &amp; -> &)
        String unescaped = StringEscapeUtils.unescapeHtml4(rawIngredients);

        // 2. Remove stray quotes
        String cleaned = unescaped.replace("\"", "").trim();

        // 3. Dictionary replacements (foreign terms & additives)
        for (Map.Entry<String, String> entry : DICTIONARY.entrySet()) {
            cleaned = cleaned.replaceAll("(?i)" + Pattern.quote(entry.getKey()), entry.getValue());
        }

        return cleaned.trim();
    }
}