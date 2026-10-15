package com.nutriscan.dto;

/**
 * Shared validation patterns. Keep in sync with nutriscan-web/lib/validation.ts.
 */
public final class ValidationRules {

    // 3-15 chars, lowercase letters, digits and _ . - (numbers/symbols optional)
    public static final String USERNAME_REGEX = "^[a-z0-9_.-]{3,15}$";
    public static final String USERNAME_MESSAGE =
            "Username must be 3-15 characters using only a-z, 0-9, _ . -";

    // 8-72 chars (bcrypt limit) with upper, lower, digit and symbol
    public static final String PASSWORD_REGEX =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}$";
    public static final String PASSWORD_MESSAGE =
            "Password must be 8-72 characters with an uppercase letter, a lowercase letter, a number and a symbol";

    public static final int MAX_GUEST_BARCODES = 50;

    private ValidationRules() {
    }
}
