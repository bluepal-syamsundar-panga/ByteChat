package com.bytechat.serviceimpl;

import com.bytechat.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Override
    public void sendOtp(String to, String otp) {
        log.info("Sending registration OTP to email: {}", to);
        sendHtmlEmail(to, "Verify Your ByteChat Account", "register-otp", "otp", otp);
    }

    @Override
    public void sendRegistrationSuccess(String to, String userName) {
        log.info("Sending registration success email to: {}", to);
        sendHtmlEmail(to, "Welcome to ByteChat!", "register-success", "userName", userName);
    }

    @Override
    public void sendPasswordResetOtp(String to, String otp) {
        log.info("Sending password reset OTP to: {}", to);
        sendHtmlEmail(to, "Reset Your ByteChat Password", "password-reset", "otp", otp);
    }

    @Override
    public void sendWorkspaceSuccess(String to, String workspaceName, String description) {
        log.info("Sending workspace success email to: {}", to);
        Context context = new Context();
        context.setVariable("workspaceName", workspaceName);
        context.setVariable("workspaceDescription", description);
        sendHtmlEmail(to, "Workspace Created Successfully", "workspace-success", context);
    }

    @Override
    public void sendInvitation(String to, String inviterName, String entityName, String workspaceName, String type) {
        log.info("Sending {} invitation to: {}", type, to);
        Context context = new Context();
        context.setVariable("inviterName", inviterName);
        context.setVariable("entityName", entityName);
        context.setVariable("workspaceName", workspaceName);
        context.setVariable("type", type);
        sendHtmlEmail(to, "You've been invited to join " + entityName, "invitation", context);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, String variableName, Object variableValue) {
        Context context = new Context();
        context.setVariable(variableName, variableValue);
        sendHtmlEmail(to, subject, templateName, context);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("no-reply@bytechat.com");
            helper.setTo(to);
            helper.setSubject(subject);
            String htmlContent = templateEngine.process("emails/" + templateName, context);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
        }
    }
}
