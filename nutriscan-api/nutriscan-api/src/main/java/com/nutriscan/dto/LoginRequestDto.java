package com.nutriscan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record LoginRequestDto(

        // Accepts either a username or an email
        @NotBlank(message = "Username or Email is required")
        @Size(max = 254, message = "Username or Email is too long")
        String email,

        @NotBlank(message = "Password is required")
        @Size(max = 72, message = "Password is too long")
        String password,

        @Size(max = ValidationRules.MAX_GUEST_BARCODES, message = "Too many guest scans to import")
        List<String> guestBarcodes
) {
}
