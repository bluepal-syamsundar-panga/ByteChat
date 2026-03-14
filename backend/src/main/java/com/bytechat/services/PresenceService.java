package com.bytechat.services;

public interface PresenceService {
    void handleUserConnect(String email);
    void handleUserDisconnect(String email);
}
