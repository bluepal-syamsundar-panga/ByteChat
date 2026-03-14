package com.bytechat.repository;

import com.bytechat.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    List<RoomMember> findByRoomId(Long roomId);
}
