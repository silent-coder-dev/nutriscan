package com.nutriscan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NutrimentsDto(

        @JsonProperty("energy-kcal_100g")
        Double calories100g,

        @JsonProperty("sugars_100g")
        Double sugars100g,

        @JsonProperty("fat_100g")
        Double fat100g,

        @JsonProperty("proteins_100g")
        Double proteins100g,

        @JsonProperty("sodium_100g")
        Double sodium100g
) {
}
