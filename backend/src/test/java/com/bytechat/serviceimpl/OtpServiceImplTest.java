package com.bytechat.serviceimpl;

import com.bytechat.entity.Otp;
import com.bytechat.entity.OtpType;
import com.bytechat.repository.OtpRepository;
import com.bytechat.services.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    @Mock
    private OtpRepository otpRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private OtpServiceImpl otpService;

    private String email = "test@example.com";
    private String code = "123456";
    private Otp otp;

    @BeforeEach
    void setUp() {
        otp = Otp.builder()
                .email(email)
                .code(code)
                .otpType(OtpType.REGISTRATION)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .verified(false)
                .build();
    }

    @Test
    void generateAndSendOtp_Registration_Success() {
        otpService.generateAndSendOtp(email, OtpType.REGISTRATION);

        verify(otpRepository, times(1)).deleteByEmail(email);
        verify(otpRepository, times(1)).save(any(Otp.class));
        verify(emailService, times(1)).sendOtp(eq(email), anyString());
    }

    @Test
    void generateAndSendOtp_PasswordReset_Success() {
        otpService.generateAndSendOtp(email, OtpType.PASSWORD_RESET);

        verify(emailService, times(1)).sendPasswordResetOtp(eq(email), anyString());
    }

    @Test
    void verifyOtp_Success() {
        when(otpRepository.findByEmailAndCode(email, code)).thenReturn(Optional.of(otp));

        boolean result = otpService.verifyOtp(email, code);

        assertTrue(result);
        assertTrue(otp.isVerified());
        verify(otpRepository, times(1)).save(otp);
    }

    @Test
    void verifyOtp_Expired_ReturnsFalse() {
        otp.setExpiryTime(LocalDateTime.now().minusMinutes(1));
        when(otpRepository.findByEmailAndCode(email, code)).thenReturn(Optional.of(otp));

        boolean result = otpService.verifyOtp(email, code);

        assertFalse(result);
        assertFalse(otp.isVerified());
    }

    @Test
    void isEmailVerified_Success() {
        otp.setVerified(true);
        when(otpRepository.findAll()).thenReturn(Collections.singletonList(otp));

        boolean result = otpService.isEmailVerified(email);

        assertTrue(result);
    }

    @Test
    void clearOtp_Success() {
        otpService.clearOtp(email);
        verify(otpRepository, times(1)).deleteByEmail(email);
    }
}
