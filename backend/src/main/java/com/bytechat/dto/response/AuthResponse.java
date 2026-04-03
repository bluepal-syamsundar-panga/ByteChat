package com.bytechat.dto.response;

public class AuthResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private String email;
    private String displayName;
    private String avatarUrl;
    private Long userId;
    private String role;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken, String email, String displayName,
                        String avatarUrl, Long userId, String role) {
        this.token = accessToken;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.email = email;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.userId = userId;
        this.role = role;
    }

    public static AuthResponse of(String accessToken, String refreshToken, String email, String displayName,
                                  String avatarUrl, Long userId, String role) {
        return new AuthResponse(accessToken, refreshToken, email, displayName, avatarUrl, userId, role);
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
