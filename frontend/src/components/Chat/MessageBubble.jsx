import { FileText, Paperclip, Pin, Plus } from 'lucide-react';
import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import useAuthStore from '../../store/authStore';
import { formatMessageTimestamp, formatJustTime } from '../../utils/formatDate';

const MessageBubble = ({ message, isSelected, showReactionPicker = true, onClick, onReact, participants = [] }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [showFullPicker, setShowFullPicker] = useState(false);
  
  const isMentioned = message.mentionedUserIds?.includes(currentUser?.id);
  const initial = message.senderName?.[0]?.toUpperCase() ?? 'U';

  // Highlight mentions in the message content
  const renderContent = (content) => {
    if (!content) return content;

    const tokenRegex = /(@[A-Za-z0-9._-]+|https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      if (match[0].startsWith('@')) {
        parts.push(
          <span key={`mention-${match.index}`} className="mx-0.5 font-bold text-blue-600">
            {match[0]}
          </span>
        );
      } else {
        parts.push(
          <a
            key={`link-${match.index}`}
            href={match[0]}
            target="_blank"
            rel="noreferrer"
            className="break-all text-[#1164a3] underline underline-offset-2"
            onClick={(event) => event.stopPropagation()}
          >
            {match[0]}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const renderMessageContent = () => {
    if (message.isDeleted) return <div className="italic text-[#6b6a6b]">{message.content}</div>;

    const isServerFile = typeof message.content === 'string'
      && (
        message.content.startsWith('/uploads/')
        || (['FILE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(message.type) && message.content.startsWith('http'))
      );

    if ((['FILE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(message.type) || isServerFile) && message.content) {
      if (!isServerFile) {
        return <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>;
      }

      const baseUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.split('/api')[0] 
        : 'http://localhost:8080';
      const url = message.content.startsWith('http') ? message.content : `${baseUrl}${message.content}`;
      const rawFileName = decodeURIComponent(url.split('/').pop() || 'attachment');
      const fileName = rawFileName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
      const normalizedName = fileName.toLowerCase();
      const looksLikeVoiceNote = normalizedName.includes('voice-note');
      const isAudio = message.type === 'AUDIO' || looksLikeVoiceNote || /\.(mp3|wav|m4a|aac|oga|ogg|opus)$/i.test(normalizedName);
      const isImage = message.type === 'FILE' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(normalizedName);
      const isVideo = (message.type === 'VIDEO' || /\.(mp4|mov|m4v|avi|mkv|webm)$/i.test(normalizedName)) && !isAudio;
      const isDocument = message.type === 'DOCUMENT' || !isImage && !isVideo && !isAudio;
      
      if (isImage) {
        return (
          <a href={url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-2xl border border-gray-200 bg-white ring-1 ring-black/5">
            <img 
              src={url} 
              alt="Attachment" 
              className="max-h-[300px] max-w-full object-contain" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.innerHTML = '<div class="p-6 text-xs text-red-500 font-medium italic">Failed to load image</div>';
              }}
            />
          </a>
        );
      }

      if (isAudio) {
        return (
          <div className="mt-3 min-w-[260px]">
            <audio controls preload="metadata" className="w-full">
              <source src={url} />
              Your browser does not support audio playback.
            </audio>
          </div>
        );
      }

      if (isVideo) {
        return (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-black ring-1 ring-black/5">
            <video
              src={url}
              controls
              preload="metadata"
              className="max-h-[340px] max-w-full object-contain"
            >
              Your browser does not support video playback.
            </video>
          </div>
        );
      }

      if (isDocument) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download={fileName}
            className="mt-3 flex min-w-[260px] items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left ring-1 ring-black/5 transition hover:border-gray-300"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
              <FileText size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wide text-[#64748b]">Document</span>
              <span className="block truncate text-sm font-bold text-[#1f2937]">{fileName}</span>
            </span>
          </a>
        );
      }

      return (
        <a href={url} target="_blank" rel="noreferrer" download={fileName} className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#1f2937] ring-1 ring-black/5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6ff] text-[#1164a3]">
            <Paperclip size={18} />
          </span>
          <span className="max-w-[220px] truncate">{fileName}</span>
        </a>
      );
    }
    return <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>;
  };

  const isMine = String(message.senderId) === String(currentUser?.id);
  const senderAvatar = isMine ? currentUser?.avatarUrl : message.senderAvatar;
  const readBy = message.readBy || [];
  const visibleSeenReaders = readBy.slice(0, 2);
  const additionalSeenCount = Math.max(readBy.length - visibleSeenReaders.length, 0);
  const participantPool = Array.isArray(participants) ? participants : [];
  const unseenReaders = participantPool.filter((participant) => {
    if (!participant?.id) return false;
    if (String(participant.id) === String(message.senderId)) return false;
    return !readBy.some((reader) => String(reader.id) === String(participant.id));
  });
  const replySenderLabel = String(message.replyToSenderName) === String(currentUser?.displayName)
    ? 'You'
    : message.replyToSenderName;
  const isFileMessage = ['FILE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(message.type);
  const isSystemMessage = message.type === 'SYSTEM';

  if (isSystemMessage) {
    return (
      <div className="px-4 py-2 text-center">
        <span className="inline-block text-[12px] font-semibold tracking-tight text-[#2b2b2b]">
          {message.content}
        </span>
      </div>
    );
  }

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
            <span
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-900 shadow-sm border border-white"
              title={message.pinnedByName ? `Pinned by ${message.pinnedByName}` : 'Pinned message'}
            >
              <Pin size={6} fill="currentColor" />
            </span>
          )}
        </div>

        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2">
            {!isMine && <div className="truncate text-[11px] font-bold text-gray-900">{message.senderName}</div>}
          </div>

          <div className={`mt-0.5 relative inline-block text-[14px] tracking-tight leading-relaxed ${message.reactions?.length > 0 ? 'pb-3' : ''} ${isFileMessage ? 'bg-transparent px-0 py-0' : `px-4 py-2 rounded-[22px] shadow-sm ring-1 ${isMine ? 'bg-gradient-to-br from-[#4a154b] to-[#611f69] text-white ring-[#4a154b]/30' : 'bg-white text-gray-800 ring-black/5'}`}`}>
            {isSelected && showReactionPicker && (
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
                {message.replyToMessageId && (
                  <div className={`mb-2 rounded-2xl border-l-4 px-3 py-2 text-xs ${isFileMessage ? 'border-[#1164a3] bg-gray-50 text-slate-600' : isMine ? 'border-white/50 bg-white/10 text-purple-100' : 'border-[#1164a3] bg-[#f8fbff] text-slate-600'}`}>
                    <div className={`font-bold ${isFileMessage ? 'text-[#1164a3]' : isMine ? 'text-white' : 'text-[#1164a3]'}`}>{replySenderLabel}</div>
                    <div className="truncate">{message.replyToContent || 'Attachment'}</div>
                  </div>
                )}
                {renderMessageContent()}
              </div>
              <div className={`inline-flex items-center gap-1 shrink-0 ${isFileMessage ? 'mt-2 text-[10px]' : 'mb-[-2px] text-[9px]'} font-bold ${isFileMessage ? 'text-gray-400' : isMine ? 'text-purple-200/80' : 'text-gray-400/80'} select-none`}>
                {formatJustTime(message.sentAt)}
              </div>
            </div>
          </div>

          {message.reactions?.length > 0 && (
            <div className={`-mt-2 flex flex-wrap px-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
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
                  className="group relative flex items-center px-1 py-0.5 rounded-full text-[11px] font-bold text-gray-700 transition-smooth hover:z-10 hover:scale-105 active:scale-95"
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

          {isMine && readBy.length > 0 && (
            <div className="group/seen relative mt-1 flex items-center justify-end">
              <span className="mr-2 text-[10px] italic text-[#6b6a6b]">
                Seen by
              </span>
              <div className="flex -space-x-2">
                {visibleSeenReaders.map((reader) => (
                  <div
                    key={reader.id}
                    className="h-5 w-5 overflow-hidden rounded-full border border-white bg-[#e9dff0] shadow-sm"
                    title={reader.displayName}
                  >
                    {reader.avatarUrl ? (
                      <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-[#3f0e40]">
                        {reader.displayName?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                  </div>
                ))}
                {additionalSeenCount > 0 && (
                  <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white bg-[#3f0e40] px-1 text-[9px] font-bold text-white shadow-sm">
                    +{additionalSeenCount}
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden min-w-[220px] rounded-xl border border-black/5 bg-white p-3 text-left shadow-xl group-hover/seen:block">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Seen ({readBy.length})
                </div>
                <div className="space-y-2">
                  {readBy.map((reader) => (
                    <div key={reader.id} className="flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-full bg-[#e9dff0]">
                        {reader.avatarUrl ? (
                          <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#3f0e40]">
                            {reader.displayName?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 text-xs font-medium text-gray-700">
                        {reader.displayName}
                      </div>
                    </div>
                  ))}
                </div>
                {unseenReaders.length > 0 && (
                  <>
                    <div className="my-3 border-t border-gray-100" />
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Unseen ({unseenReaders.length})
                    </div>
                    <div className="space-y-2">
                      {unseenReaders.map((reader) => (
                        <div key={reader.id} className="flex items-center gap-2">
                          <div className="h-7 w-7 overflow-hidden rounded-full bg-[#e9dff0]">
                            {reader.avatarUrl ? (
                              <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#3f0e40]">
                                {reader.displayName?.[0]?.toUpperCase() ?? 'U'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 text-xs font-medium text-gray-700">
                            {reader.displayName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
