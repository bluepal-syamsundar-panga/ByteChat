import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import useChatStore from '../../store/chatStore';
import chatService from '../../services/chatService';
import { connectWebSocket, disconnectWebSocket, subscribeToRoom, sendMessage } from '../../services/websocket';
import { Hash } from 'lucide-react';

const ChatWindow = ({ roomId, roomName }) => {
  const { messages, setMessages, addMessage, updateMessage, removeMessage } = useChatStore();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Fetch initial messages and connect WebSocket
    const initChat = async () => {
      try {
        setLoading(true);
        // Assuming roomId matches DB ID perfectly for simplify right now, normally mapping needed
        const response = await chatService.getRoomMessages(roomId || 1); 
        if (response.success) {
          // Page comes desc, UI expects bottom-up 
          setMessages(response.data.content.reverse());
        }
        
        // Setup WS
        connectWebSocket();
        // Delay slight to ensure connection established
        setTimeout(() => {
          subscribeToRoom(roomId || 1, (msg) => {
             // Basic switch based on payload or just append
             // If payload is an array or update type, handle differently in a fully-fledged app
             // For simplify, we just assume new message appends
             addMessage(msg);
          });
        }, 1000);
        
      } catch (err) {
        console.error("Failed to load room messages", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      disconnectWebSocket();
    };
  }, [roomId, setMessages, addMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text) => {
    sendMessage(roomId || 1, text);
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

  const handlePin = async (id) => {
     try {
        const res = await chatService.pinMessage(id);
        if (res.success) updateMessage(res.data);
     } catch(e) { console.error(e) }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center px-6 shrink-0 bg-white">
        <Hash className="text-gray-400 mr-2" size={20} />
        <h2 className="font-bold text-slack-textPrimary text-lg">{roomName || 'general'}</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading messages...</div>
        ) : (
          <div className="py-4">
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id || idx} 
                message={msg} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
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

export default ChatWindow;
