package com.bytechat.controllers;

import com.bytechat.dto.request.AuthRequest;
import com.bytechat.dto.request.PasswordResetRequest;
import com.bytechat.dto.request.RefreshTokenRequest;
import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.AuthResponse;
import com.bytechat.exception.ConflictException;
import com.bytechat.exception.ResourceNotFoundException;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Endpoints for user registration, login, and password management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account using an email, password, and OTP verification code")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User registered successfully", 
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid registration data or OTP")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody AuthRequest request) {
        log.info("Received registration request for email: {}", request.getEmail());
        try {
            AuthResponse response = authService.register(request, request.getOtpCode());
            return ResponseEntity.ok(ApiResponse.success(response, "User registered successfully"));
        } catch (ConflictException | UnauthorizedException | ResourceNotFoundException | IllegalArgumentException e) {
            log.warn("Register failed for email {}: {}", request.getEmail(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected register error for email {}", request.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/register/send-otp")
    @Operation(summary = "Send registration OTP", description = "Sends a verification OTP to the provided email for account registration")
    public ResponseEntity<ApiResponse<Void>> sendRegistrationOtp(
            @Parameter(description = "Email address to send OTP to") @RequestParam("email") String email) {
        try {
            authService.sendRegistrationOtp(email);
            return ResponseEntity.ok(ApiResponse.success(null, "OTP sent to your email"));
        } catch (ConflictException | IllegalArgumentException e) {
            log.warn("Send registration OTP failed for {}: {}", email, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected send registration OTP error for {}", email, e);
            throw e;
        }
    }

    @PostMapping("/forgot-password/send-otp")
    @Operation(summary = "Send forgot password OTP", description = "Sends a password reset OTP to the provided email")
    public ResponseEntity<ApiResponse<Void>> sendForgotPasswordOtp(
            @Parameter(description = "Email address associated with the account") @RequestParam("email") String email) {
        try {
            authService.sendForgotPasswordOtp(email);
            return ResponseEntity.ok(ApiResponse.success(null, "OTP sent to your email"));
        } catch (ResourceNotFoundException | IllegalArgumentException e) {
            log.warn("Send forgot password OTP failed for {}: {}", email, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected forgot password OTP error for {}", email, e);
            throw e;
        }
    }

    @PostMapping("/forgot-password/reset")
    @Operation(summary = "Reset password", description = "Resets the user password using a valid OTP")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
        } catch (ResourceNotFoundException | IllegalArgumentException e) {
            log.warn("Reset password failed for {}: {}", request.getEmail(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected reset password error for {}", request.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates a user and returns a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        log.info("Received login request for email: {}", request.getEmail());
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
        } catch (UnauthorizedException | ResourceNotFoundException | IllegalArgumentException e) {
            log.warn("Login failed for email {}: {}", request.getEmail(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected login error for email {}", request.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT token", description = "Returns a new access token using a valid refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request);
            return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
        } catch (UnauthorizedException | ResourceNotFoundException | IllegalArgumentException e) {
            log.warn("Refresh token failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected refresh token error", e);
            throw e;
        }
    }
}
