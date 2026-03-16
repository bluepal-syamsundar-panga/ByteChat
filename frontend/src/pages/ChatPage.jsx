import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import DMChatWindow from '../components/Chat/DMChatWindow';
import ChatWindow from '../components/Chat/ChatWindow';
import useChatStore from '../store/chatStore';
import channelService from '../services/channelService';
import userService from '../services/userService';

const ChatPage = () => {
  const { type, id } = useParams();
  const { workspaces, channels, users, setChannels } = useChatStore();
  const [loading, setLoading] = useState(false);

  const selectedWorkspace = useMemo(() => workspaces.find((ws) => String(ws.id) === id), [id, workspaces]);
  const selectedChannel = useMemo(() => channels.find((channel) => String(channel.id) === id), [id, channels]);
  const { sharedUsers } = useChatStore();
  const selectedUser = useMemo(() => sharedUsers.find((user) => String(user.id) === id), [id, sharedUsers]);

  // Fetch channel data if not in store
  useEffect(() => {
    if (type === 'channel' && id && !selectedChannel) {
      setLoading(true);
      const fetchChannels = async () => {
        try {
          // Try to fetch channels for all workspaces to find the missing one
          for (const ws of workspaces) {
            const response = await channelService.getWorkspaceChannels(ws.id);
            const channelsData = response.data?.data || response.data || [];
            if (Array.isArray(channelsData)) {
                setChannels(channelsData);
                const found = channelsData.find(c => String(c.id) === id);
                if (found) break;
            }
          }
        } catch (error) {
          console.error('Failed to fetch channels:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchChannels();
    }
  }, [type, id, selectedChannel, workspaces, setChannels]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading...</div>
          <div className="mt-2 text-sm text-[#6b6a6b]">Fetching channel data</div>
        </div>
      </div>
    );
  }

  if (type === 'dm') {
    return <DMChatWindow user={selectedUser} />;
  }

  if (type === 'channel') {
    return <ChatWindow channel={selectedChannel} />;
  }

  if (type === 'workspace') {
    return <ChatWindow room={selectedWorkspace} />;
  }

  // Fallback
  return (
    <div className="flex h-full items-center justify-center p-8 bg-white/50">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-black mb-4">Select a channel or workspace</h2>
        <p className="text-[#6b6a6b]">Choose a workspace from the home page and then a channel from the sidebar.</p>
      </div>
    </div>
  );
};

export default ChatPage;
