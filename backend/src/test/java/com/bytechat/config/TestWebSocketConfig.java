package com.bytechat.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@TestConfiguration
public class TestWebSocketConfig {

    @Bean
    public SimpMessagingTemplate simpMessagingTemplate() {
        return null; // ✅ Dummy bean to avoid mocking issue
    }
}