package com.bytechat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReactionResponse {
    private String emoji;
    private Long userId;
    private String username;
}
