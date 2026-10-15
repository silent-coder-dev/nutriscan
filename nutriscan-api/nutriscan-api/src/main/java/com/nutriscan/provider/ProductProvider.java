package com.nutriscan.provider;

import com.nutriscan.entity.Product;

import java.util.Optional;

public interface ProductProvider {

    Optional<Product> fetchProduct(String barcode);

    // Lower number = higher priority (e.g., 1 for OpenFoodFacts, 2 for AI)
    int getPriority();
}
