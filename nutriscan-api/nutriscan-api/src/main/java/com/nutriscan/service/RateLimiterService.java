package com.nutriscan.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Free-scan quota for guests: {@value #MAX_FREE_SCANS} lookups per IP per 24 hours.
 * Counts live in Redis; if Redis is unreachable the limiter keeps working from an
 * in-memory counter instead of failing every guest request with a 500.
 */
@Service
@Slf4j
public class RateLimiterService {

    public static final int MAX_FREE_SCANS = 5;
    private static final Duration WINDOW_DURATION = Duration.ofHours(24);
    private static final Duration REDIS_RETRY_DELAY = Duration.ofSeconds(30);
    private static final String KEY_PREFIX = "rate:guest:";

    private final StringRedisTemplate redisTemplate;
    private final Cache<String, AtomicLong> localCounters = Caffeine.newBuilder()
            .expireAfterWrite(WINDOW_DURATION)
            .maximumSize(100_000)
            .build();

    // While Redis is down, skip it until this time instead of waiting on a timeout per request
    private volatile long redisRetryAtMillis = 0;

    public RateLimiterService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public record Result(boolean allowed, long remaining) {}

    /** Counts one guest scan for this IP and reports whether it is within the quota. */
    public Result tryConsume(String clientIp) {
        long used = increment(KEY_PREFIX + clientIp);
        return new Result(used <= MAX_FREE_SCANS, Math.max(0, MAX_FREE_SCANS - used));
    }

    private long increment(String key) {
        if (System.currentTimeMillis() >= redisRetryAtMillis) {
            try {
                Long count = redisTemplate.opsForValue().increment(key);
                if (count != null) {
                    // Set the window on first use; also repair keys left without a TTL
                    if (count == 1 || (count > MAX_FREE_SCANS && Long.valueOf(-1L).equals(redisTemplate.getExpire(key)))) {
                        redisTemplate.expire(key, WINDOW_DURATION);
                    }
                    return count;
                }
            } catch (RuntimeException e) {
                redisRetryAtMillis = System.currentTimeMillis() + REDIS_RETRY_DELAY.toMillis();
                log.warn("Redis unavailable ({}). Using in-memory guest rate limiting for {}s.",
                        e.getMessage(), REDIS_RETRY_DELAY.toSeconds());
            }
        }
        return localCounters.get(key, k -> new AtomicLong()).incrementAndGet();
    }
}
