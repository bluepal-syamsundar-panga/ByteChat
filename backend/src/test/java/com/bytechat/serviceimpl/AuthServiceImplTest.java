package com.bytechat.serviceimpl;

import com.bytechat.config.JwtService;
import com.bytechat.dto.request.AuthRequest;
import com.bytechat.dto.request.PasswordResetRequest;
import com.bytechat.dto.request.RefreshTokenRequest;
import com.bytechat.dto.response.AuthResponse;
import com.bytechat.entity.Role;
import com.bytechat.entity.User;
import com.bytechat.exception.ConflictException;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.EmailService;
import com.bytechat.services.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtService jwtService = new JwtService();

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private OtpService otpService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    private AuthRequest authRequest;
    private User user;

    @BeforeEach
    void setUp() throws Exception {

        authRequest = new AuthRequest();
        authRequest.setEmail("test@example.com");
        authRequest.setPassword("password123");
        authRequest.setDisplayName("Test User");
        authRequest.setOtpCode("123456");

        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .displayName("Test User")
                .role(Role.MEMBER)
                .build();

        // inject JwtService
        Field jwtField = AuthServiceImpl.class.getDeclaredField("jwtService");
        jwtField.setAccessible(true);
        jwtField.set(authService, jwtService);

        // ✅ FIXED STRONG KEY (256-bit)
        Field secretField = JwtService.class.getDeclaredField("secretKey");
        secretField.setAccessible(true);
        secretField.set(jwtService, "dGVzdHNlY3JldGtleXRlc3RzZWNyZXRrZXl0ZXN0c2VjcmV0a2V5MTIzNA==");

        Field expField = JwtService.class.getDeclaredField("jwtExpiration");
        expField.setAccessible(true);
        expField.set(jwtService, 1000 * 60 * 60);

        Field refreshField = JwtService.class.getDeclaredField("refreshExpiration");
        refreshField.setAccessible(true);
        refreshField.set(jwtService, 1000 * 60 * 60 * 24);
    }

    // ================= REGISTER =================

    @Test
    void register_Success() {
        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        AuthResponse response = authService.register(authRequest, "123456");

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertNotNull(response.getAccessToken());

        verify(userRepository).save(any(User.class));
        verify(emailService).sendRegistrationSuccess(anyString(), anyString());
        verify(otpService).clearOtp(anyString());
    }

    @Test
    void register_InvalidOtp_ThrowsException() {
        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> authService.register(authRequest, "wrongOtp"));
    }

    @Test
    void register_EmailExists_ThrowsException() {
        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> authService.register(authRequest, "123456"));
    }

    // ================= LOGIN =================

    @Test
    void login_Success() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(authRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    void login_InvalidCredentials_ThrowsException() {
        doThrow(new org.springframework.security.authentication.BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThrows(UnauthorizedException.class,
                () -> authService.login(authRequest));
    }

    // ================= REFRESH TOKEN =================

    @Test
    void refreshToken_Success() {
        String refreshToken = jwtService.generateRefreshToken(user);

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(refreshToken);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
    }

    @Test
    void refreshToken_Invalid_ThrowsException() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("invalid");

        // ❌ removed unnecessary stubbing here

        assertThrows(Exception.class,
                () -> authService.refreshToken(request));
    }

    // ================= OTP =================

    @Test
    void sendRegistrationOtp_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        authService.sendRegistrationOtp("new@example.com");

        verify(otpService).generateAndSendOtp(eq("new@example.com"), any());
    }

    @Test
    void sendRegistrationOtp_AlreadyExists() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> authService.sendRegistrationOtp("test@example.com"));
    }

    @Test
    void sendForgotPasswordOtp_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        authService.sendForgotPasswordOtp("test@example.com");

        verify(otpService).generateAndSendOtp(eq("test@example.com"), any());
    }

    @Test
    void sendForgotPasswordOtp_UserNotFound() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> authService.sendForgotPasswordOtp("test@example.com"));
    }

    // ================= RESET PASSWORD =================

    @Test
    void resetPassword_Success() {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("test@example.com");
        request.setCode("123456");
        request.setNewPassword("newPass");

        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedNew");

        authService.resetPassword(request);

        verify(userRepository).save(any(User.class));
        verify(otpService).clearOtp(anyString());
    }

    @Test
    void resetPassword_InvalidOtp() {
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("test@example.com");
        request.setCode("wrong");

        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> authService.resetPassword(request));
    }
}