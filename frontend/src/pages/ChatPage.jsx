import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import DMChatWindow from '../components/Chat/DMChatWindow';
import ChatWindow from '../components/Chat/ChatWindow';
import useChatStore from '../store/chatStore';

const ChatPage = () => {
  const { type, id } = useParams();
  const { rooms, users } = useChatStore();

  const selectedRoom = useMemo(() => rooms.find((room) => String(room.id) === id), [id, rooms]);
  const selectedUser = useMemo(() => users.find((user) => String(user.id) === id), [id, users]);

  if (type === 'dm') {
    return <DMChatWindow user={selectedUser} />;
  }

  return <ChatWindow room={selectedRoom} />;
};

export default ChatPage;
