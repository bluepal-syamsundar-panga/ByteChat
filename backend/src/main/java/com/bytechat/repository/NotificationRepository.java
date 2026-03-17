package com.bytechat.repository;

import com.bytechat.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipientIdAndIsReadFalse(Long recipientId);
    List<Notification> findByRecipientIdAndTypeAndRelatedEntityIdAndIsReadFalse(Long recipientId, String type, Long relatedEntityId);
    
    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND n.type = 'MENTION' AND n.isRead = false " +
           "AND n.relatedEntityId IN (SELECT m.id FROM Message m WHERE m.channel.workspace.id = :workspaceId)")
    List<Notification> findUnreadMentionsByWorkspace(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND n.type = 'MENTION' AND n.isRead = false " +
           "AND n.relatedEntityId IN (SELECT m.id FROM Message m WHERE m.channel.id = :channelId)")
    List<Notification> findUnreadMentionsByChannel(@Param("userId") Long userId, @Param("channelId") Long channelId);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND n.type = 'DIRECT_MESSAGE' AND n.isRead = false " +
           "AND n.relatedEntityId IN (SELECT dm.id FROM DirectMessage dm WHERE dm.fromUser.id = :senderId)")
    List<Notification> findUnreadDMsBySender(@Param("userId") Long userId, @Param("senderId") Long senderId);
}
