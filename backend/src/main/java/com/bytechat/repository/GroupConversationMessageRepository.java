package com.bytechat.repository;

import com.bytechat.entity.GroupConversationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupConversationMessageRepository extends JpaRepository<GroupConversationMessage, Long> {
    Page<GroupConversationMessage> findByGroupConversationIdOrderBySentAtDesc(Long groupConversationId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM GroupConversationMessage m WHERE m.groupConversation.id = :groupId " +
            "AND m.sender.id <> :userId " +
            "AND NOT EXISTS (SELECT r FROM GroupConversationMessageRead r WHERE r.message.id = m.id AND r.user.id = :userId)")
    long countUnreadInGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Query("SELECT m FROM GroupConversationMessage m WHERE m.groupConversation.id = :groupId " +
            "AND m.sender.id <> :userId " +
            "AND NOT EXISTS (SELECT r FROM GroupConversationMessageRead r WHERE r.message.id = m.id AND r.user.id = :userId)")
    List<GroupConversationMessage> findUnreadMessagesInGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);
}
