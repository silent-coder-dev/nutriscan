package com.nutriscan.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

/**
 * Single error shape returned by every failing endpoint, so the web client
 * can always read {@code message}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp,
        Map<String, String> fieldErrors
) {
    public static ApiErrorResponse of(HttpStatus status, String error, String message, String path) {
        return new ApiErrorResponse(status.value(), error, message, path, Instant.now(), null);
    }

    public static ApiErrorResponse of(HttpStatus status, String message, String path) {
        return of(status, status.name(), message, path);
    }
}
