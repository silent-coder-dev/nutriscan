package com.nutriscan.dto;

import com.nutriscan.entity.User;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record AuthResponseDto(

        String token,
        Long userId,
        String username,
        String email,
        String fullName,
        String dietaryPreference,
        String allergies,
        String medicalConditions,
        LocalDateTime lastUsernameChange,
        int migratedScansCount,
        int uniqueDiscoveries,
        int scoutScore
) {
    public static AuthResponseDto from(User user, String token, int migratedScansCount) {
        return AuthResponseDto.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .dietaryPreference(user.getDietaryPreference())
                .allergies(user.getAllergies())
                .medicalConditions(user.getMedicalConditions())
                .lastUsernameChange(user.getLastUsernameChange())
                .migratedScansCount(migratedScansCount)
                .uniqueDiscoveries(user.getUniqueDiscoveries() != null ? user.getUniqueDiscoveries() : 0)
                .scoutScore(user.getScoutScore() != null ? user.getScoutScore() : 0)
                .build();
    }
}
