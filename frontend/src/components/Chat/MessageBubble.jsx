import { Paperclip, Pin } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { formatMessageTimestamp } from '../../utils/formatDate';

const MessageBubble = ({ message, isSelected, onClick }) => {
  const currentUser = useAuthStore((state) => state.user);
  
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
        <span key={match.index} className="rounded bg-[#1164a3]/10 px-1 font-semibold text-[#1164a3]">
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
          <div className="mt-2 overflow-hidden border border-black/10 shadow-sm bg-white/50">
            <img 
              src={url} 
              alt="Attachment" 
              className="max-h-[300px] max-w-full object-contain" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.innerHTML = '<div class="p-4 text-xs text-red-500 italic">Failed to load image</div>';
              }}
            />
          </div>
        );
      }
      return (
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 border border-black/10 bg-white p-3 text-sm font-medium text-[#1164a3] transition hover:bg-black/5">
          <Paperclip size={16} />
          Download Attachment
        </a>
      );
    }
    return <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>;
  };

  const isMine = String(message.senderId) === String(currentUser?.id);

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col gap-1 px-5 py-3 transition cursor-pointer hover:bg-black/[0.04] ${isSelected ? 'bg-[#3f0e40]/10 border-l-4 border-[#3f0e40]' : ''} ${message.isPinned && !isSelected ? 'bg-[#fff7d6]' : ''} ${isMentioned && !isSelected ? 'border-l-4 border-[#1164a3] bg-[#1164a3]/5' : ''} ${isMine ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex max-w-[85%] gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center bg-[#611f69] font-bold text-white`}>
          {initial}
          {message.isPinned && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-[#ffb900] text-[#1d1c1d]">
              <Pin size={8} />
            </span>
          )}
        </div>

        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2">
            {!isMine && <div className="truncate text-xs font-bold">{message.senderName}</div>}
            <div className="text-[10px] text-[#6b6a6b]">
              {formatMessageTimestamp(message.sentAt)}
              {message.editedAt && <span className="ml-1 italic">(edited)</span>}
            </div>
          </div>

          <div className={`mt-1 inline-block px-4 py-2 text-sm shadow-sm ${isMine ? 'bg-[#3f0e40] text-white' : 'bg-black/5 text-[#1d1c1d]'}`}>
            {renderMessageContent()}
          </div>

          {message.reactions?.length > 0 && (
            <div className={`mt-2 flex flex-wrap gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <div 
                  key={emoji} 
                  className="flex items-center gap-1.5 border border-black/5 bg-black/[0.03] px-2 py-0.5 text-[10px] font-medium text-[#1d1c1d]"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[#6b6a6b]">{count}</span>}
                </div>
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
