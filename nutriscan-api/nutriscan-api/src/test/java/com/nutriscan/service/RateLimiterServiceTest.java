package com.nutriscan.service;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class RateLimiterServiceTest {

    @Test
    @SuppressWarnings("unchecked")
    void countsInRedisAndSetsWindowOnFirstScan() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment("rate:guest:1.2.3.4")).thenReturn(1L, 5L, 6L);

        RateLimiterService limiter = new RateLimiterService(redis);

        assertThat(limiter.tryConsume("1.2.3.4")).isEqualTo(new RateLimiterService.Result(true, 4));
        assertThat(limiter.tryConsume("1.2.3.4")).isEqualTo(new RateLimiterService.Result(true, 0));
        assertThat(limiter.tryConsume("1.2.3.4")).isEqualTo(new RateLimiterService.Result(false, 0));
        verify(redis, times(1)).expire("rate:guest:1.2.3.4", Duration.ofHours(24));
    }

    @Test
    @SuppressWarnings("unchecked")
    void fallsBackToMemoryWhenRedisIsDown() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenThrow(new RedisConnectionFailureException("Connection refused"));

        RateLimiterService limiter = new RateLimiterService(redis);

        for (int i = 1; i <= RateLimiterService.MAX_FREE_SCANS; i++) {
            RateLimiterService.Result result = limiter.tryConsume("9.9.9.9");
            assertThat(result.allowed()).isTrue();
            assertThat(result.remaining()).isEqualTo(RateLimiterService.MAX_FREE_SCANS - i);
        }
        assertThat(limiter.tryConsume("9.9.9.9").allowed()).isFalse();
        // Other IPs have their own quota
        assertThat(limiter.tryConsume("8.8.8.8").allowed()).isTrue();
        // After the first failure Redis is skipped instead of being retried per request
        verify(ops, times(1)).increment(anyString());
    }
}
