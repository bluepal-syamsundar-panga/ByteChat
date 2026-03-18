package com.bytechat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "channels")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Channel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Builder.Default
    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isPrivate")
    private boolean isPrivate = false;

    @Builder.Default
    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isDefault")
    private boolean isDefault = false;

    @Builder.Default
    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isDeleted")
    private boolean isDeleted = false;

    @Builder.Default
    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isArchived")
    private boolean isArchived = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "channel", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<ChannelMember> memberships = new HashSet<>();
}
