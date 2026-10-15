package com.nutriscan.controller;

import com.nutriscan.dto.AuthResponseDto;
import com.nutriscan.dto.LoginRequestDto;
import com.nutriscan.dto.RegisterRequestDto;
import com.nutriscan.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Errors (400 validation, 409 duplicate, ...) are rendered by GlobalExceptionHandler
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsernameAvailability(@RequestParam String username) {
        return ResponseEntity.ok(Map.of("available", authService.isUsernameAvailable(username)));
    }
}
