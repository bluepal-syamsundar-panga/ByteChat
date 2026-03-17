import { Bell, Hash, Lock, Mail, MessageCircleMore, Plus, Check, X, Users2, Trash2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import userService from '../../services/userService';
import channelService from '../../services/channelService';
import chatService from '../../services/chatService';
import workspaceService from '../../services/workspaceService';

const Sidebar = ({ onAcceptInvite }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { 
    workspaces, 
    channels, 
    setChannels, 
    sharedUsers, 
    setSharedUsers, 
    setActiveWorkspaceId: setStoreActiveWorkspaceId,
    setIsCreateChannelModalOpen,
    sidebarMode,
    setSidebarMode
  } = useChatStore();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(useChatStore.getState().activeWorkspaceId);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [channelMembersList, setChannelMembersList] = useState([]);

  useEffect(() => {
    const workspaceIdMatch = location.pathname.match(/\/chat\/workspace\/(\d+)/);
    const channelIdMatch = location.pathname.match(/\/chat\/channel\/(\d+)/);
    
    if (channelIdMatch) {
      const channelId = parseInt(channelIdMatch[1]);
      setActiveChannelId(channelId);
      
      // Find workspace for this channel from channels list
      const channel = channels.find(c => c.id === channelId);
      if (channel && channel.workspaceId) {
        setActiveWorkspaceId(channel.workspaceId);
        setStoreActiveWorkspaceId(channel.workspaceId);
      }
    } else {
      setActiveChannelId(null);
    }

    if (workspaceIdMatch) {
      const wsId = parseInt(workspaceIdMatch[1]);
      setActiveWorkspaceId(wsId);
      setStoreActiveWorkspaceId(wsId);
    }
  }, [location.pathname, channels]);

  useEffect(() => {
    if (activeWorkspaceId) {
      const fetchChannels = async () => {
        let res;
        try {
          if (sidebarMode === 'archive') {
            res = await channelService.getArchivedChannels(activeWorkspaceId);
          } else if (sidebarMode === 'trash') {
            res = await channelService.getDeletedChannels(activeWorkspaceId);
          } else {
            res = await channelService.getWorkspaceChannels(activeWorkspaceId);
          }
          setChannels(res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch channels for mode:', sidebarMode, err);
          setChannels([]);
        }
      };
      fetchChannels();
    }
  }, [activeWorkspaceId, sidebarMode, setChannels]);

  useEffect(() => {
    if (activeChannelId) {
      userService.getChannelMembers(activeChannelId).then(res => {
        setChannelMembersList(Array.isArray(res?.data) ? res.data : []);
      }).catch(err => {
        console.warn('Failed to load channel members in sidebar:', err?.response?.status);
        setChannelMembersList([]);
      });
    } else {
      setChannelMembersList([]);
    }
  }, [activeChannelId]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const usersResp = await userService.getSharedRoomUsers();
        if (mounted) {
          setSharedUsers(Array.isArray(usersResp?.data) ? usersResp.data : []);
        }
      } catch (e) {
        console.error('Failed to load sidebar data', e);
      }
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setSharedUsers]);

  const visibleDMs = sharedUsers.filter(u => u.id !== user?.id);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail.trim()) return;
    try {
      await workspaceService.inviteToWorkspace(activeWorkspaceId, inviteEmail);
      setShowInviteModal(false);
      setInviteEmail('');
      alert('Invitation sent successfully! The user will receive a notification.');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send invitation. Make sure the email is registered.';
      alert(errorMsg);
    }
  };

  const handlePermanentDelete = async (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('PERMANENTLY delete this channel? This cannot be undone.')) return;
    try {
      await channelService.permanentlyDeleteChannel(channelId);
      setChannels(channels.filter(c => c.id !== channelId));
    } catch (err) {
      alert(err.response?.data?.message || 'Only the creator can permanently delete this channel.');
    }
  };

  const handleRestore = async (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await channelService.restoreChannel(channelId);
      setChannels(channels.filter(c => c.id !== channelId));
      alert('Channel restored!');
    } catch (err) {
      alert('Failed to restore channel.');
    }
  };

  const activeWorkspace = workspaces.find(r => r.id === activeWorkspaceId);

  return (
    <>
      <aside className="flex w-full max-w-[340px] shrink-0 flex-col bg-[#3f0e40] text-white md:w-[340px]">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            {sidebarMode === 'archive' ? 'Archive Center' : sidebarMode === 'trash' ? 'Trash Bin' : 'Workspace'}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {sidebarMode === 'archive' ? 'Archived' : sidebarMode === 'trash' ? 'Deleted' : (activeWorkspace?.name || 'ByteChat')}
              </div>
              <div className="text-sm text-white/70">
                {sidebarMode === 'archive' ? 'Historical channels' : sidebarMode === 'trash' ? 'Soft-deleted items' : 'Channels and teammates'}
              </div>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <section>
            <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              <span>{sidebarMode === 'archive' ? 'Archived Channels' : sidebarMode === 'trash' ? 'Trashed Channels' : 'Channels'}</span>
              {sidebarMode === 'channels' && (
                <button 
                  onClick={() => setIsCreateChannelModalOpen(true)}
                  className="hover:text-white transition-colors"
                  disabled={!activeWorkspaceId}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <SidebarLink
                  key={channel.id}
                  to={`/chat/channel/${channel.id}`}
                  isActive={activeChannelId === channel.id}
                  icon={channel.isPrivate || channel.private ? <Lock size={16} /> : <Hash size={16} />}
                  title={`${channel.name}${channel.isArchived || channel.archived ? ' (archived)' : ''}`}
                  subtitle={channel.description}
                  badge={null}
                  isArchived={channel.isArchived || channel.archived}
                  isDeleted={channel.isDeleted || channel.deleted}
                  onRestore={(e) => handleRestore(e, channel.id)}
                  onPermanentDelete={(e) => handlePermanentDelete(e, channel.id)}
                  sidebarMode={sidebarMode}
                  isCreator={channel.createdBy?.id === user?.id}
                />
              ))}
              {channels.length === 0 && activeWorkspaceId && (
                <p className="px-3 text-xs text-white/40 italic">Nothing found here</p>
              )}
              {channels.length === 0 && !activeWorkspaceId && (
                <p className="px-3 text-xs text-white/40 italic">Select a workspace to see items</p>
              )}
            </div>
          </section>

          {sidebarMode === 'channels' && (
            <section className="bg-[#350d36] p-4 shadow-inner">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MessageCircleMore size={16} />
                Direct messages
              </div>
              <div className="space-y-1">
                {visibleDMs.map((u) => (
                  <SidebarLink
                    key={u.id}
                    to={`/chat/dm/${u.id}`}
                    isActive={location.pathname === `/chat/dm/${u.id}`}
                    icon={
                      <div className="relative flex h-5 w-5 items-center justify-center bg-white/20 text-[10px] font-bold overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="h-full w-full object-cover" />
                        ) : (
                          u.displayName?.[0]?.toUpperCase() ?? 'U'
                        )}
                        <span className={`absolute bottom-0 right-0 h-2 w-2 border-2 border-[#350d36] ${u.online ? 'bg-[#2bac76]' : 'bg-white/40'}`} />
                      </div>
                    }
                    title={u.displayName}
                    subtitle={u.online ? 'Online' : 'Offline'}
                    badge={null}
                    sidebarMode={sidebarMode}
                  />
                ))}
                {visibleDMs.length === 0 && (
                  <p className="px-2 py-1 text-sm leading-6 text-white/70 italic opacity-50">No channel teammates.</p>
                )}
              </div>
            </section>
          )}
          
          <div className="mt-8 px-2 border-t border-white/5 pt-4">
             <button 
               onClick={() => setShowInviteModal(true)}
               className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white group"
             >
               <div className="flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/5 group-hover:border-white/40">
                 <Users2 size={14} />
               </div>
               Invite Members
             </button>
          </div>
        </div>
      </aside>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#3f0e40] p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Invite to workspace</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <p className="text-white/60 text-sm mb-6">
              An invitation will be sent to the user's notification center.
            </p>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-white text-[#3f0e40] font-bold py-3 hover:bg-white/90 transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const SidebarLink = ({ to, isActive, icon, title, subtitle, badge, isArchived, isDeleted, onRestore, onPermanentDelete, sidebarMode = 'channels', isCreator }) => (
  <div className="group relative flex items-center pr-2">
    <NavLink
      to={sidebarMode === 'channels' ? to : '#'}
      onClick={(e) => sidebarMode !== 'channels' && e.preventDefault()}
      className={`flex flex-1 items-start gap-3 px-3 py-2.5 transition ${isActive ? 'bg-white/10 text-white border-l-4 border-white' : 'text-white/85 hover:bg-white/8'
        } ${isArchived || isDeleted ? 'opacity-50' : ''}`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-medium ${isDeleted ? 'line-through text-red-400' : ''}`}>{title}</div>
        <div className="truncate text-xs text-white/60">{subtitle}</div>
      </div>
      {badge && <div className="bg-white/12 px-2 py-1 text-[10px] font-bold">{badge}</div>}
    </NavLink>
    
    {(sidebarMode === 'archive' || sidebarMode === 'trash') && (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onRestore}
          className="p-1 hover:bg-white/20 rounded transition-colors" 
          title="Restore"
        >
          <Plus size={16} />
        </button>
        {sidebarMode === 'trash' && isCreator && (
          <button 
            onClick={onPermanentDelete}
            className="p-1 hover:bg-red-500/30 text-red-400 rounded transition-colors"
            title="Permanently Delete"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    )}
  </div>
);

export default Sidebar;
