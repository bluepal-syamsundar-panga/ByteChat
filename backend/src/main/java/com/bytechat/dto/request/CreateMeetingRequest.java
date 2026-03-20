package com.bytechat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMeetingRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String password;
}
