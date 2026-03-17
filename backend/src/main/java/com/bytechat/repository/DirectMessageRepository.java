package com.bytechat.repository;

import com.bytechat.entity.DirectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    
    @Query("SELECT d FROM DirectMessage d WHERE (d.fromUser.id = :user1 AND d.toUser.id = :user2) OR (d.fromUser.id = :user2 AND d.toUser.id = :user1) ORDER BY d.sentAt DESC")
    Page<DirectMessage> findConversation(@Param("user1") Long user1, @Param("user2") Long user2, Pageable pageable);
    
    @Query("SELECT COUNT(d) FROM DirectMessage d WHERE d.toUser.id = :userId AND d.readAt IS NULL")
    long countUnreadMessages(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM DirectMessage d WHERE d.toUser.id = :userId AND d.fromUser.id = :senderId AND d.readAt IS NULL")
    long countUnreadBySender(@Param("userId") Long userId, @Param("senderId") Long senderId);
}
