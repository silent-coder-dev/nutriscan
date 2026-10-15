package com.nutriscan.config;

import com.nutriscan.entity.User;
import com.nutriscan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import java.util.Locale;

/**
 * Optionally creates a demo account on start. Off by default; every value comes from
 * environment variables so no real email or password lives in the source code.
 * Never deletes or resets an existing account.
 *
 * Enable with SEED_ENABLED=true plus SEED_EMAIL and SEED_PASSWORD (SEED_USERNAME, SEED_FULL_NAME optional).
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.email:}")
    private String seedEmail;

    @Value("${app.seed.password:}")
    private String seedPassword;

    @Value("${app.seed.username:demo_scout}")
    private String seedUsername;

    @Value("${app.seed.full-name:Demo Scout}")
    private String seedFullName;

    @Override
    public void run(String... args) {
        if (seedEmail.isBlank() || seedPassword.isBlank()) {
            log.warn("SEED_ENABLED is true but SEED_EMAIL / SEED_PASSWORD are not set; skipping the demo account.");
            return;
        }

        String email = seedEmail.trim().toLowerCase(Locale.ROOT);
        String username = seedUsername.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
            log.info("Demo account already present; leaving it unchanged.");
            return;
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(seedPassword))
                .username(username)
                .fullName(seedFullName.trim())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Demo account created with ID: {}", savedUser.getId());
    }
}
