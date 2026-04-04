package com.bytechat.serviceimpl;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendOtp_Success() {
        when(templateEngine.process(eq("emails/register-otp"), any(Context.class))).thenReturn("<html>OTP</html>");

        emailService.sendOtp("test@example.com", "123456");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
        verify(templateEngine, times(1)).process(eq("emails/register-otp"), any(Context.class));
    }

    @Test
    void sendRegistrationSuccess_Success() {
        when(templateEngine.process(eq("emails/register-success"), any(Context.class))).thenReturn("<html>Welcome</html>");

        emailService.sendRegistrationSuccess("test@example.com", "Syam");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendPasswordResetOtp_Success() {
        when(templateEngine.process(eq("emails/password-reset"), any(Context.class))).thenReturn("<html>Reset</html>");

        emailService.sendPasswordResetOtp("test@example.com", "654321");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendWorkspaceSuccess_Success() {
        when(templateEngine.process(eq("emails/workspace-success"), any(Context.class))).thenReturn("<html>Workspace</html>");

        emailService.sendWorkspaceSuccess("test@example.com", "MyWorkspace", "Desc");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendInvitation_Success() {
        when(templateEngine.process(eq("emails/invitation"), any(Context.class))).thenReturn("<html>Invite</html>");

        emailService.sendInvitation("test@example.com", "Syam", "Engineering", "ByteChat", "CHANNEL");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendMeetingInvite_Success() {
        when(templateEngine.process(eq("emails/meeting-invite"), any(Context.class))).thenReturn("<html>Meeting</html>");

        emailService.sendMeetingInvite("test@example.com", "Syam", "Daily Standup", "general", "ByteChat");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }
}
