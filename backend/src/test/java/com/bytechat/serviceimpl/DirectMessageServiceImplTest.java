package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.dto.response.UserResponse;
import com.bytechat.entity.DirectMessage;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.DMRequestRepository;
import com.bytechat.repository.DirectMessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDateTime;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectMessageServiceImplTest {

    @Mock
    private DirectMessageRepository directMessageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DMRequestRepository dmRequestRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ReactionRepository reactionRepository;

    @InjectMocks
    private DirectMessageServiceImpl directMessageService;

    private User sender;
    private User recipient;
    private DirectMessage dm;
    private MessageRequest messageRequest;

    @BeforeEach
    void setUp() {
        sender = User.builder().id(1L).email("sender@example.com").displayName("Sender").build();
        recipient = User.builder().id(2L).email("recipient@example.com").displayName("Recipient").build();
        dm = DirectMessage.builder().id(1L).fromUser(sender).toUser(recipient).content("Hi").build();
        messageRequest = new MessageRequest();
        messageRequest.setContent("Hi");
    }

    @Test
    void sendDirectMessage_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));
        when(userRepository.findUsersSharingRoomWith(anyLong(), any())).thenReturn(Collections.singletonList(recipient));
        when(directMessageRepository.save(any(DirectMessage.class))).thenReturn(dm);

        MessageResponse response = directMessageService.sendDirectMessage(2L, messageRequest, sender);

        assertNotNull(response);
        assertEquals("Hi", response.getContent());
        verify(notificationService, times(1)).sendNotification(eq(2L), anyString(), anyString(), anyLong());
    }

    @Test
    void sendDirectMessage_Unauthorized_ThrowsException() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));
        when(userRepository.findUsersSharingRoomWith(anyLong(), any())).thenReturn(Collections.emptyList());
        when(dmRequestRepository.existsBySenderAndReceiverAndStatus(any(), any(), any())).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> directMessageService.sendDirectMessage(2L, messageRequest, sender));
    }

    @Test
    void getDirectMessages_ReturnsPage() {
        Page<DirectMessage> dmPage = new PageImpl<>(Collections.singletonList(dm));
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));
        when(userRepository.findUsersSharingRoomWith(anyLong(), any())).thenReturn(Collections.singletonList(recipient));
        when(directMessageRepository.findConversation(eq(1L), eq(2L), any(PageRequest.class))).thenReturn(dmPage);

        CursorPageResponse<MessageResponse> responses = directMessageService.getDirectMessages(2L, null, null, 10, sender);

        assertEquals(1, responses.getItems().size());
    }

    @Test
    void getConversationParticipant_ReturnsPresenceDetails() {
        recipient.setOnline(false);
        recipient.setLastSeen(LocalDateTime.of(2026, 3, 30, 9, 45));
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));
        when(userRepository.findUsersSharingRoomWith(anyLong(), any())).thenReturn(Collections.singletonList(recipient));
        when(directMessageRepository.countUnreadBySender(1L, 2L)).thenReturn(3L);

        UserResponse response = directMessageService.getConversationParticipant(2L, sender);

        assertEquals("Recipient", response.getDisplayName());
        assertEquals(3L, response.getUnreadCount());
        assertEquals(recipient.getLastSeen(), response.getLastSeen());
        assertFalse(response.isOnline());
    }

    @Test
    void markAsRead_Success() {
        Page<DirectMessage> dmPage = new PageImpl<>(Collections.singletonList(dm));
        dm.setToUser(sender); // Message to the current user
        when(directMessageRepository.findConversation(eq(1L), eq(2L), any(PageRequest.class))).thenReturn(dmPage);

        directMessageService.markAsRead(2L, sender);

        assertNotNull(dm.getReadAt());
        verify(directMessageRepository, atLeastOnce()).save(dm);
        verify(notificationService, times(1)).markDMNotificationsAsRead(1L, 2L);
    }

    @Test
    void editMessage_Success() {
        when(directMessageRepository.findById(1L)).thenReturn(Optional.of(dm));
        when(directMessageRepository.save(any(DirectMessage.class))).thenReturn(dm);

        directMessageService.editMessage(1L, "New Content", sender);

        assertEquals("New Content", dm.getContent());
        assertNotNull(dm.getEditedAt());
    }

    @Test
    void deleteMessage_SelfScope_Success() {
        when(directMessageRepository.findById(1L)).thenReturn(Optional.of(dm));
        when(directMessageRepository.save(any(DirectMessage.class))).thenReturn(dm);

        directMessageService.deleteMessage(1L, "self", sender);

        assertNotNull(dm.getHiddenForUserIds());
        assertTrue(dm.getHiddenForUserIds().contains(sender.getId()));
    }

    @Test
    void pinMessage_Success() {
        when(directMessageRepository.findById(1L)).thenReturn(Optional.of(dm));
        when(directMessageRepository.save(any(DirectMessage.class))).thenReturn(dm);

        directMessageService.pinMessage(1L, sender);

        assertTrue(dm.isPinned());
        assertEquals(sender.getId(), dm.getPinnedByUserId());
    }

    @Test
    void reactToMessage_Success() {
        when(directMessageRepository.findById(1L)).thenReturn(Optional.of(dm));
        when(reactionRepository.findByDirectMessageIdAndUserIdAndEmoji(anyLong(), anyLong(), anyString()))
                .thenReturn(Optional.empty());

        directMessageService.reactToMessage(1L, "❤️", sender);

        verify(reactionRepository).save(any(Reaction.class));
        verify(notificationService).sendNotification(eq(recipient.getId()), eq("REACTION"), anyString(), eq(1L));
    }

    @Test
    void sendDirectMessage_WithMention_Success() {
        messageRequest.setContent("Hi @Recipient");
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));
        when(userRepository.findUsersSharingRoomWith(anyLong(), any())).thenReturn(Collections.singletonList(recipient));
        when(directMessageRepository.save(any(DirectMessage.class))).thenReturn(dm);

        directMessageService.sendDirectMessage(2L, messageRequest, sender);

        verify(notificationService).sendNotification(eq(2L), eq("MENTION"), anyString(), anyLong());
    }
}
