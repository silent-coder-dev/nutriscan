package com.nutriscan.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Business error with an HTTP status. Thrown from services/controllers and
 * rendered by {@link GlobalExceptionHandler} as a uniform JSON error body.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String error;

    public ApiException(HttpStatus status, String error, String message) {
        super(message);
        this.status = status;
        this.error = error;
    }

    public ApiException(HttpStatus status, String message) {
        this(status, status.name(), message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}
