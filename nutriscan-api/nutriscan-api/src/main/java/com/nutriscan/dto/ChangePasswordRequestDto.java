package com.nutriscan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequestDto(
        @NotBlank(message = "Current password is required")
        @Size(max = 72, message = "Current password is too long")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Pattern(regexp = ValidationRules.PASSWORD_REGEX, message = ValidationRules.PASSWORD_MESSAGE)
        String newPassword
) {}
