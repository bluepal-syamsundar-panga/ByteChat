package com.bytechat.repository;

import com.bytechat.entity.GroupConversationMessageRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupConversationMessageReadRepository extends JpaRepository<GroupConversationMessageRead, Long> {
    boolean existsByMessageIdAndUserId(Long messageId, Long userId);
    List<GroupConversationMessageRead> findByMessageId(Long messageId);
}
