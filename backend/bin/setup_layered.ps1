$ErrorActionPreference = "Stop"
$path = "d:\ByteChat\backend\src\main\java\com\bytechat"

$files = @(
    "config\SecurityConfig.java", "config\JwtFilter.java", "config\JwtService.java", "config\WebSocketConfig.java", "config\CorsConfig.java",
    "controllers\AuthController.java", "controllers\UserController.java", "controllers\RoomController.java", "controllers\MessageController.java", "controllers\DirectMessageController.java", "controllers\ReactionController.java", "controllers\FileUploadController.java", "controllers\NotificationController.java", "controllers\ChatWebSocketController.java", "controllers\TypingController.java",
    "services\AuthService.java", "services\UserService.java", "services\RoomService.java", "services\MessageService.java", "services\DirectMessageService.java", "services\ReactionService.java", "services\FileStorageService.java", "services\NotificationService.java", "services\PresenceService.java",
    "serviceimpl\AuthServiceImpl.java", "serviceimpl\UserServiceImpl.java", "serviceimpl\RoomServiceImpl.java", "serviceimpl\MessageServiceImpl.java", "serviceimpl\DirectMessageServiceImpl.java", "serviceimpl\ReactionServiceImpl.java", "serviceimpl\FileStorageServiceImpl.java", "serviceimpl\NotificationServiceImpl.java", "serviceimpl\PresenceServiceImpl.java",
    "dto\request\AuthRequest.java", "dto\request\CreateRoomRequest.java", "dto\request\MessageRequest.java",
    "dto\response\AuthResponse.java", "dto\response\UserResponse.java", "dto\response\RoomResponse.java", "dto\response\MessageResponse.java", "dto\response\ApiResponse.java",
    "entity\User.java", "entity\Room.java", "entity\RoomMember.java", "entity\Message.java", "entity\DirectMessage.java", "entity\MessageReaction.java", "entity\Attachment.java", "entity\Notification.java",
    "repository\UserRepository.java", "repository\RoomRepository.java", "repository\RoomMemberRepository.java", "repository\MessageRepository.java", "repository\DirectMessageRepository.java", "repository\ReactionRepository.java", "repository\AttachmentRepository.java", "repository\NotificationRepository.java",
    "exception\GlobalExceptionHandler.java",
    "util\SecurityUtils.java",
    "ByteChatApplication.java"
)
foreach ($file in $files) {
    New-Item -ItemType File -Force -Path "$path\$file" | Out-Null
}
echo "Script finished"
