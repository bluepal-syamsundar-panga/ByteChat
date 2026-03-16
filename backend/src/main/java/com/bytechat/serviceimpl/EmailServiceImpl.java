package com.bytechat.serviceimpl;

import com.bytechat.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendOtp(String to, String otp) {
        log.info("Sending OTP to email: {}", to);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@bytechat.com");
            message.setTo(to);
            message.setSubject("Your ByteChat Workspace Creation OTP");
            message.setText("Your OTP for creating a workspace is: " + otp + ". It will expire in 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // In a real scenario, we might want to throw an exception here
            // For now, we'll just log it.
        }
    }
}
