import { Paperclip, SendHorizonal, SmilePlus, X } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({
  placeholder,
  onSendMessage,
  onTyping,
  onUploadFile,
  disabled,
  mentionSuggestions = [],
  currentUserId,
}) => {
  const [content, setContent] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const canSend = useMemo(() => (content.trim().length > 0 || pendingFile) && !disabled, [content, pendingFile, disabled]);
  
  const filteredSuggestions = useMemo(() => {
    const match = content.match(/@([A-Za-z0-9._-]*)$/);
    if (!match || !Array.isArray(mentionSuggestions)) return [];
    
    const query = match[1].toLowerCase();
    
    const baseSuggestions = mentionSuggestions.filter(m => m && String(m.id) !== String(currentUserId));

    if (!query) {
      return baseSuggestions.slice(0, 5);
    }
    
    return baseSuggestions
      .filter((member) => member.displayName?.toLowerCase().includes(query))
      .slice(0, 5);
  }, [content, mentionSuggestions, currentUserId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleEmojiClick(emojiData) {
    setContent((prev) => prev + emojiData.emoji);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      setPendingFile({
        file,
        name: file.name,
        isImage,
        previewUrl
      });
    }
    // reset input so the same file can be uploaded again if needed
    if (event.target) {
      event.target.value = '';
    }
  }

  function handleRemoveFile() {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
  }

  async function handleSubmit(event) {
    if (event) event.preventDefault();
    const value = content.trim();
    if (!value && !pendingFile) {
      return;
    }

    try {
      // Pass both content and the pending file to the parent handler
      await onSendMessage(value, pendingFile?.file);
      
      // Clear state after successful send
      setContent('');
      if (pendingFile?.previewUrl) {
        URL.revokeObjectURL(pendingFile.previewUrl);
      }
      setPendingFile(null);
      onTyping?.(false);
      
      // Reset textarea height
      const textarea = event.target.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  }

  function handleChange(event) {
    setContent(event.target.value);
    onTyping?.(event.target.value.trim().length > 0);
  }

  function handleSelectMention(member) {
    setContent((current) => current.replace(/@([A-Za-z0-9._-]*)$/, `@${member.displayName.replace(/\s+/g, '')} `));
  }

  return (
    <div className="border-t border-black/5 bg-white px-4 py-4 md:px-5">
      <div className="relative">
        {pendingFile && (
          <div className="mb-2 flex items-center gap-3 border border-black/10 bg-[#fbfbfb] p-2">
            {pendingFile.isImage && pendingFile.previewUrl ? (
              <div className="h-10 w-10 shrink-0 border border-black/5">
                <img src={pendingFile.previewUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black/5">
                <Paperclip size={16} className="text-[#6b6a6b]" />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-xs font-semibold text-[#1d1c1d]">{pendingFile.name}</div>
              <div className="text-[10px] text-[#6b6a6b]">Ready to send</div>
            </div>
            <button 
              type="button" 
              onClick={handleRemoveFile}
              className="p-1 text-[#6b6a6b] hover:bg-black/5 hover:text-[#e01e5a]"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {filteredSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm border border-black/8 bg-white p-2 shadow-lg">
            {filteredSuggestions.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMention(member)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-black/5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center bg-[#611f69] text-xs font-bold text-white">
                    {member.displayName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="font-medium text-[#1d1c1d]">{member.displayName}</span>
                </div>
                <span className="text-xs text-[#6b6a6b]">{member.email}</span>
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-3 border border-[#d8d8d8] bg-[#fbfbfb] p-2 pl-4 shadow-sm transition-colors focus-within:border-black/30 focus-within:bg-white">
          <textarea
            rows={1}
            value={content}
            onChange={handleChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            className="scrollbar-thin my-1.5 max-h-[120px] min-h-[24px] w-full resize-none bg-transparent text-sm text-[#1d1c1d] outline-none placeholder:text-[#6b6a6b]"
            style={{
              height: 'auto',
              minHeight: '24px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
          />
          <div className="mb-0.5 flex shrink-0 items-center gap-1 sm:gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[#6b6a6b] transition hover:bg-black/5 hover:text-[#1d1c1d]"
              title="Upload attachment"
              disabled={disabled}
            >
              <Paperclip size={18} />
            </button>
            
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 transition hover:bg-black/5 hover:text-[#1d1c1d] ${showEmojiPicker ? 'bg-black/5 text-[#1d1c1d]' : 'text-[#6b6a6b]'}`}
                title="Add emoji"
                disabled={disabled}
              >
                <SmilePlus size={18} />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50 shadow-xl border border-black/10 bg-white">
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick}
                    autoFocusSearch={false}
                    theme="light"
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSend}
              className="ml-1 flex h-9 w-9 items-center justify-center bg-[#3f0e40] text-white transition hover:bg-[#350d36] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#b0c9de]"
              title="Send message"
            >
              <SendHorizonal size={16} className={canSend ? 'ml-0.5' : ''} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
