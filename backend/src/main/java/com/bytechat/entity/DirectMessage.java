package com.bytechat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "direct_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private Long replyToMessageId;

    @Column(columnDefinition = "TEXT")
    private String replyToContent;

    private String replyToSenderName;

    private LocalDateTime readAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();
    
    // Optional
    private String type;
    @Builder.Default
    private boolean isDeleted = false;
    @Builder.Default
    private boolean isPinned = false;

    private Long pinnedByUserId;

    private String pinnedByName;
    private LocalDateTime editedAt;

    @ElementCollection
    @CollectionTable(name = "direct_message_hidden_users", joinColumns = @JoinColumn(name = "direct_message_id"))
    @Column(name = "user_id")
    @Builder.Default
    private List<Long> hiddenForUserIds = new ArrayList<>();
}
