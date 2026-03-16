package com.bytechat.services;

import com.bytechat.entity.OtpType;

public interface OtpService {
    void generateAndSendOtp(String email, OtpType otpType);
    boolean verifyOtp(String email, String code);
    boolean isEmailVerified(String email);
    void clearOtp(String email);
}
