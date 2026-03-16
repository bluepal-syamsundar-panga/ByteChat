package com.bytechat.serviceimpl;

import com.bytechat.config.JwtService;
import com.bytechat.dto.request.AuthRequest;
import com.bytechat.dto.request.RefreshTokenRequest;
import com.bytechat.dto.response.AuthResponse;
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
    private final com.bytechat.services.OtpService otpService;

    @Override
    @Transactional
    public AuthResponse register(AuthRequest request, String otpCode) {
        if (!otpService.verifyOtp(request.getEmail(), otpCode)) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already taken");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(com.bytechat.entity.Role.MEMBER)
                .lastSeen(LocalDateTime.now())
                .online(true)
                .build();

        userRepository.save(user);
        otpService.clearOtp(request.getEmail());

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
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

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
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Invalid refresh token");
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

    @Override
    public void sendRegistrationOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }
        otpService.generateAndSendOtp(email, com.bytechat.entity.OtpType.REGISTRATION);
    }

    @Override
    public void sendForgotPasswordOtp(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("No account found with this email");
        }
        otpService.generateAndSendOtp(email, com.bytechat.entity.OtpType.PASSWORD_RESET);
    }

    @Override
    @Transactional
    public void resetPassword(com.bytechat.dto.request.PasswordResetRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getCode())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpService.clearOtp(request.getEmail());
    }
}
