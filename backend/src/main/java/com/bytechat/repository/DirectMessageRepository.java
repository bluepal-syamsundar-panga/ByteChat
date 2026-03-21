package com.bytechat.repository;

import com.bytechat.entity.DirectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    
    @Query("SELECT d FROM DirectMessage d WHERE (d.fromUser.id = :user1 AND d.toUser.id = :user2) OR (d.fromUser.id = :user2 AND d.toUser.id = :user1) ORDER BY d.sentAt DESC")
    Page<DirectMessage> findConversation(@Param("user1") Long user1, @Param("user2") Long user2, Pageable pageable);

    @Query("""
           SELECT d FROM DirectMessage d
           WHERE ((d.fromUser.id = :user1 AND d.toUser.id = :user2) OR (d.fromUser.id = :user2 AND d.toUser.id = :user1))
             AND (
               d.sentAt < :cursorSentAt OR
               (d.sentAt = :cursorSentAt AND d.id < :cursorId)
             )
           ORDER BY d.sentAt DESC, d.id DESC
           """)
    List<DirectMessage> findConversationHistory(
            @Param("user1") Long user1,
            @Param("user2") Long user2,
            @Param("cursorSentAt") LocalDateTime cursorSentAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
    
    @Query("SELECT COUNT(d) FROM DirectMessage d WHERE d.toUser.id = :userId AND d.readAt IS NULL")
    long countUnreadMessages(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM DirectMessage d WHERE d.toUser.id = :userId AND d.fromUser.id = :senderId AND d.readAt IS NULL")
    long countUnreadBySender(@Param("userId") Long userId, @Param("senderId") Long senderId);
}
