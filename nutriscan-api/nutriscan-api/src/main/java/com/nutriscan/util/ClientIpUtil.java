package com.nutriscan.util;

import jakarta.servlet.http.HttpServletRequest;

public class ClientIpUtil {

    private ClientIpUtil() {
    }

    /**
     * Uses the socket address only. Raw X-Forwarded-For headers are client-controlled,
     * so trusting them would let guests dodge the free-scan limit by sending a fake IP.
     * Behind a reverse proxy, set server.forward-headers-strategy so the container
     * resolves the real client address into getRemoteAddr().
     */
    public static String getClientIp(HttpServletRequest request){
        String ip = request.getRemoteAddr();
        if (ip == null || ip.isBlank() || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }
        return ip;
    }
}
