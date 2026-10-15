package com.nutriscan.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient openFoodFactsRestClient(){
        return RestClient.builder()
                .baseUrl("https://world.openfoodfacts.org")
                .requestFactory(requestFactory(Duration.ofSeconds(5), Duration.ofSeconds(10)))
                .defaultHeader(HttpHeaders.USER_AGENT, "NutriScan/1.0")
                .build();
    }

    // Open Food Facts search service, used for better-rated alternatives
    @Bean
    public RestClient openFoodFactsSearchRestClient() {
        return RestClient.builder()
                .baseUrl("https://search.openfoodfacts.org")
                .requestFactory(requestFactory(Duration.ofSeconds(5), Duration.ofSeconds(8)))
                .defaultHeader(HttpHeaders.USER_AGENT, "NutriScan/1.0")
                .build();
    }

    @Bean
    public RestClient openRouterRestClient() {
        return RestClient.builder()
                .baseUrl("https://openrouter.ai/api/v1")
                // LLM completions are slow; still bounded so a hung call can't pin a request thread
                .requestFactory(requestFactory(Duration.ofSeconds(5), Duration.ofSeconds(30)))
                .defaultHeader("HTTP-Referer", "http://localhost:8080")
                .defaultHeader("X-Title", "NutriScan API")
                .defaultHeader(HttpHeaders.USER_AGENT, "NutriScan-App/1.0")
                .build();
    }

    private static ClientHttpRequestFactory requestFactory(Duration connectTimeout, Duration readTimeout) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(readTimeout);
        return factory;
    }
}
