package com.nutriscan.entity;

/** Where a product record came from. */
public enum ProductSource {
    /** Manufacturer-declared data from the Open Food Facts database. */
    OPEN_FOOD_FACTS,
    /** Values estimated by the AI fallback; not verified. */
    AI_ESTIMATE
}
