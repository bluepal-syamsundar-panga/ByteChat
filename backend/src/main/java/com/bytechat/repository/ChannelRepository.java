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

       @Query("SELECT DISTINCT c FROM Channel c LEFT JOIN c.memberships cm ON cm.user.id = :userId " +
                     "WHERE c.workspace.id = :workspaceId AND c.isDeleted = false AND c.isArchived = false " +
                     "AND (c.isPrivate = false OR cm IS NOT NULL) " +
                     "AND (cm IS NULL OR cm.isArchived = false)")
       List<Channel> findVisibleChannels(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

       @Query("SELECT DISTINCT c FROM Channel c LEFT JOIN c.memberships cm ON cm.user.id = :userId " +
                     "WHERE c.workspace.id = :workspaceId AND c.isDeleted = false " +
                     "AND (c.isArchived = true OR cm.isArchived = true) " +
                     "AND (c.isPrivate = false OR cm IS NOT NULL)")
       List<Channel> findArchivedChannels(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

       @Query("SELECT DISTINCT c FROM Channel c LEFT JOIN c.memberships cm ON cm.user.id = :userId " +
                     "WHERE c.workspace.id = :workspaceId AND c.isDeleted = true " +
                     "AND (c.isPrivate = false OR cm IS NOT NULL)")
       List<Channel> findDeletedChannels(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
}
