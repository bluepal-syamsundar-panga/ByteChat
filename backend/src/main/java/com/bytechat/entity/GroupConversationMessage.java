package com.bytechat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "group_conversation_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupConversationMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_conversation_id", nullable = false)
    private GroupConversation groupConversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String type;

    private Long replyToMessageId;

    @Column(columnDefinition = "TEXT")
    private String replyToContent;

    private String replyToSenderName;

    @Builder.Default
    private boolean isDeleted = false;

    @Builder.Default
    private boolean isPinned = false;

    private Long pinnedByUserId;

    private String pinnedByName;

    private LocalDateTime editedAt;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @ElementCollection
    @CollectionTable(name = "group_conversation_message_hidden_users", joinColumns = @JoinColumn(name = "group_conversation_message_id"))
    @Column(name = "user_id")
    @Builder.Default
    private List<Long> hiddenForUserIds = new ArrayList<>();
}
