package com.nutriscan.util;

import java.util.Locale;
import java.util.Set;

public final class NutriScores {

    public static final String UNKNOWN = "UNKNOWN";
    private static final Set<String> GRADES = Set.of("A", "B", "C", "D", "E");

    private NutriScores() {
    }

    /**
     * Maps any upstream value ("e", "not-applicable", "unknown", null...) onto the
     * A-E | UNKNOWN set the web client understands.
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return UNKNOWN;
        }
        String grade = raw.trim().toUpperCase(Locale.ROOT);
        return GRADES.contains(grade) ? grade : UNKNOWN;
    }
}
