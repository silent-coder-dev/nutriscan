package com.nutriscan.controller;

import com.nutriscan.dto.ProductInsightsDto;
import com.nutriscan.dto.ProductResponseDto;
import com.nutriscan.exception.ApiException;
import com.nutriscan.service.ProductInsightService;
import com.nutriscan.service.ProductService;
import com.nutriscan.service.RateLimiterService;
import com.nutriscan.util.Barcodes;
import com.nutriscan.util.ClientIpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductInsightService productInsightService;
    private final RateLimiterService rateLimiterService;

    @GetMapping("/{barcode}")
    public ResponseEntity<ProductResponseDto> getProductByBarcode(
            @PathVariable String barcode,
            HttpServletRequest request,
            Principal principal
    ) {
        String cleanBarcode = barcode.trim();

        // --- 1. Reject anything that is not a retail barcode (before it costs a free scan or an API call) ---
        if (!Barcodes.isWellFormed(cleanBarcode)) {
            throw ApiException.badRequest("Barcodes are 8 to 14 digits (EAN-8, UPC-A, EAN-13 or GTIN-14).");
        }

        // --- 2. Identify User vs Guest. Guest = no *valid* token; a junk Authorization header is still a guest ---
        String userEmail = (principal != null) ? principal.getName() : null;

        // --- 3. Rate Limiting for Guest Users ---
        Long remainingScans = null;
        if (userEmail == null) {
            RateLimiterService.Result quota = rateLimiterService.tryConsume(ClientIpUtil.getClientIp(request));
            if (!quota.allowed()) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED",
                        "You have used your " + RateLimiterService.MAX_FREE_SCANS
                                + " free scans. Please sign in to continue unlimited inspections.");
            }
            remainingScans = quota.remaining();
        }

        // --- 4. Execute Core Inspection with Gamification Context ---
        ProductResponseDto responseDto = productService.inspectProduct(cleanBarcode, userEmail)
                .orElseThrow(() -> ApiException.notFound("Product not found for barcode: " + cleanBarcode));

        ResponseEntity.BodyBuilder ok = ResponseEntity.ok();
        if (remainingScans != null) {
            ok.header("X-RateLimit-Remaining", String.valueOf(remainingScans));
        }
        return ok.body(responseDto);
    }

    /**
     * Summary, key findings, personal alerts (when signed in) and better-rated alternatives
     * for a product that has already been scanned. Does not count towards the guest quota.
     */
    @GetMapping("/{barcode}/insights")
    public ResponseEntity<ProductInsightsDto> getProductInsights(@PathVariable String barcode, Principal principal) {
        String cleanBarcode = barcode.trim();
        if (!Barcodes.isWellFormed(cleanBarcode)) {
            throw ApiException.badRequest("Barcodes are 8 to 14 digits (EAN-8, UPC-A, EAN-13 or GTIN-14).");
        }
        String userEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(productInsightService.getInsights(cleanBarcode, userEmail));
    }
}
