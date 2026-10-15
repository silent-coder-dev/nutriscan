package com.nutriscan.exception;

import com.nutriscan.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getError(), ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleBodyValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        String message = fieldErrors.isEmpty()
                ? "Request validation failed."
                : fieldErrors.values().iterator().next();

        ApiErrorResponse body = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(), "VALIDATION_FAILED", message,
                request.getRequestURI(), Instant.now(), fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler({HandlerMethodValidationException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiErrorResponse> handleParameterValidation(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "One or more request parameters are invalid.", request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "Request body is missing or is not valid JSON.", request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Required parameter '" + ex.getParameterName() + "' is missing.", request);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingHeader(MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Required header '" + ex.getHeaderName() + "' is missing.", request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Parameter '" + ex.getName() + "' has an invalid value.", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "HTTP method " + ex.getMethod() + " is not supported for this endpoint.", request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content type must be application/json.", request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "No endpoint found for " + request.getMethod() + " " + request.getRequestURI(), request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "This conflicts with existing data (for example, an email or username already in use).", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on our side. Please try again.", request);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String message, HttpServletRequest request) {
        return build(status, status.name(), message, request);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String error, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ApiErrorResponse.of(status, error, message, request.getRequestURI()));
    }
}
