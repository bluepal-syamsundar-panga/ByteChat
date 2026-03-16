package com.bytechat.repository;

import com.bytechat.entity.DMRequest;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DMRequestRepository extends JpaRepository<DMRequest, Long> {
    List<DMRequest> findByReceiverAndStatus(User receiver, DMRequestStatus status);
    List<DMRequest> findBySenderAndStatus(User sender, DMRequestStatus status);
    Optional<DMRequest> findByWorkspaceIdAndSenderIdAndReceiverId(Long workspaceId, Long senderId, Long receiverId);
    boolean existsByWorkspaceIdAndSenderIdAndReceiverIdAndStatus(Long workspaceId, Long senderId, Long receiverId, DMRequestStatus status);
    boolean existsBySenderAndReceiverAndStatus(User sender, User receiver, DMRequestStatus status);
    
    // Legacy support or fallback
    List<DMRequest> findByWorkspaceIdAndReceiverAndStatus(Long workspaceId, User receiver, DMRequestStatus status);
}
