package com.bytechat.repository;

import com.bytechat.entity.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {
       List<Channel> findByWorkspaceId(Long workspaceId);

       @Query("SELECT DISTINCT c FROM Channel c JOIN c.memberships cm " +
                     "WHERE c.workspace.id = :workspaceId AND cm.user.id = :userId " +
                     "AND c.isDeleted = false AND c.isArchived = false AND cm.isArchived = false")
       List<Channel> findVisibleChannels(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

       @Query("SELECT DISTINCT c FROM Channel c JOIN c.memberships cm " +
                     "WHERE c.workspace.id = :workspaceId AND cm.user.id = :userId AND c.isDeleted = false " +
                     "AND (c.isArchived = true OR cm.isArchived = true)")
       List<Channel> findArchivedChannels(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

       @Query("SELECT DISTINCT c FROM Channel c JOIN c.memberships cm " +
                     "WHERE c.workspace.id = :workspaceId AND cm.user.id = :userId AND c.isDeleted = true")
       List<Channel> findDeletedChannels(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
}
