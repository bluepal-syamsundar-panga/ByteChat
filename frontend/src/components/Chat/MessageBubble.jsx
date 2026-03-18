import { Paperclip, Pin, Check, CheckCheck, Plus } from 'lucide-react';
import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import useAuthStore from '../../store/authStore';
import { formatMessageTimestamp, formatJustTime } from '../../utils/formatDate';

const MessageBubble = ({ message, isSelected, onClick, onReact }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [showFullPicker, setShowFullPicker] = useState(false);
  
  const isMentioned = message.mentionedUserIds?.includes(currentUser?.id);
  const initial = message.senderName?.[0]?.toUpperCase() ?? 'U';

  // Highlight mentions in the message content
  const renderContent = (content) => {
    if (!content) return content;
    
    const mentionRegex = /@([A-Za-z0-9._-]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      // Add highlighted mention
      parts.push(
        <span key={match.index} className="rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-blue-600 ring-1 ring-blue-100 mx-0.5">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const renderMessageContent = () => {
    if (message.isDeleted) return <div className="italic text-[#6b6a6b]">{message.content}</div>;

    if (message.type === 'FILE' && message.content && message.content.startsWith('/uploads/')) {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message.content);
      const baseUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.split('/api')[0] 
        : 'http://localhost:8080';
      const url = `${baseUrl}${message.content}`;
      
      if (isImage) {
        return (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white/50 group/img ring-1 ring-black/5">
            <img 
              src={url} 
              alt="Attachment" 
              className="max-h-[300px] max-w-full object-contain transition-smooth group-hover/img:scale-[1.02]" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.innerHTML = '<div class="p-6 text-xs text-red-500 font-medium italic">Failed to load image</div>';
              }}
            />
          </div>
        );
      }
      return (
        <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-3 border border-gray-100 bg-gray-50 px-5 py-3 rounded-2xl text-sm font-bold text-blue-600 transition-smooth hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
          <Paperclip size={18} />
          <span>Download Attachment</span>
        </a>
      );
    }
    return <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>;
  };

  const isMine = String(message.senderId) === String(currentUser?.id);
  const senderAvatar = isMine ? currentUser?.avatarUrl : message.senderAvatar;

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col gap-1 px-8 py-1 transition-smooth cursor-pointer border-l-4 animate-message ${isSelected ? 'bg-[#3f0e40]/5 border-[#3f0e40]' : 'hover:bg-gray-50/30 border-transparent'} ${message.isPinned && !isSelected ? 'bg-amber-50/20 border-amber-300' : ''} ${isMentioned && !isSelected ? 'border-blue-400 bg-blue-50/10' : ''} ${isMine ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex max-w-[85%] gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#611f69] to-[#3f0e40] font-extrabold text-white transition-smooth group-hover:scale-105 overflow-hidden`}>
          {senderAvatar ? (
            <img src={senderAvatar} alt={message.senderName} className="h-full w-full object-cover rounded-full" />
          ) : (
            initial
          )}
          {message.isPinned && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-900 shadow-sm border border-white">
              <Pin size={6} fill="currentColor" />
            </span>
          )}
        </div>

        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2">
            {!isMine && <div className="truncate text-[11px] font-bold text-gray-900">{message.senderName}</div>}
          </div>

          <div className={`mt-0.5 relative inline-block px-3 py-1.5 rounded-xl text-[14px] tracking-tight leading-relaxed ${isMine ? 'bg-[#3f0e40] text-white' : 'bg-gray-100 text-gray-800'}`}>
            {isSelected && (
              <div className={`absolute bottom-full mb-2 flex items-center gap-1.5 bg-white border border-black/5 p-1 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 z-50 ${isMine ? 'right-0' : 'left-0'}`}>
                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact?.(emoji);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 transition-all hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullPicker(!showFullPicker);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-125 ${showFullPicker ? 'bg-[#3f0e40] text-white' : 'hover:bg-black/5 text-[#6b6a6b]'}`}
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                  
                  {showFullPicker && (
                    <div className={`absolute bottom-full mb-4 z-[60] shadow-2xl ${isMine ? 'right-[-100px]' : 'left-[-100px]'}`} onClick={e => e.stopPropagation()}>
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          onReact?.(emojiData.emoji);
                          setShowFullPicker(false);
                        }}
                        autoFocusSearch={false}
                        theme="light"
                        width={300}
                        height={400}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-end justify-end gap-x-2">
              <div className="flex-1 min-w-0">
                {renderMessageContent()}
              </div>
              <div className={`inline-flex items-center gap-1 shrink-0 mb-[-2px] text-[9px] font-bold ${isMine ? 'text-purple-200/80' : 'text-gray-400/80'} select-none`}>
                {formatJustTime(message.sentAt)}
                {isMine && (
                  <span className="flex">
                    {message.readCount > 0 ? (
                      <CheckCheck size={12} className="text-blue-400" />
                    ) : (
                      <Check size={12} className="text-purple-200/50" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {message.reactions?.length > 0 && (
            <div className={`mt-0.5 flex flex-wrap gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <button 
                  key={emoji} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact?.(emoji);
                  }}
                  className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-700 transition-smooth hover:scale-110 hover:bg-black/5 active:scale-95"
                  title={message.reactions
                    .filter(r => r.emoji === emoji)
                    .map(r => r.username)
                    .join(', ')}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-gray-400 font-medium">{count}</span>}
                </button>
              ))}
            </div>
          )}

          {isMine && message.readCount > 0 && (
            <div className="mt-1 text-[10px] text-[#6b6a6b] italic">
              Seen by {message.readCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
