package com.bytechat.services;

import com.bytechat.entity.Reaction;

import java.util.List;

public interface ReactionService {
    Reaction addReaction(Long messageId, Long userId, String emoji);
    void removeReaction(Long messageId, Long userId, String emoji);
    List<Reaction> getReactionsForMessage(Long messageId);
}
