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
import lombok.extern.slf4j.Slf4j;
import com.bytechat.services.EmailService;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.bytechat.services.OtpService otpService;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponse register(AuthRequest request, String otpCode) {
        log.info("Attempting to register user: {}", request.getEmail());
        if (!otpService.verifyOtp(request.getEmail(), otpCode)) {
            log.warn("Registration failed: Invalid or expired OTP for email {}", request.getEmail());
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: Email {} already exists", request.getEmail());
            throw new com.bytechat.exception.ConflictException("Email already taken");
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

        // Send registration success email
        try {
            emailService.sendRegistrationSuccess(user.getEmail(), user.getDisplayName());
        } catch (Exception e) {
            log.error("Failed to send registration success email to {}: {}", user.getEmail(), e.getMessage());
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("User {} registered successfully", user.getEmail());
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
        log.info("Attempting login for user: {}", request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            log.warn("Login failed for user {}: {}", request.getEmail(), e.getMessage());
            throw new com.bytechat.exception.UnauthorizedException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("User not found"));

        user.setOnline(true);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("User {} logged in successfully", user.getEmail());
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
        log.info("Refreshing token");
        String refreshToken = request.getRefreshToken();
        String email = jwtService.extractUsername(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("User not found"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            log.warn("Invalid refresh token attempt for user {}", email);
            throw new com.bytechat.exception.UnauthorizedException("Invalid refresh token");
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
        log.info("Requesting registration OTP for: {}", email);
        if (userRepository.existsByEmail(email)) {
            log.warn("OTP request failed: Email {} already registered", email);
            throw new com.bytechat.exception.ConflictException("Email already registered");
        }
        otpService.generateAndSendOtp(email, com.bytechat.entity.OtpType.REGISTRATION);
    }

    @Override
    public void sendForgotPasswordOtp(String email) {
        log.info("Requesting forgot password OTP for: {}", email);
        if (!userRepository.existsByEmail(email)) {
            log.warn("OTP request failed: No account found for email {}", email);
            throw new com.bytechat.exception.ResourceNotFoundException("No account found with this email");
        }
        otpService.generateAndSendOtp(email, com.bytechat.entity.OtpType.PASSWORD_RESET);
    }

    @Override
    @Transactional
    public void resetPassword(com.bytechat.dto.request.PasswordResetRequest request) {
        log.info("Attempting password reset for: {}", request.getEmail());
        if (!otpService.verifyOtp(request.getEmail(), request.getCode())) {
            log.warn("Password reset failed: Invalid OTP for {}", request.getEmail());
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new com.bytechat.exception.ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpService.clearOtp(request.getEmail());
        log.info("Password reset successful for user: {}", request.getEmail());
    }
}
