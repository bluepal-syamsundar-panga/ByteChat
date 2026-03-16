import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import AppRail from '../components/Sidebar/AppRail';
import Modal from '../components/Shared/Modal';
import NotificationPanel from '../components/Common/NotificationPanel';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import chatService from '../services/chatService';
import notificationService from '../services/notificationService';
import userService from '../services/userService';
import { connectWebSocket, disconnectWebSocket, subscribeToNotifications } from '../services/websocket';

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const {
    setRooms,
    setUsers,
    setOnlineUsers,
    setNotifications,
  } = useChatStore();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    connectWebSocket((stompClient) => {
      subscribeToNotifications(user.id, (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
    });
    loadWorkspace();
    return () => disconnectWebSocket();
  }, [user?.id]);

  async function loadWorkspace() {
    try {
      const [roomsRes, usersRes, onlineRes, meRes, notificationsRes] = await Promise.allSettled([
        chatService.getRooms(),
        userService.getUsers(),
        userService.getOnlineUsers(),
        userService.getCurrentUser(),
        notificationService.getNotifications(),
      ]);

      if (roomsRes.status === 'fulfilled') {
        // Updated to match ApiResponse structure: res.data.data.content
        setRooms(roomsRes.value.data?.content ?? roomsRes.value.data ?? []);
      } else {
        console.error('Failed to load rooms:', roomsRes.reason?.response?.data || roomsRes.reason);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data ?? []);
      } else {
        console.error('Failed to load users:', usersRes.reason?.response?.data || usersRes.reason);
      }

      if (onlineRes.status === 'fulfilled') {
        setOnlineUsers(onlineRes.value.data ?? []);
      } else {
        console.error('Failed to load online users:', onlineRes.reason?.response?.data || onlineRes.reason);
      }

      if (meRes.status === 'fulfilled') {
        updateUser(meRes.value.data);
      } else {
        console.error('Failed to load current user profile:', meRes.reason?.response?.data || meRes.reason);
      }

      if (notificationsRes.status === 'fulfilled') {
        setNotifications(notificationsRes.value.data ?? []);
      } else {
        console.error('Failed to load notifications:', notificationsRes.reason?.response?.data || notificationsRes.reason);
      }
    } catch (error) {
      console.error('Failed to load workspace', error);
    }
  }

  async function handleCreateRoomSubmit(e) {
    if (e) e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setIsCreatingRoom(true);
      const response = await chatService.createRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || `Welcome to ${newRoomName.trim()}`,
        isPrivate: false,
      });
      const room = response.data;
      await loadWorkspace();
      setShowCreateRoomModal(false);
      setNewRoomName('');
      setNewRoomDescription('');
      navigate(`/chat/room/${room.id}`);
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Unable to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function handleAcceptInvite(notificationId) {
    try {
      await notificationService.accept(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      await loadWorkspace();
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Unable to accept invite');
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-[#1d1c1d]">
      <AppRail onCreateRoom={() => setShowCreateRoomModal(true)} />

      <Sidebar onAcceptInvite={handleAcceptInvite} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ... existing header ... */}
        <div className="glass-panel flex h-16 items-center justify-between border-b border-black/5 px-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b6a6b]">
              ByteChat
            </div>
            <div className="text-lg font-semibold">Real-Time Slack Clone Workspace</div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 border border-black/5 bg-white/50 px-4 py-1.5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center bg-[#3f0e40] text-xs font-bold text-white overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() ?? 'U'
                  )}
                </div>
                <div className="hidden flex-col md:flex">
                  <div className="text-sm font-bold text-[#1d1c1d]">{user.displayName}</div>
                  <div className="text-[10px] uppercase font-bold tracking-tight text-[#6b6a6b]">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>

      <Modal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        title="Create a New Room"
      >
        <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6a6b]">Room Name</label>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="mt-1 w-full border border-black/10 bg-[#f8f8f8] px-4 py-2 text-sm focus:border-[#3f0e40] focus:ring-1 focus:ring-[#3f0e40] outline-none"
              placeholder="e.g. general"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6a6b]">Description (optional)</label>
            <input
              type="text"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              className="mt-1 w-full border border-black/10 bg-[#f8f8f8] px-4 py-2 text-sm focus:border-[#3f0e40] focus:ring-1 focus:ring-[#3f0e40] outline-none"
              placeholder="What is this room about?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateRoomModal(false)}
              className="px-4 py-2 text-sm font-semibold text-[#6b6a6b] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingRoom || !newRoomName.trim()}
              className="bg-[#3f0e40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#350d36] disabled:opacity-50"
            >
              {isCreatingRoom ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function AvatarLabel({ user }) {
  const initial = user?.displayName?.[0]?.toUpperCase() ?? 'B';
  return (
    <>
      <div className="relative flex h-10 w-10 items-center justify-center bg-[#611f69] font-bold text-white border border-white/20 overflow-hidden">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
        <span className="absolute bottom-0 right-0 h-3 w-3 border-2 border-white bg-[#2bac76]" />
      </div>
      <div className="hidden text-left sm:block">
        <div className="text-sm font-semibold">{user?.displayName ?? 'Workspace user'}</div>
        <div className="text-xs text-[#6b6a6b]">{user?.role ?? 'MEMBER'}</div>
      </div>
    </>
  );
}

export default MainLayout;
