import { Hash, Pin, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import chatService from '../../services/chatService';
import {
  connectWebSocket,
  publishRoomMessage,
  publishTyping,
  subscribeToRoom,
  subscribeToTyping,
} from '../../services/websocket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ room }) => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    roomMessages,
    onlineUsers,
    typingByRoom,
    setRoomMessages,
    appendRoomMessage,
    upsertRoomMessage,
    setTyping,
  } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [roomMembers, setRoomMembers] = useState([]);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const roomId = room?.id;
  const messages = roomMessages[roomId] ?? [];

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;
    setLoading(true);

    async function loadRoom() {
      try {
        const [messagesResponse, membersResponse] = await Promise.all([
          chatService.getRoomMessages(roomId),
          chatService.getRoomMembers(roomId),
        ]);
        if (!mounted) {
          return;
        }

        setRoomMessages(roomId, [...(messagesResponse.data.content ?? [])].reverse());
        setRoomMembers(membersResponse.data ?? []);
        connectWebSocket(() => {
          subscribeToRoom(roomId, (message) => appendRoomMessage(roomId, message));
          subscribeToTyping(roomId, (event) => {
            setTyping(roomId, {
              [event.userId]: event.isTyping ? event.displayName : null,
            });
          });
        });
      } catch (error) {
        console.error('Failed to load room', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRoom();

    return () => {
      mounted = false;
    };
  }, [roomId, appendRoomMessage, setRoomMessages, setTyping]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const typingUsers = useMemo(() => {
    const entries = Object.entries(typingByRoom[roomId] ?? {});
    return entries
      .filter(([userId, name]) => name && Number(userId) !== currentUser?.id)
      .map(([, name]) => name);
  }, [currentUser?.id, roomId, typingByRoom]);

  async function handleSend(content) {
    const payload = { content, type: 'TEXT' };
    const sentOverWebSocket = publishRoomMessage(roomId, payload);
    if (!sentOverWebSocket) {
      const response = await chatService.sendRoomMessage(roomId, payload);
      appendRoomMessage(roomId, response.data);
    }
  }

  async function handleEdit(message) {
    const nextContent = window.prompt('Edit message', message.content);
    if (!nextContent || nextContent === message.content) {
      return;
    }

    const response = await chatService.editMessage(message.id, nextContent);
    upsertRoomMessage(roomId, response.data);
  }

  async function handleDelete(message) {
    if (!window.confirm('Delete this message?')) {
      return;
    }

    await chatService.deleteMessage(message.id);
    upsertRoomMessage(roomId, {
      ...message,
      content: 'This message was deleted.',
      isDeleted: true,
    });
  }

  async function handlePin(message) {
    const response = await chatService.pinMessage(message.id);
    upsertRoomMessage(roomId, response.data);
  }

  async function handleReact(message) {
    const emoji = window.prompt('React with emoji', ':+1:');
    if (!emoji) {
      return;
    }
    await chatService.reactToMessage(message.id, emoji);
  }

  function handleTyping(isTyping) {
    publishTyping(roomId, {
      userId: currentUser?.id,
      displayName: currentUser?.displayName,
      isTyping,
    });

    window.clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = window.setTimeout(() => {
        publishTyping(roomId, {
          userId: currentUser?.id,
          displayName: currentUser?.displayName,
          isTyping: false,
        });
      }, 1800);
    }
  }

  if (!room) {
    return (
      <EmptyState
        title="Select a channel"
        description="Choose a room from the sidebar or create a new one."
      />
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Hash size={18} className="text-[#6b6a6b]" />
            {room.name}
          </div>
          <div className="mt-1 text-sm text-[#6b6a6b]">
            {room.description || 'Real-time room conversation'}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#6b6a6b]">
          {room.createdById === currentUser?.id && (
            <button
              type="button"
              onClick={async () => {
                const email = window.prompt('Invite user by email');
                if (!email?.trim()) {
                  return;
                }
                try {
                  await chatService.inviteUser(roomId, email.trim());
                  window.alert('Invite sent');
                } catch (error) {
                  window.alert(error.response?.data?.message ?? 'Unable to send invite');
                }
              }}
              className="rounded-full bg-[#1164a3] px-3 py-1.5 text-white transition hover:bg-[#0c548a]"
            >
              Invite by email
            </button>
          )}
          <div className="rounded-full bg-black/5 px-3 py-1.5">
            <Users size={14} className="mr-1 inline" />
            {roomMembers.length} members
          </div>
          <div className="rounded-full bg-[#fff4d8] px-3 py-1.5 text-[#8c5b00]">
            <Pin size={14} className="mr-1 inline" />
            Pin important updates
          </div>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {loading ? (
          <EmptyState
            title="Loading room"
            description="Fetching latest message history and live subscriptions."
          />
        ) : messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description="Start the room with a welcome note or a mention."
          />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onReact={handleReact}
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <TypingIndicator users={typingUsers} />

      <MessageInput
        placeholder={`Message #${room.name}`}
        onSendMessage={handleSend}
        onTyping={handleTyping}
        mentionSuggestions={roomMembers.filter((member) => member.id !== currentUser?.id)}
        onUploadFile={() =>
          window.alert(
            'Attachment upload endpoint exists at /api/files/upload. UI hook can be expanded next.',
          )
        }
      />
    </section>
  );
};

const EmptyState = ({ title, description }) => (
  <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
    <div className="text-xl font-semibold">{title}</div>
    <div className="mt-2 max-w-md text-sm leading-6 text-[#6b6a6b]">{description}</div>
  </div>
);

export default ChatWindow;
