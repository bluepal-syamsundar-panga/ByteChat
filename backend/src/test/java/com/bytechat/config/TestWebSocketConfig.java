package com.bytechat.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@TestConfiguration
public class TestWebSocketConfig {

    @Bean
    @org.springframework.context.annotation.Primary
    public SimpMessagingTemplate simpMessagingTemplate() {
        MessageChannel channel = new MessageChannel() {
            @Override
            public boolean send(Message<?> message) {
                return true;
            }

            @Override
            public boolean send(Message<?> message, long timeout) {
                return true;
            }
        };
        return new SimpMessagingTemplate(channel);
    }
}
