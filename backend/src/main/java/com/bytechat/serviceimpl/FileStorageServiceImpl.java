package com.bytechat.serviceimpl;

import com.bytechat.entity.Attachment;
import com.bytechat.entity.Message;
import com.bytechat.entity.User;
import com.bytechat.repository.AttachmentRepository;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    @Override
    public Attachment storeFile(MultipartFile file, Long messageId, Long uploaderId) {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            if (fileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Message message = messageId != null ? messageRepository.findById(messageId).orElse(null) : null;
            User uploader = userRepository.findById(uploaderId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Attachment attachment = Attachment.builder()
                    .fileName(originalFileName)
                    .fileUrl("/uploads/" + fileName)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .message(message)
                    .uploader(uploader)
                    .build();

            return attachmentRepository.save(attachment);

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }
}
