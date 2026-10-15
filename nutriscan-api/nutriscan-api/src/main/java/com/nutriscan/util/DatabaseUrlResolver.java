package com.nutriscan.util;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Hosting platforms (Render, Railway, Heroku…) give the database as one URL like
 * {@code postgresql://user:pass@host:5432/db}. Spring needs a JDBC URL plus a separate
 * username and password, so this converts one into the other.
 */
public final class DatabaseUrlResolver {

    private DatabaseUrlResolver() {
    }

    /** Spring datasource properties for a postgres(ql):// URL; empty if the URL is missing or not Postgres. */
    public static Map<String, String> fromDatabaseUrl(String databaseUrl) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return Map.of();
        }
        URI uri = URI.create(databaseUrl.trim());
        String scheme = uri.getScheme();
        if (!"postgres".equals(scheme) && !"postgresql".equals(scheme)) {
            return Map.of();
        }
        if (uri.getHost() == null) {
            throw new IllegalArgumentException("DATABASE_URL has no host");
        }

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String database = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost()).append(':').append(port).append('/').append(database);
        if (uri.getRawQuery() != null) {
            jdbcUrl.append('?').append(uri.getRawQuery()); // e.g. sslmode=require
        }

        Map<String, String> properties = new LinkedHashMap<>();
        properties.put("spring.datasource.url", jdbcUrl.toString());

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null && !userInfo.isEmpty()) {
            int colon = userInfo.indexOf(':');
            properties.put("spring.datasource.username", decode(colon >= 0 ? userInfo.substring(0, colon) : userInfo));
            if (colon >= 0) {
                properties.put("spring.datasource.password", decode(userInfo.substring(colon + 1)));
            }
        }
        return properties;
    }

    /**
     * Applies DATABASE_URL as system properties (which override application.properties and env vars),
     * unless a JDBC URL was given explicitly via SPRING_DATASOURCE_URL or DB_URL.
     */
    public static void applyFromEnvironment(Map<String, String> environment) {
        for (String explicitKey : new String[]{"SPRING_DATASOURCE_URL", "DB_URL"}) {
            String explicitJdbcUrl = environment.get(explicitKey);
            if (explicitJdbcUrl != null && !explicitJdbcUrl.isBlank()) {
                return;
            }
        }
        fromDatabaseUrl(environment.get("DATABASE_URL")).forEach(System::setProperty);
    }

    // Percent-decoding only: a literal '+' in a password must stay a '+'
    private static String decode(String value) {
        return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
    }
}
