import { MessageSquareShare, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import dmService from '../../services/dmService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const DMChatWindow = ({ user }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { dmMessages, setDmMessages, appendDmMessage } = useChatStore();
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const thread = dmMessages[user?.id] ?? [];

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let mounted = true;

    async function loadConversation() {
      try {
        setLoading(true);
        const response = await dmService.getDirectMessages(user.id);
        if (mounted) {
          setDmMessages(user.id, [...(response.data.content ?? [])].reverse());
          await dmService.markAsRead(user.id);
        }
      } catch (error) {
        console.error('Failed to load DM thread', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConversation();
    const intervalId = window.setInterval(loadConversation, 6000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [setDmMessages, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function handleSend(content) {
    const response = await dmService.sendDirectMessage(user.id, content);
    appendDmMessage(user.id, response.data);
  }

  if (!user) {
    return <EmptyState title="Select a direct message" description="Open a teammate from the DM list to start chatting." />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <div className="text-lg font-semibold">{user.displayName}</div>
          <div className="mt-1 text-sm text-[#6b6a6b]">{user.email}</div>
        </div>
        <div className="rounded-full bg-black/5 px-3 py-1.5 text-sm text-[#6b6a6b]">
          <Sparkles size={14} className="mr-1 inline" />
          Private conversation
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {loading ? (
          <EmptyState title="Loading conversation" description="Fetching direct message history." />
        ) : thread.length === 0 ? (
          <EmptyState title="No direct messages yet" description={`Say hello to ${user.displayName}.`} />
        ) : (
          thread.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <MessageInput placeholder={`Message ${user.displayName}`} onSendMessage={handleSend} />
    </section>
  );
};

const EmptyState = ({ title, description }) => (
  <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
    <div className="text-xl font-semibold">{title}</div>
    <div className="mt-2 max-w-md text-sm leading-6 text-[#6b6a6b]">{description}</div>
    <div className="mt-4 rounded-full bg-[#f1e8f3] px-3 py-1.5 text-sm text-[#611f69]">
      <MessageSquareShare size={14} className="mr-1 inline" />
      DMs poll the backend currently; room chat is live over STOMP.
    </div>
  </div>
);

export default DMChatWindow;
