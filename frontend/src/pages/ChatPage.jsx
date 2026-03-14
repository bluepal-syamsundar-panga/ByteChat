import React from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from '../components/Chat/ChatWindow';
import DMChatWindow from '../components/Chat/DMChatWindow';

const ChatPage = () => {
  const { type, id } = useParams();
  
  const isRoom = type === 'room';

  return (
    <div className="flex flex-col h-full w-full">
      {isRoom ? (
        <ChatWindow roomId={id === 'general' ? 1 : id === 'random' ? 2 : id} roomName={id} />
      ) : (
        <DMChatWindow userId={id === '1' ? 2 : id} /> // basic mock
      )}
    </div>
  );
};

export default ChatPage;
