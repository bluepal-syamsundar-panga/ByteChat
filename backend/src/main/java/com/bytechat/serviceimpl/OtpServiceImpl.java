package com.bytechat.serviceimpl;

import com.bytechat.services.EmailService;
import com.bytechat.services.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final String OTP_KEY_PREFIX = "otp:";
    private static final String VERIFIED_KEY_PREFIX = "otp:verified:";
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void generateAndSendOtp(String email, com.bytechat.entity.OtpType otpType) {
        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        
        // Store OTP in Redis with 10 minute TTL
        redisTemplate.opsForValue().set(OTP_KEY_PREFIX + email, code, Duration.ofMinutes(10));
        
        if (otpType == com.bytechat.entity.OtpType.PASSWORD_RESET) {
            emailService.sendPasswordResetOtp(email, code);
        } else {
            emailService.sendOtp(email, code);
        }
    }

    @Override
    public boolean verifyOtp(String email, String code) {
        String storedCode = (String) redisTemplate.opsForValue().get(OTP_KEY_PREFIX + email);
        
        if (storedCode != null && storedCode.equals(code)) {
            // Mark as verified in Redis with 30 minute TTL
            redisTemplate.opsForValue().set(VERIFIED_KEY_PREFIX + email, "true", Duration.ofMinutes(30));
            // Remove the OTP code after successful verification
            redisTemplate.delete(OTP_KEY_PREFIX + email);
            return true;
        }
        return false;
    }

    @Override
    public boolean isEmailVerified(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(VERIFIED_KEY_PREFIX + email));
    }

    @Override
    public void clearOtp(String email) {
        redisTemplate.delete(OTP_KEY_PREFIX + email);
        redisTemplate.delete(VERIFIED_KEY_PREFIX + email);
    }
}
