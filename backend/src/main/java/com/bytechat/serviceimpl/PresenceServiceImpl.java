package com.bytechat.serviceimpl;

import com.bytechat.repository.UserRepository;
import com.bytechat.services.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PresenceServiceImpl implements PresenceService {

    private static final String PRESENCE_KEY_PREFIX = "user:presence:";
    
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void handleUserConnect(String email) {
        // Track presence in Redis
        redisTemplate.opsForValue().set(PRESENCE_KEY_PREFIX + email, "online");
        
        // Update last seen in DB
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(true); // Keep in sync for now, but Redis is the source of truth
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Override
    public void handleUserDisconnect(String email) {
        // Update presence in Redis
        redisTemplate.opsForValue().set(PRESENCE_KEY_PREFIX + email, "offline");
        
        // Update last seen in DB
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(false);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }
}
