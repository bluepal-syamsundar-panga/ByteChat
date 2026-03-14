package com.bytechat.services;

import com.bytechat.entity.Attachment;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    Attachment storeFile(MultipartFile file, Long messageId, Long uploaderId);
}
