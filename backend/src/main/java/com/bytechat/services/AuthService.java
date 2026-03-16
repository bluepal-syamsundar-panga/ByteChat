package com.bytechat.services;

import com.bytechat.dto.request.AuthRequest;
import com.bytechat.dto.request.RefreshTokenRequest;
import com.bytechat.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(AuthRequest request, String otpCode);
    AuthResponse login(AuthRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void sendRegistrationOtp(String email);
    void sendForgotPasswordOtp(String email);
    void resetPassword(com.bytechat.dto.request.PasswordResetRequest request);
}
