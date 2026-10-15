package com.nutriscan.service;

import com.nutriscan.dto.ProductResponseDto;
import com.nutriscan.entity.Product;
import com.nutriscan.entity.ProductSource;
import com.nutriscan.entity.User;
import com.nutriscan.provider.ProductProvider;
import com.nutriscan.repository.ProductRepository;
import com.nutriscan.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ProductService {

    static final int DISCOVERY_POINTS = 10;

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductScanService productScanService;
    private final List<ProductProvider> providers;

    public ProductService(
            ProductRepository productRepository,
            UserRepository userRepository,
            ProductScanService productScanService,
            List<ProductProvider> providers
    ) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.productScanService = productScanService;
        this.providers = providers.stream()
                .sorted(Comparator.comparingInt(ProductProvider::getPriority))
                .toList();

        log.info("Initialized ProductService with {} providers:", this.providers.size());
        this.providers.forEach(p -> log.info(" -> Provider: {} with priority {}", p.getClass().getSimpleName(), p.getPriority()));
    }

    /**
     * Inspect product with user context for scout gamification rewards.
     * Deliberately not one big transaction: provider calls are slow network I/O and
     * must not hold a database connection open.
     */
    public Optional<ProductResponseDto> inspectProduct(String barcode, String userEmail) {
        User user = findUser(userEmail).orElse(null);

        // 1. Found in local DB -> existing product (not a new discovery)
        Optional<Product> localProduct = productRepository.findByBarcode(barcode);
        if (localProduct.isPresent()) {
            Product product = localProduct.get();
            if (user != null) {
                productScanService.recordScan(user, product, false);
            }
            return Optional.of(toResponse(product, false, 0, user));
        }

        // 2. Not in local DB -> Chain of Responsibility (third-party fallback)
        Optional<Product> fetched = fetchFromProviders(barcode);
        if (fetched.isEmpty()) {
            log.info("No provider could find barcode {}", barcode);
            return Optional.empty();
        }

        Product saved;
        boolean isNewDiscovery;
        try {
            saved = productRepository.saveAndFlush(fetched.get());
            isNewDiscovery = true;
        } catch (DataIntegrityViolationException e) {
            // A concurrent request stored this barcode first; use its row
            saved = productRepository.findByBarcode(barcode).orElseThrow(() -> e);
            isNewDiscovery = false;
        }

        int earnedPoints = 0;
        if (user != null) {
            // AI estimates are not verified products, so they do not earn scout points
            if (isNewDiscovery && saved.getSource() == ProductSource.OPEN_FOOD_FACTS) {
                userRepository.awardDiscovery(user.getId(), DISCOVERY_POINTS);
                earnedPoints = DISCOVERY_POINTS;
                user = userRepository.findById(user.getId()).orElse(user);
                log.info("Awarded {} scout points to user {} for barcode {}", earnedPoints, user.getId(), barcode);
            }
            productScanService.recordScan(user, saved, earnedPoints > 0);
        }

        return Optional.of(toResponse(saved, isNewDiscovery, earnedPoints, user));
    }

    private Optional<Product> fetchFromProviders(String barcode) {
        for (ProductProvider provider : providers) {
            String name = provider.getClass().getSimpleName();
            try {
                Optional<Product> fetched = provider.fetchProduct(barcode);
                if (fetched.isPresent()) {
                    log.info("Provider {} found barcode {}", name, barcode);
                    return fetched;
                }
            } catch (Exception e) {
                // One failing provider must not stop the chain
                log.error("Provider {} failed for barcode {}: {}", name, barcode, e.getMessage(), e);
            }
        }
        return Optional.empty();
    }

    private Optional<User> findUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(userEmail.toLowerCase().trim());
    }

    private static ProductResponseDto toResponse(Product product, boolean isNewDiscovery, int earnedPoints, User user) {
        int score = user != null && user.getScoutScore() != null ? user.getScoutScore() : 0;
        int discoveries = user != null && user.getUniqueDiscoveries() != null ? user.getUniqueDiscoveries() : 0;
        return ProductResponseDto.fromEntity(product, isNewDiscovery, earnedPoints, score, discoveries);
    }
}
