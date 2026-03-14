import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content);
      setContent('');
    }
  };

  return (
    <div className="p-4 bg-slack-appBg border-t border-gray-200">
      <form onSubmit={handleSubmit} className="relative bg-white rounded-md border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-slack-activeChannel focus-within:border-slack-activeChannel">
        <textarea
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Message ..."
          className="w-full resize-none py-3 pl-4 pr-24 max-h-32 bg-transparent text-slack-textPrimary focus:outline-none"
        />
        
        <div className="absolute right-2 bottom-2 flex items-center space-x-2">
          <button type="button" className="text-gray-400 hover:text-gray-600 p-1">
            <Paperclip size={20} />
          </button>
          <button type="button" className="text-gray-400 hover:text-gray-600 p-1">
            <Smile size={20} />
          </button>
          <button 
            type="submit" 
            disabled={!content.trim()}
            className="bg-slack-activeChannel text-white p-1.5 rounded disabled:opacity-50 disabled:bg-gray-300"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
