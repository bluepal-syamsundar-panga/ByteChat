package com.bytechat.repository;

import com.bytechat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u WHERE u.id != :userId AND (" +
           "u.id IN (SELECT m.user.id FROM RoomMember m WHERE m.room.id IN " +
           "(SELECT rm.room.id FROM RoomMember rm WHERE rm.user.id = :userId)) " +
           "OR u.id IN (SELECT dmr.sender.id FROM DMRequest dmr WHERE dmr.receiver.id = :userId AND dmr.status = com.bytechat.entity.DMRequestStatus.ACCEPTED) " +
           "OR u.id IN (SELECT dmr.receiver.id FROM DMRequest dmr WHERE dmr.sender.id = :userId AND dmr.status = com.bytechat.entity.DMRequestStatus.ACCEPTED))")
    List<User> findUsersSharingRoomWith(@Param("userId") Long userId);
}
