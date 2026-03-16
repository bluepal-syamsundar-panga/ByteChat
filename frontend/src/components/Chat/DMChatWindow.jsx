import { MessageSquareShare, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import dmService from '../../services/dmService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { connectWebSocket, subscribeToDM } from '../../services/websocket';

const DMChatWindow = ({ user }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { dmMessages, setDmMessages, appendDmMessage } = useChatStore();
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const messageContainerRef = useRef(null);
  const thread = dmMessages[user?.id] ?? [];
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let mounted = true;
    setIsFirstLoad(true);

    async function loadConversation(isInitial = false) {
      try {
        if (isInitial) setLoading(true);
        const response = await dmService.getDirectMessages(user.id);
        if (mounted) {
          console.log('DM Response:', response);
          console.log('DM Response Data:', response.data);
          
          // Handle ApiResponse wrapper: response.data.data.content
          const messagesData = response.data?.data || response.data || response;
          const newMessages = [...(messagesData.content ?? messagesData ?? [])].reverse();
          
          console.log('Processed DM Messages:', newMessages);
          console.log('DM Messages Count:', newMessages.length);
          
          // Check if we should scroll before updating state
          const container = messageContainerRef.current;
          const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;

          setDmMessages(user.id, newMessages);
          await dmService.markAsRead(user.id);
          
          // Clear DM notifications in local store
          const { setNotifications } = useChatStore.getState();
          setNotifications(prev => prev.map(n => 
            (n.type === 'DIRECT_MESSAGE') ? { ...n, isRead: true, read: true } : n
          ));

          if (isInitial) {
            // Instant scroll on first load
            setTimeout(() => {
              scrollToBottom('auto');
              setIsFirstLoad(false);
            }, 50);
          } else if (isAtBottom) {
            scrollToBottom('smooth');
          }
        }
      } catch (error) {
        console.error('Failed to load DM thread', error);
      } finally {
        if (mounted && isInitial) {
          setLoading(false);
        }
      }
    }

    loadConversation(true);
    
    // Subscribe to WebSocket for real-time DM updates
    connectWebSocket(() => {
      subscribeToDM(currentUser.id, (message) => {
        if (mounted && (message.senderId === user.id || message.senderId === currentUser.id)) {
          const container = messageContainerRef.current;
          const isAtBottom = container ? (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) : true;
          appendDmMessage(user.id, message);
          if (isAtBottom) setTimeout(() => scrollToBottom('smooth'), 50);
        }
      });
    });

    return () => {
      mounted = false;
    };
  }, [setDmMessages, appendDmMessage, user?.id, currentUser?.id]);

  async function handleSend(content) {
    try {
      // dmService returns ApiResponse { data: MessageResponse }.
      // We immediately append the message so sender sees it right away.
      // WebSocket echo (subscribeToDM) will also arrive and dedupe handles any duplicates.
      const apiResponse = await dmService.sendDirectMessage(user.id, content);
      const sentMessage = apiResponse?.data ?? apiResponse;
      if (sentMessage?.id) {
        appendDmMessage(user.id, sentMessage);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (error) {
      console.error('Failed to send DM:', error);
      alert('Failed to send message. Please try again.');
    }
  }

  if (!user) {
    return <EmptyState title="Select a direct message" description="Open a teammate from the DM list to start chatting." />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <div className="text-lg font-semibold">{user.displayName}</div>
          <div className="mt-1 text-sm text-[#6b6a6b]">{user.email}</div>
        </div>
        <div className="bg-black/5 px-3 py-1.5 text-sm text-[#6b6a6b] border border-black/5">
          <Sparkles size={14} className="mr-1 inline" />
          Private conversation
        </div>
      </header>

      <div ref={messageContainerRef} className="scrollbar-thin flex-1 overflow-y-auto">
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
    <div className="mt-4 bg-[#f1e8f3] px-3 py-1.5 text-sm text-[#611f69] border border-[#611f69]/10">
      <MessageSquareShare size={14} className="mr-1 inline" />
      DMs now use real-time WebSocket updates!
    </div>
  </div>
);

export default DMChatWindow;
