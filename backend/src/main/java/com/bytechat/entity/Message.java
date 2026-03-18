package com.bytechat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private Long replyToMessageId;

    @Column(columnDefinition = "TEXT")
    private String replyToContent;

    private String replyToSenderName;

    private String type; // TEXT, FILE, SYSTEM

    @Builder.Default
    private boolean isDeleted = false;
    
    @Builder.Default
    private boolean isPinned = false;

    private Long pinnedByUserId;

    private String pinnedByName;

    private LocalDateTime editedAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();
    
    @ElementCollection
    @CollectionTable(name = "message_mentions", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "user_id")
    private List<Long> mentionedUserIds;

    @ElementCollection
    @CollectionTable(name = "message_hidden_users", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "user_id")
    @Builder.Default
    private List<Long> hiddenForUserIds = new java.util.ArrayList<>();
}
