package com.bytechat.services;

public interface EmailService {
    void sendOtp(String to, String otp);
}
