package com.nutriscan.dto;

import com.nutriscan.entity.User;

public record LeaderboardUserDto(
        String username,
        String fullName,
        int scoutScore,
        int uniqueDiscoveries
) {
    public static LeaderboardUserDto fromEntity(User user) {
        return new LeaderboardUserDto(
                user.getUsername(),
                user.getFullName(),
                user.getScoutScore() != null ? user.getScoutScore() : 0,
                user.getUniqueDiscoveries() != null ? user.getUniqueDiscoveries() : 0
        );
    }
}