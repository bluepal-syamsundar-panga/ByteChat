package com.bytechat.repository;

import com.bytechat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByChannelIdOrderBySentAtDesc(Long channelId, Pageable pageable);

    @Query("""
           SELECT m FROM Message m
           WHERE m.channel.id = :channelId
             AND (
               m.sentAt < :cursorSentAt OR
               (m.sentAt = :cursorSentAt AND m.id < :cursorId)
             )
           ORDER BY m.sentAt DESC, m.id DESC
           """)
    List<Message> findHistoryPage(
            @org.springframework.data.repository.query.Param("channelId") Long channelId,
            @org.springframework.data.repository.query.Param("cursorSentAt") LocalDateTime cursorSentAt,
            @org.springframework.data.repository.query.Param("cursorId") Long cursorId,
            Pageable pageable
    );

    @Query("SELECT COUNT(m) FROM Message m WHERE m.channel.id = :channelId " +
           "AND m.sender.id <> :userId " +
           "AND NOT EXISTS (SELECT mr FROM MessageRead mr WHERE mr.message.id = m.id AND mr.user.id = :userId)")
    long countUnreadInChannel(@org.springframework.data.repository.query.Param("channelId") Long channelId, 
                              @org.springframework.data.repository.query.Param("userId") Long userId);

    @Query("SELECT m FROM Message m WHERE m.channel.id = :channelId " +
           "AND m.sender.id <> :userId " +
           "AND NOT EXISTS (SELECT mr FROM MessageRead mr WHERE mr.message.id = m.id AND mr.user.id = :userId)")
    List<Message> findUnreadMessagesInChannel(@org.springframework.data.repository.query.Param("channelId") Long channelId, 
                                             @org.springframework.data.repository.query.Param("userId") Long userId);
}
