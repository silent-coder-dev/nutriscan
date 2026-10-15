package com.nutriscan.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record RegisterRequestDto (

        @NotBlank(message = "Username is required")
        @Pattern(regexp = ValidationRules.USERNAME_REGEX, message = ValidationRules.USERNAME_MESSAGE)
        String username,

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 254, message = "Email must be at most 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Pattern(regexp = ValidationRules.PASSWORD_REGEX, message = ValidationRules.PASSWORD_MESSAGE)
        String password,

        @Size(max = 255, message = "Dietary preference must be at most 255 characters")
        String dietaryPreference,

        @Size(max = 255, message = "Allergies must be at most 255 characters")
        String allergies,

        @Size(max = 255, message = "Medical notes must be at most 255 characters")
        String medicalConditions,

        // Barcodes the visitor scanned as a guest, migrated into their history
        @Size(max = ValidationRules.MAX_GUEST_BARCODES, message = "Too many guest scans to import")
        List<String> guestBarcodes
)
{}
