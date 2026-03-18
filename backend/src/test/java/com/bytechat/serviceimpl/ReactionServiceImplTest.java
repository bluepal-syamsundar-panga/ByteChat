package com.bytechat.serviceimpl;

import com.bytechat.entity.Message;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.UserRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReactionServiceImplTest {

    @Mock
    private ReactionRepository reactionRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReactionServiceImpl reactionService;

    private User user;
    private Message message;
    private Reaction reaction;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).build();
        message = Message.builder().id(1L).build();
        reaction = Reaction.builder().id(1L).message(message).user(user).emoji("👍").build();
    }

    @Test
    void addReaction_New_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(reactionRepository.findByMessageIdAndUserIdAndEmoji(1L, 1L, "👍")).thenReturn(Optional.empty());
        when(reactionRepository.save(any(Reaction.class))).thenReturn(reaction);

        Reaction result = reactionService.addReaction(1L, 1L, "👍");

        assertNotNull(result);
        verify(reactionRepository, times(1)).save(any(Reaction.class));
    }

    @Test
    void addReaction_ToggleOff_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(reactionRepository.findByMessageIdAndUserIdAndEmoji(1L, 1L, "👍")).thenReturn(Optional.of(reaction));

        Reaction result = reactionService.addReaction(1L, 1L, "👍");

        assertNull(result);
        verify(reactionRepository, times(1)).delete(reaction);
    }

    @Test
    void removeReaction_Success() {
        when(reactionRepository.findByMessageIdAndUserIdAndEmoji(1L, 1L, "👍")).thenReturn(Optional.of(reaction));

        reactionService.removeReaction(1L, 1L, "👍");

        verify(reactionRepository, times(1)).delete(reaction);
    }

    @Test
    void getReactionsForMessage_ReturnsList() {
        when(reactionRepository.findByMessageId(1L)).thenReturn(Collections.singletonList(reaction));

        List<Reaction> results = reactionService.getReactionsForMessage(1L);

        assertEquals(1, results.size());
    }
}
