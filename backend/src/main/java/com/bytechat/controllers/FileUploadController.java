package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.dto.response.AttachmentResponse;
import com.bytechat.entity.Attachment;
import com.bytechat.entity.User;
import com.bytechat.services.FileStorageService;
import com.bytechat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "File Uploads", description = "Endpoints for uploading files and attachments")
@SecurityRequirement(name = "Bearer Authentication")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @Operation(summary = "Upload file", description = "Uploads a file and optionally associates it with a message.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "File uploaded successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadFile(
            @Parameter(description = "The multipart file to upload") @RequestParam(name = "file") MultipartFile file,
            @Parameter(description = "Optional ID of the message to associate this file with") @RequestParam(name = "messageId", required = false) Long messageId) {
        log.info("Received file upload request for file: {}, messageId: {}", file.getOriginalFilename(), messageId);
        
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            log.warn("Unauthorized file upload attempt.");
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        try {
            Attachment attachment = fileStorageService.storeFile(file, messageId, currentUser.getId());
            AttachmentResponse response = AttachmentResponse.builder()
                    .id(attachment.getId())
                    .fileName(attachment.getFileName())
                    .fileUrl(attachment.getFileUrl())
                    .fileType(attachment.getFileType())
                    .fileSize(attachment.getFileSize())
                    .build();
            log.info("File uploaded successfully: {} by user {}", attachment.getFileName(), currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
