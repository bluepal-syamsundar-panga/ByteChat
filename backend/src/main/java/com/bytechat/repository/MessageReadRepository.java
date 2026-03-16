package com.bytechat.repository;

import com.bytechat.entity.MessageRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageReadRepository extends JpaRepository<MessageRead, Long> {
    List<MessageRead> findByMessageId(Long messageId);
    boolean existsByMessageIdAndUserId(Long messageId, Long userId);
}
