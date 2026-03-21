package com.bytechat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorPageResponse<T> {
    private List<T> items;
    private LocalDateTime nextCursorSentAt;
    private Long nextCursorId;
    private boolean hasMore;
}
