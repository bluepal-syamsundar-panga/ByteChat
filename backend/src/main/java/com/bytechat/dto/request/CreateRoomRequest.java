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
public class CreateRoomRequest {
    @NotBlank(message = "Room name is required")
    private String name;
    
    private String description;
    
    private boolean isPrivate;
}
