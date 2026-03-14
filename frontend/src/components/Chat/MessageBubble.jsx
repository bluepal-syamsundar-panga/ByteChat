import React, { useState } from 'react';
import { MoreHorizontal, Pin, Edit2, Trash2, Smile } from 'lucide-react';
import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';

const MessageBubble = ({ message, onEdit, onDelete, onPin }) => {
  const [isHovered, setIsHovered] = useState(false);
  const user = useAuthStore(state => state.user);
  const isMine = user?.id === message.senderId;
  const time = format(new Date(message.sentAt), 'h:mm a');

  return (
    <div 
      className={`group flex items-start px-4 py-2 hover:bg-gray-50 relative ${message.isPinned ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded bg-indigo-500 flex items-center justify-center text-white font-bold">
          {message.senderName?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="font-bold text-slack-textPrimary">{message.senderName}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        
        <div className="text-slack-textPrimary mt-0.5 whitespace-pre-wrap">
          <span className={message.isDeleted ? 'italic text-gray-500' : ''}>
            {message.content}
          </span>
          {message.editedAt && !message.isDeleted && (
             <span className="text-xs text-gray-400 ml-2">(edited)</span>
          )}
        </div>
      </div>

      {/* Action Menu (Visible on Hover) */}
      {isHovered && !message.isDeleted && (
        <div className="absolute top-[-15px] right-4 flex items-center bg-white border border-gray-200 rounded shadow-sm px-1 py-1 space-x-1 z-10">
          <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="React" onClick={() => {}}>
            <Smile size={16} />
          </button>
          <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title={message.isPinned ? "Unpin" : "Pin"} onClick={() => onPin(message.id)}>
            <Pin size={16} className={message.isPinned ? "fill-current text-yellow-500" : ""} />
          </button>
          
          {isMine && (
            <>
              <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit" onClick={() => onEdit(message)}>
                <Edit2 size={16} />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete" onClick={() => onDelete(message.id)}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
