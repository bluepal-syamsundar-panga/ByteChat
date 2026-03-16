package com.bytechat.serviceimpl;

import com.bytechat.entity.DMRequest;
import com.bytechat.entity.DMRequestStatus;
import com.bytechat.entity.User;
import com.bytechat.entity.Workspace;
import com.bytechat.repository.DMRequestRepository;
import com.bytechat.repository.UserRepository;
import com.bytechat.repository.WorkspaceRepository;
import com.bytechat.services.DMRequestService;
import com.bytechat.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DMRequestServiceImpl implements DMRequestService {

    private final DMRequestRepository dmRequestRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public DMRequest sendRequest(Long workspaceId, User sender, Long receiverId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (sender.getId().equals(receiverId)) {
            log.warn("User {} tried to send DM request to themselves", sender.getId());
            throw new IllegalArgumentException("Cannot send DM request to yourself");
        }

        // Check for existing request in this workspace
        dmRequestRepository.findByWorkspaceIdAndSenderIdAndReceiverId(workspaceId, sender.getId(), receiverId).ifPresent(req -> {
            if (req.getStatus() == DMRequestStatus.PENDING) {
                log.warn("User {} tried to send duplicate DM request to {} in workspace {}", sender.getId(), receiverId, workspaceId);
                throw new IllegalArgumentException("Request already pending in this workspace");
            }
        });

        DMRequest request = DMRequest.builder()
                .workspace(workspace)
                .sender(sender)
                .receiver(receiver)
                .status(DMRequestStatus.PENDING)
                .build();

        DMRequest saved = dmRequestRepository.save(request);

        notificationService.sendNotification(
                receiverId,
                "DM_INVITE",
                sender.getDisplayName() + " sent you a direct message invitation",
                saved.getId()
        );

        return saved;
    }

    @Override
    @Transactional
    public DMRequest acceptRequest(User receiver, Long requestId) {
        DMRequest request = dmRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Not your request to accept");
        }

        request.setStatus(DMRequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        DMRequest saved = dmRequestRepository.save(request);

        notificationService.sendNotification(
                request.getSender().getId(),
                "DM_INVITE_ACCEPTED",
                receiver.getDisplayName() + " accepted your direct message invitation",
                saved.getId()
        );

        return saved;
    }

    @Override
    @Transactional
    public void rejectRequest(User receiver, Long requestId) {
        DMRequest request = dmRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Not your request to reject");
        }

        request.setStatus(DMRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        dmRequestRepository.save(request);
    }

    @Override
    public List<DMRequest> getPendingRequests(User user) {
        return dmRequestRepository.findByReceiverAndStatus(user, DMRequestStatus.PENDING);
    }
}
