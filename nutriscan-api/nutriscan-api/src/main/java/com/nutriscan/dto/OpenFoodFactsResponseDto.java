package com.nutriscan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenFoodFactsResponseDto(

        @JsonProperty("status")
        Integer status,

        @JsonProperty("product")
        OpenFoodFactsProductDto product
) {
}
