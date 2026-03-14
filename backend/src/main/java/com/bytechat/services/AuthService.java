package com.bytechat.services;

import com.bytechat.dto.request.AuthRequest;
import com.bytechat.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(AuthRequest request);
    AuthResponse login(AuthRequest request);
}
