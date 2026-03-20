package com.bytechat.repository;

import com.bytechat.entity.GroupConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupConversationMemberRepository extends JpaRepository<GroupConversationMember, Long> {
    boolean existsByGroupConversationIdAndUserId(Long groupConversationId, Long userId);
    List<GroupConversationMember> findByGroupConversationId(Long groupConversationId);
    Optional<GroupConversationMember> findByGroupConversationIdAndUserId(Long groupConversationId, Long userId);
}
