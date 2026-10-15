package com.nutriscan.dto;

import com.nutriscan.entity.Product;
import com.nutriscan.entity.ProductScan;
import com.nutriscan.service.HealthVerdictCalculator;
import com.nutriscan.service.VegClassifier;

import java.time.LocalDateTime;

public record ScanHistoryDto(
        Long id,
        String productName,
        String brand,
        String barcode,
        LocalDateTime scannedAt,
        String healthVerdict,
        String vegStatus,
        boolean isDiscovery
) {
    public static ScanHistoryDto fromEntity(ProductScan scan) {
        Product product = scan.getProduct();
        return new ScanHistoryDto(
                scan.getId(),
                product.getProductName(),
                product.getBrand(),
                product.getBarcode(),
                scan.getScannedAt(),
                // Computed from the product so older rows ("VERIFIED", "MIGRATED_GUEST_SCAN") display correctly
                HealthVerdictCalculator.evaluate(product),
                VegClassifier.classify(product),
                Boolean.TRUE.equals(scan.getDiscovery())
        );
    }
}
