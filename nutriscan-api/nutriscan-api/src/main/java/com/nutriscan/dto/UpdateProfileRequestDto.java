package com.nutriscan.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequestDto(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @NotBlank(message = "Username is required")
        @Pattern(regexp = ValidationRules.USERNAME_REGEX, message = ValidationRules.USERNAME_MESSAGE)
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 254, message = "Email must be at most 254 characters")
        String email,

        @Size(max = 255, message = "Dietary preference must be at most 255 characters")
        String dietaryPreference,

        @Size(max = 255, message = "Allergies must be at most 255 characters")
        String allergies,

        @Size(max = 255, message = "Medical notes must be at most 255 characters")
        String medicalConditions
) {}
