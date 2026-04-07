package com.bytechat.serviceimpl;

import com.bytechat.dto.request.MessageRequest;
import com.bytechat.dto.response.CursorPageResponse;
import com.bytechat.dto.response.MessageResponse;
import com.bytechat.entity.*;
import com.bytechat.exception.UnauthorizedException;
import com.bytechat.repository.*;
import com.bytechat.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @Mock
    private MessageRepository messageRepository;
    @Mock
    private ChannelRepository channelRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private ChannelMemberRepository channelMemberRepository;
    @Mock
    private ReactionRepository reactionRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private MessageReadRepository messageReadRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessageServiceImpl messageService;

    private User sender;
    private Channel channel;
    private Workspace workspace;
    private Message message;
    private MessageRequest messageRequest;

    @BeforeEach
    void setUp() {
        sender = User.builder().id(1L).email("sender@example.com").displayName("Sender").build();
        workspace = Workspace.builder().id(1L).name("Workspace").build();
        channel = Channel.builder().id(1L).name("channel").workspace(workspace).build();

        message = Message.builder()
                .id(1L)
                .channel(channel)
                .sender(sender)
                .content("Hello")
                .sentAt(LocalDateTime.now())
                .mentionedUserIds(Collections.emptyList())
                .build();

        messageRequest = new MessageRequest();
        messageRequest.setContent("Hello");

        lenient().when(reactionRepository.findByMessageId(anyLong())).thenReturn(Collections.emptyList());
        lenient().when(messageReadRepository.findByMessageId(anyLong())).thenReturn(Collections.emptyList());
        lenient().when(channelMemberRepository.findByChannelId(anyLong())).thenReturn(Collections.emptyList());
    }

    // ================= SEND =================

    @Test
    void sendMessage_Success() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Collections.emptyList());
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        MessageResponse response = messageService.sendMessage(1L, messageRequest, sender);

        assertNotNull(response);
        assertEquals("Hello", response.getContent());
    }

    @Test
    void sendMessage_ReplyToDeleted_Success() {
        messageRequest.setReplyToMessageId(2L);
        Message replyTarget = Message.builder().id(2L).sender(sender).content("Target").isDeleted(true).build();
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(messageRepository.findById(2L)).thenReturn(Optional.of(replyTarget));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Collections.emptyList());

        MessageResponse response = messageService.sendMessage(1L, messageRequest, sender);

        assertNotNull(response);
        assertEquals("This message was deleted.", response.getReplyToContent());
    }

    @Test
    void sendMessage_NotMember_ThrowsException() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(false);

        assertThrows(UnauthorizedException.class,
                () -> messageService.sendMessage(1L, messageRequest, sender));
    }

    // ================= GET =================

    @Test
    void getRoomMessages_Success() {
        Page<Message> page = new PageImpl<>(List.of(message));

        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(messageRepository.findByChannelIdOrderBySentAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(page);

        CursorPageResponse<MessageResponse> responses = messageService.getRoomMessages(1L, null, null, 10, sender);

        assertEquals(1, responses.getItems().size());
    }

    @Test
    void getRoomMessages_WithCursor_Success() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(messageRepository.findHistoryPage(anyLong(), any(), anyLong(), any())).thenReturn(List.of(message));

        CursorPageResponse<MessageResponse> responses = messageService.getRoomMessages(1L, LocalDateTime.now(), 1L, 10, sender);

        assertNotNull(responses);
        verify(messageRepository).findHistoryPage(anyLong(), any(), anyLong(), any());
    }

    @Test
    void getRoomMessages_HiddenMessages_Filtered() {
        message.setHiddenForUserIds(List.of(sender.getId()));
        Page<Message> page = new PageImpl<>(List.of(message));
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(messageRepository.findByChannelIdOrderBySentAtDesc(anyLong(), any())).thenReturn(page);

        CursorPageResponse<MessageResponse> responses = messageService.getRoomMessages(1L, null, null, 10, sender);

        assertEquals(0, responses.getItems().size());
    }

    // ================= EDIT =================

    @Test
    void editMessage_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Collections.emptyList());

        messageRequest.setContent("Updated");

        MessageResponse response = messageService.editMessage(1L, messageRequest, sender);

        assertNotNull(response);
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void getMessageResponse_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);

        MessageResponse response = messageService.getMessageResponse(1L, sender);

        assertNotNull(response);
    }

    // ================= DELETE =================

    @Test
    void deleteMessage_AllScope_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.deleteMessage(1L, "all", sender);

        assertTrue(message.isDeleted());
    }

    @Test
    void deleteMessage_SelfScope_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.deleteMessage(1L, "self", sender);

        assertNotNull(message.getHiddenForUserIds());
        assertTrue(message.getHiddenForUserIds().contains(sender.getId()));
    }

    // ================= PIN =================

    @Test
    void pinMessage_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.pinMessage(1L, sender);

        assertTrue(message.isPinned());
    }

    @Test
    void unpinMessage_Success() {
        message.setPinned(true);
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), anyLong())).thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.pinMessage(1L, sender);

        assertFalse(message.isPinned());
        assertNull(message.getPinnedByUserId());
    }

    // ================= REACTION =================

    @Test
    void reactToMessage_NewReaction_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(reactionRepository.findByMessageIdAndUserIdAndEmoji(1L, 1L, "👍"))
                .thenReturn(Optional.empty());

        messageService.reactToMessage(1L, "👍", sender);

        verify(reactionRepository).save(any(Reaction.class));
        verify(reactionRepository).flush();
    }

    @Test
    void reactToMessage_RemoveReaction_Success() {
        Reaction reaction = Reaction.builder()
                .id(1L)
                .message(message)
                .user(sender)
                .emoji("👍")
                .build();

        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(reactionRepository.findByMessageIdAndUserIdAndEmoji(1L, 1L, "👍"))
                .thenReturn(Optional.of(reaction));

        messageService.reactToMessage(1L, "👍", sender);

        verify(reactionRepository).delete(reaction);
        verify(reactionRepository).flush();
    }

    @Test
    void markAsRead_Success() {
        when(messageReadRepository.existsByMessageIdAndUserId(1L, 1L)).thenReturn(false);
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        messageService.markAsRead(1L, sender);

        verify(messageReadRepository).save(any(MessageRead.class));
    }

    @Test
    void markAsRead_AlreadyRead_Skips() {
        when(messageReadRepository.existsByMessageIdAndUserId(1L, 1L)).thenReturn(true);
        messageService.markAsRead(1L, sender);
        verify(messageReadRepository, never()).save(any());
    }

    @Test
    void markChannelAsRead_EmptyUnread_Skips() {
        when(messageRepository.findUnreadMessagesInChannel(1L, 1L)).thenReturn(Collections.emptyList());
        messageService.markChannelAsRead(1L, sender);
        verify(messageReadRepository, never()).saveAll(any());
    }

    @Test
    void sendMessage_WithReply_Success() {
        messageRequest.setReplyToMessageId(2L);
        Message replyTarget = Message.builder().id(2L).sender(sender).content("Target").build();
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(messageRepository.findById(2L)).thenReturn(Optional.of(replyTarget));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Collections.emptyList());

        MessageResponse response = messageService.sendMessage(1L, messageRequest, sender);

        assertNotNull(response);
    }

    @Test
    void sendMessage_WithMentions_Success() {
        messageRequest.setContent("Hello @User2");
        User user2 = User.builder().id(2L).displayName("User2").email("u2@ex.com").build();
        WorkspaceMember wsMember = WorkspaceMember.builder().user(user2).build();
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(workspaceMemberRepository.findByWorkspaceId(1L)).thenReturn(java.util.Arrays.asList(wsMember));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        messageService.sendMessage(1L, messageRequest, sender);

        verify(notificationService).sendNotification(eq(2L), eq("MENTION"), anyString(), any());
    }

    @Test
    void sendMessage_SelfMention_Ignored() {
        messageRequest.setContent("Hello @Sender"); // Sender display name is Sender
        WorkspaceMember wsMember = WorkspaceMember.builder().user(sender).build();
        
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(workspaceMemberRepository.findByWorkspaceId(1L)).thenReturn(java.util.Arrays.asList(wsMember));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        messageService.sendMessage(1L, messageRequest, sender);

        verify(notificationService, never()).sendNotification(anyLong(), eq("MENTION"), anyString(), anyLong());
    }

    @Test
    void editMessage_NotSender_ThrowsException() {
        User outsider = User.builder().id(99L).build();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThrows(UnauthorizedException.class, () -> messageService.editMessage(1L, messageRequest, outsider));
    }

    @Test
    void deleteMessage_NotSender_ThrowsException() {
        User outsider = User.builder().id(99L).build();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThrows(UnauthorizedException.class, () -> messageService.deleteMessage(1L, "all", outsider));
    }

    @Test
    void pinMessage_NotMember_ThrowsException() {
        User outsider = User.builder().id(99L).build();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(anyLong(), eq(99L))).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> messageService.pinMessage(1L, outsider));
    }
}