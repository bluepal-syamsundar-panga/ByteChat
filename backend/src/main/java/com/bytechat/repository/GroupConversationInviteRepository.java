package com.bytechat.repository;

import com.bytechat.entity.GroupConversationInvite;
import com.bytechat.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupConversationInviteRepository extends JpaRepository<GroupConversationInvite, Long> {
    List<GroupConversationInvite> findByInviteeIdAndStatus(Long inviteeId, InvitationStatus status);
    Optional<GroupConversationInvite> findByGroupConversationIdAndInviteeId(Long groupConversationId, Long inviteeId);
    boolean existsByGroupConversationIdAndInviteeIdAndStatus(Long groupConversationId, Long inviteeId, InvitationStatus status);
}
