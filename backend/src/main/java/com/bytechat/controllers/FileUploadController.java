package com.bytechat.controllers;

import com.bytechat.dto.response.ApiResponse;
import com.bytechat.entity.Attachment;
import com.bytechat.entity.User;
import com.bytechat.services.FileStorageService;
import com.bytechat.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Attachment>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "messageId", required = false) Long messageId) {
        
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        try {
            Attachment attachment = fileStorageService.storeFile(file, messageId, currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success(attachment, "File uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
