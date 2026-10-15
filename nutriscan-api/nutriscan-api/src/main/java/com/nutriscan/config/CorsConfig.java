package com.nutriscan.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    // Comma-separated, e.g. "http://localhost:3000,https://nutriscan.example.com"
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private List<String> allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration  config = new CorsConfiguration();
        // Browsers send the origin without a trailing slash, so "https://x.onrender.com/" must match too
        config.setAllowedOrigins(allowedOrigins.stream()
                .map(String::trim)
                .map(origin -> origin.replaceAll("/+$", ""))
                .filter(origin -> !origin.isEmpty())
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-RateLimit-Remaining"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
