package com.nutriscan.parser;

import com.nutriscan.dto.AiProductResponseDto;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class AiResponseParserTest {

    private final AiResponseParser parser = new AiResponseParser(JsonMapper.builder().build());

    @Test
    void parsesPlainJsonContent() {
        Optional<AiProductResponseDto> result = parser.parseProductResponse(wrap(
                "{\\\"productName\\\":\\\"Oat Bar\\\",\\\"brand\\\":\\\"Acme\\\",\\\"nutriScore\\\":\\\"b\\\",\\\"sugars100g\\\":12.5}"));

        assertThat(result).isPresent();
        assertThat(result.get().productName()).isEqualTo("Oat Bar");
        assertThat(result.get().sugars100g()).isEqualTo(12.5);
    }

    @Test
    void stripsMarkdownFencesAndSurroundingProse() {
        Optional<AiProductResponseDto> result = parser.parseProductResponse(wrap(
                "Sure! Here it is:\\n```json\\n{\\\"productName\\\":\\\"Cola\\\"}\\n```"));

        assertThat(result).map(AiProductResponseDto::productName).contains("Cola");
    }

    @Test
    void returnsEmptyWhenModelCannotIdentifyProduct() {
        assertThat(parser.parseProductResponse(wrap("{}"))).isEmpty();
        assertThat(parser.parseProductResponse(wrap("{\\\"productName\\\":\\\"\\\"}"))).isEmpty();
        assertThat(parser.parseProductResponse(wrap("I don't know this product."))).isEmpty();
    }

    @Test
    void returnsEmptyForMalformedOrMissingPayloads() {
        assertThat(parser.parseProductResponse(null)).isEmpty();
        assertThat(parser.parseProductResponse("   ")).isEmpty();
        assertThat(parser.parseProductResponse("not json")).isEmpty();
        assertThat(parser.parseProductResponse("{\"choices\":[]}")).isEmpty();
        assertThat(parser.parseProductResponse("{\"error\":{\"code\":429}}")).isEmpty();
        assertThat(parser.parseProductResponse(wrap("{\\\"productName\\\": \\\"Broken\\\""))).isEmpty();
    }

    @Test
    void extractsJsonObject() {
        assertThat(AiResponseParser.extractJsonObject("```\n{\"a\":1}\n```")).isEqualTo("{\"a\":1}");
        assertThat(AiResponseParser.extractJsonObject("no braces")).isEmpty();
        assertThat(AiResponseParser.extractJsonObject(null)).isEmpty();
    }

    // Wraps message content (already JSON-string-escaped) in an OpenRouter chat completion envelope
    private static String wrap(String escapedContent) {
        return "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + escapedContent + "\"}}]}";
    }
}
