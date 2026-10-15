package com.nutriscan.parser;

import com.nutriscan.dto.AiProductResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class AiResponseParser {

    private final ObjectMapper objectMapper;

    public Optional<AiProductResponseDto> parseProductResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return Optional.empty();
        }

        try {
            JsonNode root = objectMapper.readTree(rawResponse);

            JsonNode choicesNode = root.path("choices");
            if (!choicesNode.isArray() || choicesNode.isEmpty()) {
                log.warn("AI response has no choices");
                return Optional.empty();
            }

            // Path: choices[0] -> message -> content
            JsonNode contentNode = choicesNode.path(0).path("message").path("content");
            if (!contentNode.isTextual() || contentNode.asText().isBlank()) {
                log.warn("AI response message content is missing or blank");
                return Optional.empty();
            }

            String json = extractJsonObject(contentNode.asText());

            // The prompt tells the model to answer {} when it cannot identify the product
            if (json.isEmpty() || json.equals("{}")) {
                log.info("AI could not identify the product");
                return Optional.empty();
            }

            AiProductResponseDto dto = objectMapper.readValue(json, AiProductResponseDto.class);
            if (dto == null || dto.productName() == null || dto.productName().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(dto);

        } catch (Exception e) {
            log.warn("Could not parse AI product response: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Plain-text answer from a chat completion (choices[0].message.content), tidied for display:
     * markdown emphasis removed, whitespace collapsed, capped at {@code maxLength} characters.
     */
    public Optional<String> parseTextResponse(String rawResponse, int maxLength) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode content = objectMapper.readTree(rawResponse)
                    .path("choices").path(0).path("message").path("content");
            if (!content.isTextual()) {
                return Optional.empty();
            }
            String text = content.asText()
                    .replaceAll("[*_#`>]", "")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.length() >= 2 && text.startsWith("\"") && text.endsWith("\"")) {
                text = text.substring(1, text.length() - 1).trim();
            }
            if (text.isBlank()) {
                return Optional.empty();
            }
            if (text.length() > maxLength) {
                // Cut at the last full sentence that fits
                String cut = text.substring(0, maxLength);
                int lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf('.'));
                text = lastStop > maxLength / 2 ? cut.substring(0, lastStop + 1) : cut.trim() + "…";
            }
            return Optional.of(text);
        } catch (Exception e) {
            log.warn("Could not parse AI text response: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Strips markdown fences and any prose around the JSON object the model returned.
     */
    static String extractJsonObject(String content) {
        if (content == null) return "";

        String clean = content.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        clean = clean.trim();

        int start = clean.indexOf('{');
        int end = clean.lastIndexOf('}');
        if (start < 0 || end < start) {
            return "";
        }
        return clean.substring(start, end + 1).trim();
    }
}
