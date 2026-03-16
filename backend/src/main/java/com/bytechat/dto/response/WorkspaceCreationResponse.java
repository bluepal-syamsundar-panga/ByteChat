package com.bytechat.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceCreationResponse {
    private WorkspaceResponse workspace;
    private AuthResponse auth;
}
