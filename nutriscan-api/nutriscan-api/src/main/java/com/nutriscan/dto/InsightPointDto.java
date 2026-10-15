package com.nutriscan.dto;

/**
 * One finding about a product, e.g. "High in sugar" / "56.3 g per 100 g".
 * tone: good | warn | bad | info
 */
public record InsightPointDto(String tone, String title, String detail) {

    public static InsightPointDto good(String title, String detail) {
        return new InsightPointDto("good", title, detail);
    }

    public static InsightPointDto warn(String title, String detail) {
        return new InsightPointDto("warn", title, detail);
    }

    public static InsightPointDto bad(String title, String detail) {
        return new InsightPointDto("bad", title, detail);
    }

    public static InsightPointDto info(String title, String detail) {
        return new InsightPointDto("info", title, detail);
    }
}
