package com.nutriscan.dto;

import java.util.List;

/**
 * Analysis shown under a scanned product: a short summary, key findings,
 * profile-based alerts and better-rated alternatives.
 */
public record ProductInsightsDto(
        String barcode,
        // Clean | Moderate | Avoid
        String verdict,
        String summary,
        // "AI" when written by the language model, "NUTRIBOT" when built from the nutrition rules
        String summarySource,
        List<InsightPointDto> highlights,
        // Only filled for signed-in users, based on their allergies, diet and notes
        List<InsightPointDto> personalAlerts,
        boolean personalized,
        List<ProductAlternativeDto> alternatives,
        // Human-readable category the alternatives come from, e.g. "Colas"
        String alternativesCategory
) {
}
