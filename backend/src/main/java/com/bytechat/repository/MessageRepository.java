package com.bytechat.repository;

import com.bytechat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByChannelIdOrderBySentAtDesc(Long channelId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.channel.id = :channelId " +
           "AND NOT EXISTS (SELECT mr FROM MessageRead mr WHERE mr.message.id = m.id AND mr.user.id = :userId)")
    long countUnreadInChannel(@org.springframework.data.repository.query.Param("channelId") Long channelId, 
                              @org.springframework.data.repository.query.Param("userId") Long userId);
}
