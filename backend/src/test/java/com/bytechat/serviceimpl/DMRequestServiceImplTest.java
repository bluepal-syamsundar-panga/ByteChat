package com.bytechat.serviceimpl;

import com.bytechat.entity.DMRequest;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.User;
import com.bytechat.entity.Workspace;
import com.bytechat.repository.DMRequestRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.repository.WorkspaceRepository;
import com.bytechat.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DMRequestServiceImplTest {

    @Mock
    private DMRequestRepository dmRequestRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private DMRequestServiceImpl dmRequestService;

    private User sender;
    private User receiver;
    private Workspace workspace;
    private DMRequest dmRequest;

    @BeforeEach
    void setUp() {
        sender = User.builder().id(1L).email("sender@example.com").displayName("Sender").build();
        receiver = User.builder().id(2L).email("receiver@example.com").displayName("Receiver").build();
        workspace = Workspace.builder().id(1L).name("Workspace").build();

        dmRequest = DMRequest.builder()
                .id(1L)
                .sender(sender)
                .receiver(receiver)
                .workspace(workspace)
                .status(DMRequestStatus.PENDING)
                .build();
    }

    @Test
    void sendRequest_Success() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(dmRequestRepository.findByWorkspaceIdAndSenderIdAndReceiverId(anyLong(), anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        when(dmRequestRepository.save(any(DMRequest.class))).thenReturn(dmRequest);

        DMRequest result = dmRequestService.sendRequest(1L, sender, 2L);

        assertNotNull(result);
        assertEquals(DMRequestStatus.PENDING, result.getStatus());

        verify(notificationService, times(1))
                .sendNotification(eq(2L), eq("DM_INVITE"), anyString(), anyLong());
    }

    @Test
    void sendRequest_ToSelf_ThrowsException() {
        // ✅ MUST mock because service calls DB before validation
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));

        assertThrows(IllegalArgumentException.class,
                () -> dmRequestService.sendRequest(1L, sender, 1L));
    }

    @Test
    void sendRequest_Duplicate_ThrowsException() {
        when(workspaceRepository.findById(1L)).thenReturn(Optional.of(workspace));
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(dmRequestRepository.findByWorkspaceIdAndSenderIdAndReceiverId(1L, 1L, 2L))
                .thenReturn(Optional.of(dmRequest));

        assertThrows(IllegalArgumentException.class,
                () -> dmRequestService.sendRequest(1L, sender, 2L));
    }

    @Test
    void acceptRequest_Success() {
        when(dmRequestRepository.findById(1L)).thenReturn(Optional.of(dmRequest));
        when(dmRequestRepository.save(any(DMRequest.class))).thenReturn(dmRequest);

        DMRequest result = dmRequestService.acceptRequest(receiver, 1L);

        assertEquals(DMRequestStatus.ACCEPTED, result.getStatus());

        verify(notificationService, times(1))
                .sendNotification(eq(1L), eq("DM_INVITE_ACCEPTED"), anyString(), anyLong());
    }

    @Test
    void acceptRequest_WrongUser_ThrowsException() {
        User wrongUser = User.builder().id(3L).build();
        when(dmRequestRepository.findById(1L)).thenReturn(Optional.of(dmRequest));

        assertThrows(RuntimeException.class,
                () -> dmRequestService.acceptRequest(wrongUser, 1L));
    }

    @Test
    void rejectRequest_Success() {
        when(dmRequestRepository.findById(1L)).thenReturn(Optional.of(dmRequest));

        dmRequestService.rejectRequest(receiver, 1L);

        assertEquals(DMRequestStatus.REJECTED, dmRequest.getStatus());
        verify(dmRequestRepository, times(1)).save(dmRequest);
    }

    @Test
    void getPendingRequests_ReturnsList() {
        when(dmRequestRepository.findByReceiverAndStatus(any(User.class), eq(DMRequestStatus.PENDING)))
                .thenReturn(Collections.singletonList(dmRequest));

        List<DMRequest> results = dmRequestService.getPendingRequests(receiver);

        assertEquals(1, results.size());
    }
}