package com.bytechat.serviceimpl;

import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PresenceServiceImpl implements PresenceService {

    private final UserRepository userRepository;

    @Override
    public void handleUserConnect(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(true);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Override
    public void handleUserDisconnect(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOnline(false);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }
}
