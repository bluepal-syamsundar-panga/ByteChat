import { Bell, Plus, Search, Settings } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import chatService from '../services/chatService';
import notificationService from '../services/notificationService';
import userService from '../services/userService';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

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

  useEffect(() => {
    connectWebSocket();
    loadWorkspace();
    return () => disconnectWebSocket();
  }, []);

  async function loadWorkspace() {
    try {
      const [roomsRes, usersRes, onlineRes, meRes, notificationsRes] = await Promise.all([
        chatService.getRooms(),
        userService.getUsers(),
        userService.getOnlineUsers(),
        userService.getCurrentUser(),
        notificationService.getNotifications(),
      ]);
      setRooms(roomsRes.data.content ?? []);
      setUsers(usersRes.data ?? []);
      setOnlineUsers(onlineRes.data ?? []);
      setNotifications(notificationsRes.data ?? []);
      updateUser(meRes.data);
    } catch (error) {
      console.error('Failed to load workspace', error);
    }
  }

  async function handleCreateRoom() {
    const name = window.prompt('Room name');
    if (!name?.trim()) {
      return;
    }

    try {
      setIsCreatingRoom(true);
      const response = await chatService.createRoom({
        name: name.trim(),
        description: `Welcome to ${name.trim()}`,
        isPrivate: false,
      });
      const room = response.data;
      await loadWorkspace();
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
      await loadWorkspace();
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Unable to accept invite');
    }
  }

  return (
    <div className="flex min-h-screen bg-transparent text-[#1d1c1d]">
      <div className="hidden w-[72px] shrink-0 flex-col items-center bg-[#2b0a2d] py-5 text-white lg:flex">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-lg font-bold">
          B
        </div>
        <button
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 transition hover:bg-white/20 disabled:opacity-60"
          title="Create room"
        >
          <Plus size={18} />
        </button>
        <button className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 transition hover:bg-white/16">
          <Bell size={18} />
        </button>
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 transition hover:bg-white/16">
          <Settings size={18} />
        </button>
      </div>

      <Sidebar onCreateRoom={handleCreateRoom} onAcceptInvite={handleAcceptInvite} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="glass-panel flex h-16 items-center justify-between border-b border-black/5 px-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b6a6b]">
              ByteChat
            </div>
            <div className="text-lg font-semibold">Real-Time Slack Clone Workspace</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm md:flex">
              <Search size={16} className="text-[#6b6a6b]" />
              <span className="text-sm text-[#6b6a6b]">Search messages, rooms, and people</span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
            >
              <AvatarLabel user={user} />
            </button>
            <button
              onClick={logout}
              className="rounded-full bg-[#3f0e40] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#350d36]"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-3 md:p-4">
          <div className="glass-panel h-full overflow-hidden rounded-[28px] border border-white/70 shadow-[0_18px_60px_rgba(63,14,64,0.12)]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

function AvatarLabel({ user }) {
  const initial = user?.displayName?.[0]?.toUpperCase() ?? 'B';
  return (
    <>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#611f69] font-bold text-white">
        {initial}
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#2bac76]" />
      </div>
      <div className="hidden text-left sm:block">
        <div className="text-sm font-semibold">{user?.displayName ?? 'Workspace user'}</div>
        <div className="text-xs text-[#6b6a6b]">{user?.role ?? 'MEMBER'}</div>
      </div>
    </>
  );
}

export default MainLayout;
