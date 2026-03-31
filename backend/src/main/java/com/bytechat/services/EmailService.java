package com.bytechat.services;

public interface EmailService {
    void sendOtp(String to, String otp);
    void sendRegistrationSuccess(String to, String userName);
    void sendPasswordResetOtp(String to, String otp);
    void sendWorkspaceSuccess(String to, String workspaceName, String description);
    void sendInvitation(String to, String inviterName, String entityName, String workspaceName, String type);
    void sendMeetingInvite(String to, String inviterName, String meetingTitle, String channelName, String workspaceName);
}
