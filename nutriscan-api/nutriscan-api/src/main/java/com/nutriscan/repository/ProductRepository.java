package com.nutriscan.repository;

import com.nutriscan.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product , Long> {

    //Custom Query
     Optional<Product> findByBarcode(String barcode);
}
