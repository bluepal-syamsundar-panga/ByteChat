package com.bytechat.repository;

import com.bytechat.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByMessageId(Long messageId);
    Optional<Reaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    List<Reaction> findByDirectMessageId(Long dmId);
    Optional<Reaction> findByDirectMessageIdAndUserIdAndEmoji(Long dmId, Long userId, String emoji);
}
