package com.bytechat.serviceimpl;

import com.bytechat.entity.Attachment;
import com.bytechat.entity.User;
import com.bytechat.repository.AttachmentRepository;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceImplTest {

    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FileStorageServiceImpl fileStorageService;

    @TempDir
    Path tempDir;

    private User uploader;

    @BeforeEach
    void setUp() {
        uploader = User.builder().id(1L).email("uploader@example.com").build();
        // Override the storage location for testing
        ReflectionTestUtils.setField(fileStorageService, "fileStorageLocation", tempDir);
    }

    @Test
    void storeFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "hello world".getBytes()
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(uploader));
        when(attachmentRepository.save(any(Attachment.class))).thenAnswer(i -> i.getArgument(0));

        Attachment result = fileStorageService.storeFile(file, null, 1L);

        assertNotNull(result);
        assertEquals("test.txt", result.getFileName());
        assertTrue(result.getFileUrl().contains("test.txt"));
        assertEquals("text/plain", result.getFileType());
        assertEquals(11L, result.getFileSize());
        assertEquals(uploader, result.getUploader());
        
        verify(attachmentRepository, times(1)).save(any(Attachment.class));
    }

    @Test
    void storeFile_UserNotFound_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "data".getBytes());
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> fileStorageService.storeFile(file, null, 1L));
    }

    @Test
    void storeFile_InvalidPath_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "../test.txt", "text/plain", "data".getBytes());
        
        assertThrows(RuntimeException.class, () -> fileStorageService.storeFile(file, null, 1L));
    }
}
