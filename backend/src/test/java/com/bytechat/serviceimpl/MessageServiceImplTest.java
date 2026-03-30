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
import org.springframework.data.domain.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MessageServiceImplTest {

    private MessageRepository messageRepository;
    private ChannelRepository channelRepository;
    private WorkspaceMemberRepository workspaceMemberRepository;
    private ChannelMemberRepository channelMemberRepository;
    private ReactionRepository reactionRepository;
    private NotificationService notificationService;
    private MessageReadRepository messageReadRepository;

    private SimpMessagingTemplate messagingTemplate;

    private MessageServiceImpl messageService;

    private User sender;
    private Channel channel;
    private Workspace workspace;
    private Message message;
    private MessageRequest messageRequest;

    @BeforeEach
    void setUp() {
        messageRepository = mock(MessageRepository.class);
        channelRepository = mock(ChannelRepository.class);
        workspaceMemberRepository = mock(WorkspaceMemberRepository.class);
        channelMemberRepository = mock(ChannelMemberRepository.class);
        reactionRepository = mock(ReactionRepository.class);
        notificationService = mock(NotificationService.class);
        messageReadRepository = mock(MessageReadRepository.class);

        messagingTemplate = null;

        messageService = new MessageServiceImpl(
                messageRepository,
                channelRepository,
                workspaceMemberRepository,
                channelMemberRepository,
                reactionRepository,
                notificationService,
                messageReadRepository,
                messagingTemplate
        );

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

        when(reactionRepository.findByMessageId(anyLong())).thenReturn(Collections.emptyList());
        when(messageReadRepository.findByMessageId(anyLong())).thenReturn(Collections.emptyList());
        when(channelMemberRepository.findByChannelId(anyLong())).thenReturn(Collections.emptyList());
    }

    // ================= SEND =================

    @Test
    void sendMessage_Success() {
        when(channelRepository.findById(1L)).thenReturn(Optional.of(channel));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(1L, 1L)).thenReturn(true);
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Collections.emptyList());
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        MessageResponse response = messageService.sendMessage(1L, messageRequest, sender);

        assertNotNull(response);
        assertEquals("Hello", response.getContent());
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

    // ================= EDIT =================

    @Test
    void editMessage_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(messageRepository.save(any(Message.class))).thenReturn(message);
        when(workspaceMemberRepository.findByWorkspaceId(anyLong())).thenReturn(Collections.emptyList());

        messageRequest.setContent("Updated");

        MessageResponse response = messageService.editMessage(1L, messageRequest, sender);

        assertNotNull(response);
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void editMessage_NotSender_ThrowsException() {
        User otherUser = User.builder().id(2L).build();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        assertThrows(UnauthorizedException.class,
                () -> messageService.editMessage(1L, messageRequest, otherUser));
    }

    // ================= DELETE =================

    @Test
    void deleteMessage_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.deleteMessage(1L, "all", sender);

        assertTrue(message.isDeleted());
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
}