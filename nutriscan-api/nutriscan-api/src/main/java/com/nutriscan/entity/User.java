package com.nutriscan.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String dietaryPreference;
    private String allergies;
    private String medicalConditions;

    @Builder.Default
    @Column(name = "unique_discoveries")
    private Integer uniqueDiscoveries = 0;

    @Builder.Default
    @Column(name = "scout_score")
    private Integer scoutScore = 0;

    @Column(name = "last_username_change")
    private LocalDateTime lastUsernameChange;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (uniqueDiscoveries == null) uniqueDiscoveries = 0;
        if (scoutScore == null) scoutScore = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}