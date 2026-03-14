package com.bytechat.serviceimpl;

import com.bytechat.config.JwtService;
import com.bytechat.dto.request.AuthRequest;
import com.bytechat.dto.request.RefreshTokenRequest;
import com.bytechat.dto.response.AuthResponse;
import com.bytechat.entity.Role;
import com.bytechat.entity.User;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already taken");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(Role.MEMBER)
                .lastSeen(LocalDateTime.now())
                .online(true)
                .build();

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getId(),
                user.getRole().name()
        );
    }

    @Override
    @Transactional
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setOnline(true);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getId(),
                user.getRole().name()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String email = jwtService.extractUsername(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.of(
                newAccessToken,
                newRefreshToken,
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getId(),
                user.getRole().name()
        );
    }
}
