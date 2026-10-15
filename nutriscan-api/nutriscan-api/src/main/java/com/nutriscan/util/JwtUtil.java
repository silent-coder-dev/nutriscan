package com.nutriscan.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    // Development only. Anyone who can read this file could forge tokens with it,
    // so every deployed environment must set JWT_SECRET.
    private static final String DEV_ONLY_SECRET = "nutriscan_super_secret_health_shield_key_2026_xyz";

    private final Key signingKey;
    private final long expirationMillis;

    public JwtUtil(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration:7d}") Duration expiration
    ) {
        if (secret == null || secret.isBlank()) {
            log.warn("JWT_SECRET is not set: using the development-only secret. Set JWT_SECRET before deploying.");
            secret = DEV_ONLY_SECRET;
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 bytes for HS256.");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMillis = expiration.toMillis();
    }

    public String generateToken(String email , Long userId){
        return Jwts.builder()
                .setSubject(email)
                .claim("userID" , userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(signingKey , SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token){
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token){
        try{
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token){
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

}
