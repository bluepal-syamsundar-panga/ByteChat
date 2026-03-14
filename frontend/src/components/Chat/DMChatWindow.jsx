import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import useChatStore from '../../store/chatStore';
import dmService from '../../services/dmService';
import chatService from '../../services/chatService'; // for edit/delete sharing same endpoints
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';
import { User } from 'lucide-react';

const DMChatWindow = ({ userId }) => {
  const { messages, setMessages, addMessage, updateMessage, removeMessage } = useChatStore();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        setLoading(true);
        const response = await dmService.getDirectMessages(userId);
        if (response.success) {
          setMessages(response.data.content.reverse());
        }
        await dmService.markAsRead(userId);
        
        // Connect WebSocket for real-time (simplified: polling or a specific user topic could be done)
        // Here we just connect to be online, full DM socket routing requires a "/user/queue/dm" setup
        connectWebSocket();
        
      } catch (err) {
        console.error("Failed to load DMs", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      disconnectWebSocket();
    };
  }, [userId, setMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
     try {
       const res = await dmService.sendDirectMessage(userId, text);
       if (res.success) {
          addMessage(res.data);
       }
     } catch (err) {
       console.error(err);
     }
  };

  const handleEdit = async (msg) => {
    const newText = prompt("Edit message:", msg.content);
    if (newText && newText !== msg.content) {
      try {
        const res = await chatService.editMessage(msg.id, newText);
        if (res.success) updateMessage(res.data);
      } catch(e) { console.error(e) }
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await chatService.deleteMessage(id);
        removeMessage(id);
      } catch(e) { console.error(e) }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center px-6 shrink-0 bg-white">
        <User className="text-gray-400 mr-2" size={20} />
        <h2 className="font-bold text-slack-textPrimary text-lg">Direct Message</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading messages...</div>
        ) : (
          <div className="py-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 my-4">No messages yet. Say hi!</div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id || idx} 
                message={msg} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={() => {}} // DM pin not usually supported in simple clones
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <MessageInput onSendMessage={handleSend} />
    </div>
  );
};

export default DMChatWindow;
