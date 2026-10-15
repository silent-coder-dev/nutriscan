package com.nutriscan.util;

import java.util.regex.Pattern;

/**
 * Retail barcode (GTIN) helpers: EAN-8, UPC-A (12), EAN-13 and GTIN-14.
 */
public final class Barcodes {

    private static final Pattern WELL_FORMED = Pattern.compile("^\\d{8,14}$");

    private Barcodes() {
    }

    /** 8 to 14 digits, nothing else. */
    public static boolean isWellFormed(String barcode) {
        return barcode != null && WELL_FORMED.matcher(barcode).matches();
    }

    /**
     * GS1 mod-10 check digit for EAN-8, UPC-A, EAN-13 and GTIN-14. Other lengths
     * (e.g. UPC-E or in-store codes) return false.
     */
    public static boolean hasValidCheckDigit(String barcode) {
        if (!isWellFormed(barcode)) {
            return false;
        }
        int length = barcode.length();
        if (length != 8 && length != 12 && length != 13 && length != 14) {
            return false;
        }

        int sum = 0;
        // Walk right-to-left over the payload; the digit next to the check digit weighs 3
        for (int i = length - 2, position = 0; i >= 0; i--, position++) {
            int digit = barcode.charAt(i) - '0';
            sum += (position % 2 == 0) ? digit * 3 : digit;
        }
        int expected = (10 - (sum % 10)) % 10;
        return expected == barcode.charAt(length - 1) - '0';
    }
}
