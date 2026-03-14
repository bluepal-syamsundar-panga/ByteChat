$ErrorActionPreference = "Stop"
$baseDir = "d:\ByteChat"

# Backend
$backendSrc = "$baseDir\backend\src\main\java\com\syamslack"
$backendDirs = @(
    "config",
    "auth",
    "user\controller", "user\service", "user\repository", "user\entity", "user\dto",
    "room\controller", "room\service", "room\repository", "room\entity", "room\dto",
    "message\controller", "message\service", "message\repository", "message\entity", "message\dto",
    "dm\controller", "dm\service", "dm\repository", "dm\entity",
    "reaction\controller", "reaction\service", "reaction\repository", "reaction\entity",
    "attachment\controller", "attachment\service", "attachment\entity", "attachment\repository",
    "notification\controller", "notification\service", "notification\repository", "notification\entity",
    "websocket",
    "common\exception", "common\response", "common\util"
)
foreach ($dir in $backendDirs) { New-Item -ItemType Directory -Force -Path "$backendSrc\$dir" | Out-Null }

$backendFiles = @(
    "config\SecurityConfig.java", "config\JwtFilter.java", "config\JwtService.java", "config\WebSocketConfig.java", "config\CorsConfig.java",
    "auth\AuthController.java", "auth\AuthService.java", "auth\AuthRequest.java", "auth\AuthResponse.java",
    "user\controller\UserController.java", "user\service\UserService.java", "user\repository\UserRepository.java", "user\entity\User.java", "user\dto\UserResponse.java",
    "room\controller\RoomController.java", "room\service\RoomService.java", "room\repository\RoomRepository.java", "room\repository\RoomMemberRepository.java", "room\entity\Room.java", "room\entity\RoomMember.java", "room\dto\CreateRoomRequest.java", "room\dto\RoomResponse.java",
    "message\controller\MessageController.java", "message\service\MessageService.java", "message\repository\MessageRepository.java", "message\entity\Message.java", "message\dto\MessageRequest.java", "message\dto\MessageResponse.java",
    "dm\controller\DirectMessageController.java", "dm\service\DirectMessageService.java", "dm\repository\DirectMessageRepository.java", "dm\entity\DirectMessage.java",
    "reaction\controller\ReactionController.java", "reaction\service\ReactionService.java", "reaction\repository\ReactionRepository.java", "reaction\entity\MessageReaction.java",
    "attachment\controller\FileUploadController.java", "attachment\service\FileStorageService.java", "attachment\entity\Attachment.java", "attachment\repository\AttachmentRepository.java",
    "notification\controller\NotificationController.java", "notification\service\NotificationService.java", "notification\repository\NotificationRepository.java", "notification\entity\Notification.java",
    "websocket\ChatWebSocketController.java", "websocket\PresenceService.java", "websocket\TypingController.java",
    "common\exception\GlobalExceptionHandler.java", "common\response\ApiResponse.java", "common\util\SecurityUtils.java",
    "SyamSlackApplication.java"
)
foreach ($file in $backendFiles) { New-Item -ItemType File -Force -Path "$backendSrc\$file" | Out-Null }

# Frontend
$frontendSrc = "$baseDir\frontend\src"
$frontendDirs = @(
    "assets",
    "components\Sidebar", "components\Chat", "components\Common",
    "pages",
    "services",
    "store",
    "hooks",
    "layouts",
    "routes",
    "utils"
)
foreach ($dir in $frontendDirs) { New-Item -ItemType Directory -Force -Path "$frontendSrc\$dir" | Out-Null }

$frontendFiles = @(
    "assets\logo.svg",
    "components\Sidebar\Sidebar.jsx", "components\Sidebar\ChannelItem.jsx",
    "components\Chat\ChatWindow.jsx", "components\Chat\MessageBubble.jsx", "components\Chat\MessageInput.jsx", "components\Chat\TypingIndicator.jsx",
    "components\Common\Avatar.jsx", "components\Common\Loader.jsx",
    "pages\LoginPage.jsx", "pages\RegisterPage.jsx", "pages\ChatPage.jsx", "pages\ProfilePage.jsx",
    "services\api.js", "services\authService.js", "services\chatService.js", "services\websocket.js",
    "store\authStore.js", "store\chatStore.js",
    "hooks\useAuth.js", "hooks\useChat.js", "hooks\usePresence.js",
    "layouts\MainLayout.jsx",
    "routes\AppRouter.jsx",
    "utils\formatDate.js",
    "App.jsx", "main.jsx", "index.css"
)
foreach ($file in $frontendFiles) { New-Item -ItemType File -Force -Path "$frontendSrc\$file" | Out-Null }
echo "Complete!"
