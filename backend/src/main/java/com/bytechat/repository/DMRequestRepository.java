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
    Optional<DMRequest> findBySenderAndReceiver(User sender, User receiver);
    boolean existsBySenderAndReceiverAndStatus(User sender, User receiver, DMRequestStatus status);
}
