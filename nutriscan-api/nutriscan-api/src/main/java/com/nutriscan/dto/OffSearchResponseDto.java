package com.nutriscan.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/** Response of the Open Food Facts search service (search.openfoodfacts.org). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OffSearchResponseDto(List<Hit> hits) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Hit(
            @JsonProperty("code") String code,
            @JsonProperty("product_name") String productName,
            @JsonProperty("product_name_en") String productNameEn,
            @JsonProperty("brands")
            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<String> brands,
            @JsonProperty("nutriscore_grade") String nutriscoreGrade,
            @JsonProperty("image_front_small_url") String imageUrl
    ) {
        public static final String FIELDS =
                "code,product_name,product_name_en,brands,nutriscore_grade,image_front_small_url";
    }
}
