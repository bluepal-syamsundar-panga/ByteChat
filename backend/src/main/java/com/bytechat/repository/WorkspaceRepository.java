package com.bytechat.repository;

import com.bytechat.entity.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    
    @Query("SELECT w FROM Workspace w JOIN w.members m WHERE m.user.id = :userId")
    Page<Workspace> findJoinedWorkspaces(@Param("userId") Long userId, Pageable pageable);
    
    Optional<Workspace> findByName(String name);
    
    boolean existsByName(String name);
}
