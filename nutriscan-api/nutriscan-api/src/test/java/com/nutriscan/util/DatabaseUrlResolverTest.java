package com.nutriscan.util;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseUrlResolverTest {

    @Test
    void convertsRenderInternalUrlWithoutPort() {
        Map<String, String> props = DatabaseUrlResolver.fromDatabaseUrl(
                "postgresql://nutriscan:s3cr3t@dpg-abc123-a/nutriscandb");

        assertThat(props)
                .containsEntry("spring.datasource.url", "jdbc:postgresql://dpg-abc123-a:5432/nutriscandb")
                .containsEntry("spring.datasource.username", "nutriscan")
                .containsEntry("spring.datasource.password", "s3cr3t");
    }

    @Test
    void keepsPortQueryAndDecodesPassword() {
        Map<String, String> props = DatabaseUrlResolver.fromDatabaseUrl(
                "postgres://user:p%40ss+word@db.example.com:6543/app?sslmode=require");

        assertThat(props)
                .containsEntry("spring.datasource.url", "jdbc:postgresql://db.example.com:6543/app?sslmode=require")
                .containsEntry("spring.datasource.password", "p@ss+word");
    }

    @Test
    void ignoresMissingOrNonPostgresUrls() {
        assertThat(DatabaseUrlResolver.fromDatabaseUrl(null)).isEmpty();
        assertThat(DatabaseUrlResolver.fromDatabaseUrl("  ")).isEmpty();
        assertThat(DatabaseUrlResolver.fromDatabaseUrl("mysql://u:p@h/db")).isEmpty();
    }

    @Test
    void explicitDbUrlWins() {
        System.clearProperty("spring.datasource.url");
        DatabaseUrlResolver.applyFromEnvironment(Map.of(
                "DB_URL", "jdbc:postgresql://localhost:5432/local",
                "DATABASE_URL", "postgresql://u:p@remote/db"));
        assertThat(System.getProperty("spring.datasource.url")).isNull();
    }

    @Test
    void explicitSpringDatasourceUrlWins() {
        // e.g. Neon configured through SPRING_DATASOURCE_URL on Render: DATABASE_URL must not override it
        System.clearProperty("spring.datasource.url");
        DatabaseUrlResolver.applyFromEnvironment(Map.of(
                "SPRING_DATASOURCE_URL", "jdbc:postgresql://ep-example-pooler.neon.tech/neondb?sslmode=require",
                "DATABASE_URL", "postgresql://u:p@remote/db"));
        assertThat(System.getProperty("spring.datasource.url")).isNull();
    }
}
