import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import AppRail from '../components/Sidebar/AppRail';
import CreateChannelModal from '../components/Sidebar/CreateChannelModal';
import Modal from '../components/Shared/Modal';
import NotificationPanel from '../components/Common/NotificationPanel';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import chatService from '../services/chatService';
import workspaceService from '../services/workspaceService';
import notificationService from '../services/notificationService';
import userService from '../services/userService';
import { connectWebSocket, disconnectWebSocket, subscribeToNotifications } from '../services/websocket';

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const {
    setWorkspaces,
    setUsers,
    setOnlineUsers,
    setNotifications,
    workspaces,
    activeWorkspaceId,
  } = useChatStore();
  const location = useLocation();

  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return workspaces.find(ws => ws.id === activeWorkspaceId);
  }, [activeWorkspaceId, workspaces]);

  const displayRole = useMemo(() => {
    if (!user) return 'MEMBER';
    if (activeWorkspace && activeWorkspace.createdById === user.id) {
        return 'OWNER';
    }
    return user.role || 'MEMBER';
  }, [user, activeWorkspace]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    connectWebSocket((stompClient) => {
      subscribeToNotifications(user.id, (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
    });
    loadAppContent();
    return () => disconnectWebSocket();
  }, [user?.id]);

  async function loadAppContent() {
    try {
      const [workspacesRes, usersRes, onlineRes, meRes, notificationsRes] = await Promise.allSettled([
        chatService.getWorkspaces(),
        userService.getUsers(),
        userService.getOnlineUsers(),
        userService.getCurrentUser(),
        notificationService.getNotifications(),
      ]);

      if (workspacesRes.status === 'fulfilled') {
        setWorkspaces(workspacesRes.value.data?.content ?? workspacesRes.value.data ?? []);
      } else {
        console.error('Failed to load workspaces:', workspacesRes.reason?.response?.data || workspacesRes.reason);
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
      console.error('Failed to load app content', error);
    }
  }

  async function handleCreateWorkspaceSubmit(e) {
    if (e) e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    // For full flow, we should use WorkspaceWizard or an OTP-enabled modal.
    // However, if the user is ALREADY logged in, we might allow direct creation or redirect to a wizard.
    // The requirement says: "If user create Workspace also at that time also User can verify with OTP"
    // So we should navigate them to the WorkspaceWizard.
    navigate('/create-workspace');
    setShowCreateWorkspaceModal(false);
  }

  async function handleAcceptInvite(notificationId) {
    try {
      await notificationService.accept(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      await loadAppContent();
    } catch (error) {
      window.alert(error.response?.data?.message ?? 'Unable to accept invite');
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-[#1d1c1d]">
      <AppRail onCreateRoom={() => setShowCreateWorkspaceModal(true)} />
      <Sidebar onAcceptInvite={handleAcceptInvite} />
      <CreateChannelModal />

      <div className="flex min-w-0 flex-1 flex-col">
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
                  <div className="text-[10px] uppercase font-bold tracking-tight text-[#6b6a6b]">{displayRole}</div>
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
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        title="Create a New Workspace"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6b6a6b]">
            To create a new workspace, you'll need to verify your email address.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateWorkspaceModal(false)}
              className="px-4 py-2 text-sm font-semibold text-[#6b6a6b] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWorkspaceSubmit}
              className="bg-[#3f0e40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#350d36]"
            >
              Start Setup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MainLayout;
