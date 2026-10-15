package com.nutriscan.provider;

import com.nutriscan.entity.Product;
import com.nutriscan.mapper.ProductMapper;
import com.nutriscan.service.IngredientSimplifierService;
import com.nutriscan.service.OpenFoodFactsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OpenFoodFactsProductProvider implements ProductProvider{

    private final OpenFoodFactsService openFoodFactsService;
    private final ProductMapper productMapper;
    private final IngredientSimplifierService ingredientSimplifierService;

    @Override
    public Optional<Product> fetchProduct(String barcode) {
        return openFoodFactsService.fetchProductByBarcode(barcode)
                .map(dto -> {
                    Product product = productMapper.toEntity(barcode, dto);
                    // Populate plain-English simplified ingredients
                    if (product.getIngredientsText() != null && !product.getIngredientsText().isBlank()) {
                        product.setSimplifiedIngredients(
                                ingredientSimplifierService.simplify(product.getIngredientsText())
                        );
                    }
                    return product;
                });
    }

    @Override
    public int getPriority() {
        return 1; //Primary external source
    }
}
