package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.entity.Attachment;
import com.bytechat.entity.User;
import com.bytechat.services.FileStorageService;
import com.bytechat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Attachment>> uploadFile(
            @RequestParam(name = "file") MultipartFile file,
            @RequestParam(name = "messageId", required = false) Long messageId) {
        log.info("Received file upload request for file: {}, messageId: {}", file.getOriginalFilename(), messageId);
        
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            log.warn("Unauthorized file upload attempt.");
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        try {
            Attachment attachment = fileStorageService.storeFile(file, messageId, currentUser.getId());
            log.info("File uploaded successfully: {} by user {}", attachment.getFileName(), currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success(attachment, "File uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
