package com.nutriscan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "products" , indexes = {
        @Index(name = "idx_product_barcode" , columnList = "barcode" , unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true , nullable = false)
    private String barcode;

    private String productName;

    private String brand;

    private String nutriScore;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String ingredientsText;

    private String allergens;

    private Double calories100g;

    private Double sugars100g;

    private Double fat100g;

    private Double proteins100g;

    private Double sodium100g;

    @Column(name = "simplified_ingredients", columnDefinition = "TEXT")
    private String simplifiedIngredients;

    // Null for rows saved before the source was tracked
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ProductSource source;

    // Open Food Facts "en:" category tags, general -> specific, comma-separated (e.g. "en:sodas,en:colas")
    @Column(name = "category_tags", columnDefinition = "TEXT")
    private String categoryTags;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
