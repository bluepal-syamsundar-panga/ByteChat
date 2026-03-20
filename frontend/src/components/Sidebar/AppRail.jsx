import { ArrowLeft, Plus, Home, Archive, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import NotificationPanel from '../Common/NotificationPanel';
import DMPanel from '../Common/DMPanel';
import logo3 from '../../assets/logo3.png';

const AppRail = ({ onCreateRoom, onProfileClick }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, workspaces, setIsCreateChannelModalOpen, sidebarMode, setSidebarMode } = useChatStore();

  const handleHomeClick = () => {
    setSidebarMode('channels');
    if (workspaces && workspaces.length > 0) {
      navigate(`/chat/workspace/${workspaces[0].id}`);
    } else {
      navigate('/');
    }
  };

  const firstWorkspaceInitials = (workspaces && workspaces.length > 0) 
    ? workspaces[0].name.substring(0, 2).toUpperCase() 
    : 'BC';

  return (
    <div className="flex h-full w-[68px] flex-col items-center bg-[#2c0b2e] py-2 text-white">
      <div className="mb-3 flex w-full flex-col items-center gap-3">
        <div 
          onClick={() => navigate('/')}
          className="flex h-16 w-full items-center justify-center cursor-pointer group"
        >
          <div className="flex h-12 w-12 items-center justify-center transition-transform group-hover:scale-110">
            <img src={logo3} alt="ByteChat" className="h-full w-full object-contain" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* Home / Channels */}
        <button
          onClick={handleHomeClick}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-smooth hover:scale-110 ${sidebarMode === 'channels' ? 'bg-white/20 text-white shadow-md shadow-white/5 ring-1 ring-white/10' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          title="Channels"
        >
          <Home size={22} />
        </button>

        {/* Create Channel */}
        <button
          onClick={() => setIsCreateChannelModalOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl transition-smooth hover:scale-110 text-white/40 hover:text-white hover:bg-white/10 border border-dashed border-white/20"
          title="Create Channel"
        >
          <Plus size={22} />
        </button>

        {/* Archive */}
        <button
          onClick={() => setSidebarMode('archive')}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-smooth hover:scale-110 ${sidebarMode === 'archive' ? 'bg-white/20 text-white shadow-md ring-1 ring-white/10' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          title="Archived Channels"
        >
          <Archive size={22} />
        </button>

        {/* Trash */}
        <button
          onClick={() => setSidebarMode('trash')}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-smooth hover:scale-110 ${sidebarMode === 'trash' ? 'bg-white/20 text-white shadow-md ring-1 ring-white/10' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
          title="Trash / Deleted Channels"
        >
          <Trash2 size={22} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <NotificationPanel allowedTypes={['MENTION', 'CHANNEL_INVITE', 'ROOM_INVITE']} />
        </div>

        {/* Direct Messages Hub */}
        <DMPanel />
      </div>

      <div className="mt-auto flex flex-col items-center gap-1 pb-2">
        <button
          onClick={onProfileClick}
          className="relative flex h-12 w-12 items-center justify-center rounded-full transition-smooth hover:scale-110 shadow-sm outline-none border-0"
          title="Profile Settings"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover rounded-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#611f69] to-[#3f0e40] text-sm font-extrabold rounded-full">
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-[#2bac76] border-2 border-[#2c0b2e] z-10 presence-dot" />
        </button>

        <button
          onClick={() => navigate('/')}
          className="flex min-h-0 items-center justify-center rounded-full bg-white/8 px-2 py-1 text-white/70 transition-smooth hover:bg-white/14 hover:text-white"
          style={{ fontSize: '7px', lineHeight: '7px' }}
          title="Back to landing page"
        >
          <span className="flex items-center gap-0.5">
            <ArrowLeft size={16} />
            Back
          </span>
        </button>
      </div>
    </div>
  );
};

export default AppRail;
