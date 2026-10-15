package com.nutriscan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "scan_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id" , nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id" , nullable = false)
    private Product product;

    private String healthVerdict;

    @Column(columnDefinition = "TEXT")
    private String aiAnalysisSummary;

    // True when this scan earned the user a first-discovery reward
    @Column(name = "is_discovery")
    private Boolean discovery;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime scannedAt;
}
