package com.nutriscan.service;

import com.nutriscan.config.PasswordEncoder;
import com.nutriscan.dto.AuthResponseDto;
import com.nutriscan.dto.ChangePasswordRequestDto;
import com.nutriscan.dto.LeaderboardUserDto;
import com.nutriscan.dto.ScanHistoryDto;
import com.nutriscan.dto.UpdateProfileRequestDto;
import com.nutriscan.entity.User;
import com.nutriscan.exception.ApiException;
import com.nutriscan.repository.UserRepository;
import com.nutriscan.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int USERNAME_COOLDOWN_DAYS = 20;
    private static final int LEADERBOARD_SIZE = 10;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductScanService productScanService;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public AuthResponseDto getProfile(String currentUserEmail) {
        return AuthResponseDto.from(requireUser(currentUserEmail), null, 0);
    }

    @Transactional(readOnly = true)
    public List<ScanHistoryDto> getScanHistory(String currentUserEmail) {
        return productScanService.getRecentScans(requireUser(currentUserEmail).getId());
    }

    @Transactional(readOnly = true)
    public List<LeaderboardUserDto> getLeaderboard() {
        return userRepository.findLeaderboard(PageRequest.of(0, LEADERBOARD_SIZE))
                .stream()
                .map(LeaderboardUserDto::fromEntity)
                .toList();
    }

    /**
     * Returns a fresh token: the JWT subject is the email, so an email change
     * would otherwise leave the client holding a token for an address that no longer exists.
     */
    @Transactional
    public AuthResponseDto updateProfile(String currentUserEmail, UpdateProfileRequestDto request) {
        User user = requireUser(currentUserEmail);

        String newUsername = AuthService.normalizeUsername(request.username());

        // Username update check with 20-day cooldown
        if (!newUsername.equalsIgnoreCase(user.getUsername())) {
            LocalDateTime unlocksAt = user.getLastUsernameChange() != null
                    ? user.getLastUsernameChange().plusDays(USERNAME_COOLDOWN_DAYS)
                    : null;
            if (unlocksAt != null && unlocksAt.isAfter(LocalDateTime.now())) {
                long daysLeft = Duration.between(LocalDateTime.now(), unlocksAt).toDays() + 1;
                throw ApiException.badRequest("Username can only be modified once every " + USERNAME_COOLDOWN_DAYS
                        + " days. Please wait " + daysLeft + " more days.");
            }

            if (userRepository.existsByUsername(newUsername)) {
                throw ApiException.conflict("Username @" + newUsername + " is already taken.");
            }

            user.setUsername(newUsername);
            user.setLastUsernameChange(LocalDateTime.now());
        }

        // Email update check
        String newEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (!newEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                throw ApiException.conflict("An account with this email already exists: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        user.setFullName(request.fullName().trim());
        user.setDietaryPreference(request.dietaryPreference());
        user.setAllergies(request.allergies());
        user.setMedicalConditions(request.medicalConditions());

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId());

        return AuthResponseDto.from(savedUser, token, 0);
    }

    @Transactional
    public void changePassword(String currentUserEmail, ChangePasswordRequestDto request) {
        User user = requireUser(currentUserEmail);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw ApiException.badRequest("Incorrect current password.");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw ApiException.badRequest("New password must be different from the current password.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    // A valid token whose account no longer exists is treated as an expired session
    private User requireUser(String email) {
        if (email == null) {
            throw ApiException.unauthorized("Please sign in again.");
        }
        return userRepository.findByEmail(email.toLowerCase(Locale.ROOT).trim())
                .orElseThrow(() -> ApiException.unauthorized("Your account could not be found. Please sign in again."));
    }
}
