package com.nutriscan.service;

import com.nutriscan.config.PasswordEncoder;
import com.nutriscan.dto.AuthResponseDto;
import com.nutriscan.dto.LoginRequestDto;
import com.nutriscan.dto.RegisterRequestDto;
import com.nutriscan.entity.User;
import com.nutriscan.exception.ApiException;
import com.nutriscan.repository.UserRepository;
import com.nutriscan.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Invalid username/email or password credentials.";

    private final UserRepository userRepository;
    private final ProductScanService productScanService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        String normalizedEmail = request.email().toLowerCase(Locale.ROOT).trim();
        String normalizedUsername = normalizeUsername(request.username());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw ApiException.conflict("An account with this email already exists: " + normalizedEmail);
        }

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw ApiException.conflict("Username @" + normalizedUsername + " is already taken.");
        }

        User user = User.builder()
                .username(normalizedUsername) // <-- Save clean unique username
                .fullName(request.fullName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .dietaryPreference(request.dietaryPreference())
                .allergies(request.allergies())
                .medicalConditions(request.medicalConditions())
                .uniqueDiscoveries(0)
                .scoutScore(0)
                .build();

        User savedUser = userRepository.save(user);

        int migratedCount = productScanService.migrateGuestScans(savedUser, request.guestBarcodes());

        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId());

        return AuthResponseDto.from(savedUser, token, migratedCount);
    }

    @Transactional
    public AuthResponseDto login(LoginRequestDto request) {
        String identifier = request.email().toLowerCase(Locale.ROOT).trim();

        // Identifier may be an email or a username
        User user = userRepository.findByEmailOrUsername(identifier)
                .orElseThrow(() -> ApiException.unauthorized(INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw ApiException.unauthorized(INVALID_CREDENTIALS);
        }

        int migratedCount = productScanService.migrateGuestScans(user, request.guestBarcodes());

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return AuthResponseDto.from(user, token, migratedCount);
    }

    public boolean isUsernameAvailable(String username) {
        String clean = normalizeUsername(username);
        return !clean.isEmpty() && !userRepository.existsByUsername(clean);
    }

    static String normalizeUsername(String username) {
        return username == null ? "" : username.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", "");
    }
}
