package com.bytechat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MessageRequest {
    @NotBlank(message = "Message content cannot be empty")
    private String content;
    
    // Optional: TEXT by default, can be FILE
    @Builder.Default
    private String type = "TEXT";
}
