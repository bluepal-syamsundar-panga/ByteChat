import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../store/chatStore';

const GroupPanel = () => {
  const navigate = useNavigate();
  const { groupConversations, notifications, sidebarMode, setSidebarMode, activeWorkspaceId } = useChatStore();

  const visibleGroups = activeWorkspaceId
    ? groupConversations.filter((group) => String(group.workspaceId) === String(activeWorkspaceId))
    : groupConversations;

  const unreadCount = visibleGroups.reduce((total, group) => total + (group.unreadCount || 0), 0);
  const pendingInvites = notifications.filter(
    (notification) => notification.type === 'GROUP_DM_INVITE' && !(notification.isRead || notification.read)
  ).length;
  const badgeCount = unreadCount + pendingInvites;

  const handleClick = () => {
    setSidebarMode('groups');
    if (visibleGroups.length > 0) {
      navigate(`/chat/group/${visibleGroups[0].id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-smooth hover:scale-110 ${
        sidebarMode === 'groups'
          ? 'bg-white/20 text-white shadow-md ring-1 ring-white/10'
          : 'text-white/40 hover:bg-white/5 hover:text-white/80'
      }`}
      title="Group Messages"
    >
      <Users size={22} />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e01e5a] px-1.5 text-[10px] font-bold text-white shadow-md shadow-[#e01e5a]/30">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
};

export default GroupPanel;
