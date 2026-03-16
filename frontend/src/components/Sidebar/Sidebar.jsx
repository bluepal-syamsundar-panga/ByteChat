import { Bell, Hash, Lock, Mail, MessageCircleMore, Plus, Check, X, Users2 } from 'lucide-react';
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
  const { workspaces, channels, setChannels, sharedUsers, setSharedUsers, setActiveWorkspaceId: setStoreActiveWorkspaceId } = useChatStore();
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
      channelService.getWorkspaceChannels(activeWorkspaceId).then(res => {
        setChannels(res.data.data || []);
      });
    }
  }, [activeWorkspaceId, setChannels]);

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

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

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!activeWorkspaceId || !newChannelName.trim()) return;
    try {
      const res = await channelService.createChannel(activeWorkspaceId, newChannelName, newChannelDesc);
      setChannels([...channels, res.data.data]);
      setIsModalOpen(false);
      setNewChannelName('');
      setNewChannelDesc('');
    } catch (err) {
      console.error('Failed to create channel', err);
    }
  };

  const activeWorkspace = workspaces.find(r => r.id === activeWorkspaceId);

  return (
    <>
      <aside className="flex w-full max-w-[340px] shrink-0 flex-col bg-[#3f0e40] text-white md:w-[340px]">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Workspace</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{activeWorkspace?.name || 'ByteChat'}</div>
              <div className="text-sm text-white/70">Channels and teammates</div>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <section>
            <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              <span>Channels</span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="hover:text-white transition-colors"
                disabled={!activeWorkspaceId}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <SidebarLink
                  key={channel.id}
                  to={`/chat/channel/${channel.id}`}
                  isActive={activeChannelId === channel.id}
                  icon={<Hash size={16} />}
                  title={`${channel.name}${channel.isArchived ? ' (archived)' : ''}`}
                  subtitle={channel.description}
                  badge={null}
                  isArchived={channel.isArchived}
                />
              ))}
              {channels.length === 0 && activeWorkspaceId && (
                <p className="px-3 text-xs text-white/40 italic">No channels created yet</p>
              )}
              {channels.length === 0 && !activeWorkspaceId && (
                <p className="px-3 text-xs text-white/40 italic">Select a workspace to see channels</p>
              )}
            </div>
          </section>

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
                />
              ))}
              {visibleDMs.length === 0 && (
                <p className="px-2 py-1 text-sm leading-6 text-white/70 italic opacity-50">No channel teammates.</p>
              )}
            </div>
          </section>
          
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

      {/* Create Channel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#3f0e40] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create a channel</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <p className="text-white/60 text-sm mb-6">
              Channels are where your team communicates. They’re best when organized around a topic — #marketing, for example.
            </p>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Name</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">#</span>
                   <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. plan-budget"
                    className="w-full bg-white/5 border border-white/10 px-8 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What’s this channel about?"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-white text-[#3f0e40] font-bold py-3 hover:bg-white/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const SidebarLink = ({ to, isActive, icon, title, subtitle, badge, isArchived }) => (
  <NavLink
    to={to}
    className={`flex items-start gap-3 px-3 py-2.5 transition ${isActive ? 'bg-white/10 text-white border-l-4 border-white' : 'text-white/85 hover:bg-white/8'
      } ${isArchived ? 'opacity-50 grayscale' : ''}`}
  >
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium">{title}</div>
      <div className="truncate text-xs text-white/60">{subtitle}</div>
    </div>
    {badge && <div className="bg-white/12 px-2 py-1 text-[10px] font-bold">{badge}</div>}
  </NavLink>
);

export default Sidebar;
