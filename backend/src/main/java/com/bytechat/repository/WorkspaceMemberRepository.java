package com.bytechat.repository;

import com.bytechat.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    
    List<WorkspaceMember> findByWorkspaceId(Long workspaceId);
    
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    
    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);
}
