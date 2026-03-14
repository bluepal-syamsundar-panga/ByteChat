package com.bytechat.repository;

import com.bytechat.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Page<Room> findByIsPrivateFalseAndIsArchivedFalse(Pageable pageable);

    @Query("select rm.room from RoomMember rm where rm.user.id = :userId and rm.room.isArchived = false")
    Page<Room> findJoinedRooms(@Param("userId") Long userId, Pageable pageable);
}
