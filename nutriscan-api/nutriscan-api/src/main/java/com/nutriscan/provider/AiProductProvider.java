package com.nutriscan.provider;

import com.nutriscan.entity.Product;
import com.nutriscan.mapper.AiProductMapper;
import com.nutriscan.service.IngredientSimplifierService;
import com.nutriscan.service.OpenRouterService;
import com.nutriscan.util.Barcodes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiProductProvider implements ProductProvider{

    private final OpenRouterService openRouterService;
    private final AiProductMapper aiProductMapper;
    private final IngredientSimplifierService ingredientSimplifierService;

    @Override
    public Optional<Product> fetchProduct(String barcode) {
        // The model will happily "estimate" a product for any number, so only ask about real GTINs
        if (!Barcodes.hasValidCheckDigit(barcode)) {
            log.info("Skipping AI fallback for {}: not a valid GTIN check digit", barcode);
            return Optional.empty();
        }

        return openRouterService.fetchProductFromAi(barcode)
                .map(dto -> {
                    Product product = aiProductMapper.toEntity(barcode , dto);
                    if (product.getIngredientsText() != null && !product.getIngredientsText().isBlank()) {
                        product.setSimplifiedIngredients(ingredientSimplifierService.simplify(product.getIngredientsText()));
                    }
                    return product;
                });
    }

    @Override
    public int getPriority() {
        return 2; //FallBack source AI will give
    }
}
