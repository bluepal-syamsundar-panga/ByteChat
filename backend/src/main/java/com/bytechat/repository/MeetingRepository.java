package com.bytechat.repository;

import com.bytechat.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByWorkspaceIdAndIsActiveTrueOrderByCreatedAtDesc(Long workspaceId);
    List<Meeting> findByChannelIdAndIsActiveTrueOrderByCreatedAtDesc(Long channelId);
    Optional<Meeting> findFirstByChannelIdAndIsActiveTrueOrderByCreatedAtDesc(Long channelId);
}
