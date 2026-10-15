package com.nutriscan.repository;

import com.nutriscan.entity.ProductScan;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductScanRepository extends JpaRepository<ProductScan , Long> {

    // Product fetched in the same query to avoid N+1 lookups and lazy-loading errors
    @Query("SELECT s FROM ProductScan s JOIN FETCH s.product WHERE s.user.id = :userId " +
            "ORDER BY s.scannedAt DESC, s.id DESC")
    List<ProductScan> findRecentWithProduct(@Param("userId") Long userId, Pageable pageable);

    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
