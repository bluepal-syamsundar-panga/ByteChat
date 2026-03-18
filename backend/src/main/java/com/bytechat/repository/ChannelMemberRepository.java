package com.bytechat.repository;

import com.bytechat.entity.ChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Long> {
    Optional<ChannelMember> findByChannelIdAndUserId(Long channelId, Long userId);
    List<ChannelMember> findByChannelId(Long channelId);
    List<ChannelMember> findByUserId(Long userId);
    
    @Query("SELECT cm FROM ChannelMember cm WHERE cm.channel.workspace.id = :workspaceId AND cm.user.id = :userId")
    List<ChannelMember> findByWorkspaceIdAndUserId(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    boolean existsByChannelIdAndUserId(Long channelId, Long userId);

    void deleteByChannelIdAndUserId(Long channelId, Long userId);
}
