package com.nutriscan.service;

import com.nutriscan.dto.OffSearchResponseDto;
import com.nutriscan.dto.OpenFoodFactsProductDto;
import com.nutriscan.dto.OpenFoodFactsResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OpenFoodFactsService {

    private static final Logger log = LoggerFactory.getLogger(OpenFoodFactsService.class);
    private final RestClient restClient;
    private final RestClient searchClient;

    public OpenFoodFactsService(
            @Qualifier("openFoodFactsRestClient") RestClient restClient,
            @Qualifier("openFoodFactsSearchRestClient") RestClient searchClient
    ) {
        this.restClient = restClient;
        this.searchClient = searchClient;
    }

    public Optional<OpenFoodFactsProductDto> fetchProductByBarcode(String barcode){
        try{
            OpenFoodFactsResponseDto response = restClient.get()
                    .uri("/api/v2/product/{barcode}.json?fields={fields}", barcode, OpenFoodFactsProductDto.REQUESTED_FIELDS)
                    .retrieve()
                    .body(OpenFoodFactsResponseDto.class);

            if(response != null && Integer.valueOf(1).equals(response.status())
             && response.product() != null){
                return Optional.of(response.product());
            }

            return Optional.empty();
        } catch (HttpClientErrorException.NotFound e) {
            // OFF answers 404 for barcodes it does not know: a normal miss, not an error
            log.debug("Open Food Facts has no product for barcode {}", barcode);
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Open Food Facts API call failed for barcode {}: {}" , barcode , e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Popular products in a category with one of the given Nutri-Score grades (lowercase a-e).
     * Throws on transport errors so callers can avoid caching a failed lookup.
     */
    public List<OffSearchResponseDto.Hit> searchByCategory(String categoryTag, Collection<String> grades, int limit) {
        String safeTag = categoryTag.replaceAll("[\"\\\\]", "");
        String gradeFilter = grades.stream().collect(Collectors.joining(" OR ", "(", ")"));
        String query = "categories_tags:\"" + safeTag + "\" AND nutriscore_grade:" + gradeFilter;

        OffSearchResponseDto response = searchClient.get()
                .uri("/search?q={q}&fields={fields}&page_size={size}&sort_by=-unique_scans_n",
                        query, OffSearchResponseDto.Hit.FIELDS, limit)
                .retrieve()
                .body(OffSearchResponseDto.class);

        return response != null && response.hits() != null ? response.hits() : List.of();
    }

}
