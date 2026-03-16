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
public class CreateWorkspaceRequest {
    @NotBlank(message = "Workspace name is required")
    @jakarta.validation.constraints.Size(min = 2, max = 50, message = "Workspace name must be between 2 and 50 characters")
    private String name;
    
    private String description;
    
    private boolean isPrivate;
}
