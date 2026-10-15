package com.nutriscan.controller;

import com.nutriscan.dto.AuthResponseDto;
import com.nutriscan.dto.ChangePasswordRequestDto;
import com.nutriscan.dto.LeaderboardUserDto;
import com.nutriscan.dto.ScanHistoryDto;
import com.nutriscan.dto.UpdateProfileRequestDto;
import com.nutriscan.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardUserDto>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }

    // Fresh profile and scout stats for the signed-in user
    @GetMapping("/me")
    public ResponseEntity<AuthResponseDto> getCurrentUser(@AuthenticationPrincipal String currentUserEmail) {
        return ResponseEntity.ok(userService.getProfile(currentUserEmail));
    }

    // Scan log shown on the dashboard
    @GetMapping("/me/scans")
    public ResponseEntity<List<ScanHistoryDto>> getScanHistory(@AuthenticationPrincipal String currentUserEmail) {
        return ResponseEntity.ok(userService.getScanHistory(currentUserEmail));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponseDto> updateProfile(
            @AuthenticationPrincipal String currentUserEmail,
            @Valid @RequestBody UpdateProfileRequestDto request
    ) {
        return ResponseEntity.ok(userService.updateProfile(currentUserEmail, request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal String currentUserEmail,
            @Valid @RequestBody ChangePasswordRequestDto request
    ) {
        userService.changePassword(currentUserEmail, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}
