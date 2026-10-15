package com.nutriscan.service;

import com.nutriscan.dto.ScanHistoryDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.ProductScan;
import com.nutriscan.entity.User;
import com.nutriscan.repository.ProductRepository;
import com.nutriscan.repository.ProductScanRepository;
import com.nutriscan.util.Barcodes;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductScanService {

    private static final int HISTORY_LIMIT = 100;

    private final ProductScanRepository productScanRepository;
    private final ProductRepository productRepository;

    /**
     * Logged-in user scan record karne ke liye
     */
    @Transactional
    public ProductScan recordScan(User user, Product product, boolean discovery) {
        ProductScan scan = ProductScan.builder()
                .user(user)
                .product(product)
                .healthVerdict(HealthVerdictCalculator.evaluate(product))
                .discovery(discovery)
                .scannedAt(LocalDateTime.now())
                .build();

        return productScanRepository.save(scan);
    }

    /**
     * Guest session ke barcodes ko registered/logged-in user account me migrate karna.
     * Duplicates, malformed codes and products already in the user's log are skipped.
     */
    @Transactional
    public int migrateGuestScans(User user, List<String> barcodes) {
        if (barcodes == null || barcodes.isEmpty()) {
            return 0;
        }

        Set<String> uniqueCodes = new LinkedHashSet<>();
        for (String code : barcodes) {
            if (code != null && Barcodes.isWellFormed(code.trim())) {
                uniqueCodes.add(code.trim());
            }
        }

        int migratedCount = 0;
        for (String code : uniqueCodes) {
            Optional<Product> productOpt = productRepository.findByBarcode(code);
            if (productOpt.isEmpty()) continue;

            Product product = productOpt.get();
            if (productScanRepository.existsByUserIdAndProductId(user.getId(), product.getId())) continue;

            ProductScan scan = ProductScan.builder()
                    .user(user)
                    .product(product)
                    .healthVerdict(HealthVerdictCalculator.evaluate(product))
                    .aiAnalysisSummary("Saved automatically from guest inspection session.")
                    .discovery(false)
                    .scannedAt(LocalDateTime.now())
                    .build();

            productScanRepository.save(scan);
            migratedCount++;
        }

        return migratedCount;
    }

    /**
     * User ki recent scan history (newest first)
     */
    @Transactional(readOnly = true)
    public List<ScanHistoryDto> getRecentScans(Long userId) {
        return productScanRepository.findRecentWithProduct(userId, PageRequest.of(0, HISTORY_LIMIT))
                .stream()
                .map(ScanHistoryDto::fromEntity)
                .toList();
    }
}
