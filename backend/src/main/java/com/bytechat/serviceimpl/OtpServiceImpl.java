package com.bytechat.serviceimpl;

import com.bytechat.entity.Otp;
import com.bytechat.repository.OtpRepository;
import com.bytechat.services.EmailService;
import com.bytechat.services.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final Random random = new Random();

    @Override
    @Transactional
    public void generateAndSendOtp(String email, com.bytechat.entity.OtpType otpType) {
        otpRepository.deleteByEmail(email);
        
        String code = String.format("%06d", random.nextInt(1000000));
        Otp otp = Otp.builder()
                .email(email)
                .code(code)
                .otpType(otpType)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .build();
        
        otpRepository.save(otp);
        if (otpType == com.bytechat.entity.OtpType.PASSWORD_RESET) {
            emailService.sendPasswordResetOtp(email, code);
        } else {
            emailService.sendOtp(email, code);
        }
    }

    @Override
    @Transactional
    public boolean verifyOtp(String email, String code) {
        return otpRepository.findByEmailAndCode(email, code)
                .map(otp -> {
                    if (otp.getExpiryTime().isAfter(LocalDateTime.now())) {
                        otp.setVerified(true);
                        otpRepository.save(otp);
                        return true;
                    }
                    return false;
                }).orElse(false);
    }

    @Override
    public boolean isEmailVerified(String email) {
        // This is a simplified check. In a real app, you might want to find the latest verified OTP within a timeframe.
        return otpRepository.findAll().stream()
                .filter(otp -> otp.getEmail().equals(email) && otp.isVerified())
                .anyMatch(otp -> otp.getExpiryTime().isAfter(LocalDateTime.now().minusMinutes(30)));
    }

    @Override
    @Transactional
    public void clearOtp(String email) {
        otpRepository.deleteByEmail(email);
    }
}
