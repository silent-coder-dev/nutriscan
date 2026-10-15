package com.nutriscan.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BarcodesTest {

    @Test
    void acceptsOnlyEightToFourteenDigits() {
        assertThat(Barcodes.isWellFormed("3017620422003")).isTrue();
        assertThat(Barcodes.isWellFormed("12345678")).isTrue();
        assertThat(Barcodes.isWellFormed("12345678901234")).isTrue();

        assertThat(Barcodes.isWellFormed(null)).isFalse();
        assertThat(Barcodes.isWellFormed("")).isFalse();
        assertThat(Barcodes.isWellFormed("1234567")).isFalse();
        assertThat(Barcodes.isWellFormed("123456789012345")).isFalse();
        assertThat(Barcodes.isWellFormed("history")).isFalse();
        assertThat(Barcodes.isWellFormed("30176204220O3")).isFalse();
        assertThat(Barcodes.isWellFormed("301762 0422003")).isFalse();
    }

    @Test
    void validatesGs1CheckDigits() {
        assertThat(Barcodes.hasValidCheckDigit("3017620422003")).isTrue();   // EAN-13 (Nutella)
        assertThat(Barcodes.hasValidCheckDigit("5449000000996")).isTrue();   // EAN-13 (Coca-Cola)
        assertThat(Barcodes.hasValidCheckDigit("036000291452")).isTrue();    // UPC-A
        assertThat(Barcodes.hasValidCheckDigit("96385074")).isTrue();        // EAN-8
        assertThat(Barcodes.hasValidCheckDigit("10012345678902")).isTrue();  // GTIN-14

        assertThat(Barcodes.hasValidCheckDigit("3017620422004")).isFalse();
        assertThat(Barcodes.hasValidCheckDigit("036000291453")).isFalse();
        assertThat(Barcodes.hasValidCheckDigit("1234567890")).isFalse();     // unsupported length
        assertThat(Barcodes.hasValidCheckDigit("abc")).isFalse();
    }
}
