package com.bytechat.serviceimpl;

import com.bytechat.entity.Message;
import com.bytechat.entity.Reaction;
import com.bytechat.entity.User;
import com.bytechat.repository.MessageRepository;
import com.bytechat.repository.ReactionRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.services.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    public Reaction addReaction(Long messageId, Long userId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Reaction> existingReaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji);
        if (existingReaction.isPresent()) {
            return existingReaction.get(); // Prevent duplicate identical reactions from same user
        }

        Reaction reaction = Reaction.builder()
                .message(message)
                .user(user)
                .emoji(emoji)
                .build();

        return reactionRepository.save(reaction);
    }

    @Override
    public void removeReaction(Long messageId, Long userId, String emoji) {
        reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji)
                .ifPresent(reactionRepository::delete);
    }

    @Override
    public List<Reaction> getReactionsForMessage(Long messageId) {
        return reactionRepository.findByMessageId(messageId);
    }
}
