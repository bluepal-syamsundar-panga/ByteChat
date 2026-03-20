package com.bytechat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinMeetingRequest {
    @NotBlank
    private String password;
}
