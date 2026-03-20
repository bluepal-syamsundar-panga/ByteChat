package com.bytechat.repository;

import com.bytechat.entity.GroupConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupConversationRepository extends JpaRepository<GroupConversation, Long> {
    @Query("SELECT gc FROM GroupConversation gc JOIN gc.members m WHERE m.user.id = :userId ORDER BY gc.createdAt DESC")
    List<GroupConversation> findAllForUser(@Param("userId") Long userId);
}
