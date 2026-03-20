import { Paperclip, SendHorizonal, SmilePlus, X, Plus, Image as ImageIcon, FileText, Video, Mic, Square, Trash2 } from 'lucide-react';
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
  editMode = false,
  editValue = '',
  onCancelEdit,
  editLabel,
  submitLabel = 'Save',
  replyTarget = null,
  onCancelReply,
}) => {
  const currentUserLabel = replyTarget && String(replyTarget.senderId) === String(currentUserId) ? 'You' : replyTarget?.senderName;
  const [content, setContent] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);
  const wasTypingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const shouldSaveRecordingRef = useRef(true);

  const canSend = useMemo(() => (content.trim().length > 0 || pendingFile) && !disabled, [content, pendingFile, disabled]);

  useEffect(() => {
    if (editMode) {
      setContent(editValue ?? '');
      return;
    }
    setContent('');
  }, [editMode, editValue]);
  
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
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => {
    if (wasTypingRef.current) {
      onTyping?.(false);
    }
  }, [onTyping]);

  useEffect(() => () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    window.clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stop?.();
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, [pendingFile]);

  function handleEmojiClick(emojiData) {
    setContent((prev) => prev + emojiData.emoji);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      if (pendingFile?.previewUrl) {
        URL.revokeObjectURL(pendingFile.previewUrl);
      }
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const previewUrl = (isImage || isVideo || isAudio) ? URL.createObjectURL(file) : null;
      setPendingFile({
        file,
        name: file.name,
        isImage,
        isVideo,
        isAudio,
        previewUrl
      });
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
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

  async function handleStartVoiceRecording() {
    if (disabled || editMode || pendingFile) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      shouldSaveRecordingRef.current = true;
      setRecordingSeconds(0);
      setIsRecordingVoice(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (shouldSaveRecordingRef.current && audioBlob.size > 0) {
          const extension = recorder.mimeType?.includes('ogg') ? 'ogg' : 'webm';
          const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${extension}`, { type: audioBlob.type });
          const previewUrl = URL.createObjectURL(audioBlob);
          setPendingFile({
            file: audioFile,
            name: 'Voice message',
            isImage: false,
            isVideo: false,
            isAudio: true,
            previewUrl,
          });
        }

        mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
        shouldSaveRecordingRef.current = true;
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        setIsRecordingVoice(false);
        setRecordingSeconds(0);
      };

      recorder.start();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Voice recording failed:', error);
      setIsRecordingVoice(false);
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function handleStopVoiceRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  function handleCancelVoiceRecording() {
    shouldSaveRecordingRef.current = false;
    recordingChunksRef.current = [];
    window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    setRecordingSeconds(0);
    setIsRecordingVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
    }
  }

  function formatRecordingTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
      if (wasTypingRef.current) {
        onTyping?.(false);
        wasTypingRef.current = false;
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  }

  function handleChange(event) {
    const nextValue = event.target.value;
    const nextIsTyping = nextValue.trim().length > 0;

    setContent(nextValue);
    onTyping?.(nextIsTyping);
    wasTypingRef.current = nextIsTyping;
  }

  function handleSelectMention(member) {
    setContent((current) => current.replace(/@([A-Za-z0-9._-]*)$/, `@${member.displayName.replace(/\s+/g, '')} `));
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 md:px-8">
      <div className="max-w-6xl mx-auto relative flex items-end gap-3">
        {/* Attachment menu button - LEFT side OUTSIDE */}
        <div className="relative mb-0.5" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-smooth ${
              showAttachMenu ? 'text-[#3f0e40]' : 'text-gray-400 hover:text-[#3f0e40]'
            }`}
          >
            <Plus size={22} className={`transition-transform duration-300 ${showAttachMenu ? 'rotate-45' : ''}`} />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-3 w-48 bg-white rounded-2xl shadow-2xl z-50 py-2 border border-black/5 animate-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                  setShowAttachMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <ImageIcon size={16} />
                </div>
                Images
              </button>
              <button 
                onClick={() => {
                  fileInputRef.current.accept = "video/*";
                  fileInputRef.current.click();
                  setShowAttachMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <Video size={16} />
                </div>
                Videos
              </button>
              <button 
                onClick={() => {
                  fileInputRef.current.accept = ".pdf,.doc,.docx,.txt";
                  fileInputRef.current.click();
                  setShowAttachMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                  <FileText size={16} />
                </div>
                Documents
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {editMode && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-[#d9f0dd] bg-[#edf9ef] px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-[#1f7a3d]">Editing message</div>
                <div className="truncate text-sm text-[#2f4f35]">{editLabel || 'Update your message'}</div>
              </div>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-full p-1.5 text-[#2f4f35] transition hover:bg-white/80"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {replyTarget && !editMode && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-[#d8e8ff] bg-[#f4f8ff] px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-[#1164a3]">Replying to {currentUserLabel}</div>
                <div className="truncate text-sm text-[#334155]">{replyTarget.content?.trim() || 'Attachment'}</div>
              </div>
              <button
                type="button"
                onClick={onCancelReply}
                className="rounded-full p-1.5 text-[#334155] transition hover:bg-white/80"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {pendingFile && (
            <div className="mb-2 flex items-center gap-3 border border-gray-100 bg-gray-50 p-2 rounded-xl shadow-sm animate-in slide-in-from-bottom-2 duration-300 overflow-hidden">
              {pendingFile.isImage && pendingFile.previewUrl ? (
                <div className="h-8 w-8 shrink-0 border border-black/5 rounded-lg overflow-hidden shadow-sm">
                  <img src={pendingFile.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : pendingFile.isVideo && pendingFile.previewUrl ? (
                <div className="h-8 w-8 shrink-0 border border-black/5 rounded-lg overflow-hidden shadow-sm bg-black">
                  <video src={pendingFile.previewUrl} className="h-full w-full object-cover" muted />
                </div>
              ) : pendingFile.isAudio && pendingFile.previewUrl ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-600 shadow-sm">
                    <Mic size={16} />
                  </div>
                  <audio controls src={pendingFile.previewUrl} className="h-8 max-w-[240px]" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-white rounded-lg border border-gray-100 text-blue-500 shadow-sm">
                  <Paperclip size={16} />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-xs font-bold text-gray-800">{pendingFile.name}</div>
              </div>
              <button 
                type="button" 
                onClick={handleRemoveFile}
                className="p-1.5 text-gray-400 hover:bg-white hover:text-red-500 rounded-lg transition-smooth"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="relative w-full">
            {isRecordingVoice && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <div className="text-sm font-bold text-[#7f1d1d]">Recording voice message</div>
                  <div className="text-sm font-semibold text-[#b91c1c]">{formatRecordingTime(recordingSeconds)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelVoiceRecording}
                    className="rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-red-500"
                    title="Discard recording"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleStopVoiceRecording}
                    className="rounded-full bg-[#b91c1c] p-2 text-white transition hover:bg-[#991b1b]"
                    title="Stop recording"
                  >
                    <Square size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            )}

            {filteredSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-4 w-full max-w-sm border border-black/8 bg-white p-2 shadow-lg rounded-xl overflow-hidden z-[60]">
                {filteredSuggestions.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectMention(member)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-black/5 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center bg-[#611f69] text-xs font-bold text-white rounded-md">
                        {member.displayName?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <span className="font-bold text-[#1d1c1d]">{member.displayName}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <form
              onSubmit={handleSubmit}
              className={`flex items-center border pl-5 pr-2 transition-smooth ring-2 ring-transparent focus-within:bg-white group/input ${
                editMode
                  ? 'rounded-3xl border-[#25d366]/40 bg-[#f6fff8] focus-within:border-[#25d366] focus-within:ring-[#25d366]/10'
                  : 'rounded-full border-gray-200 bg-gray-50/50 focus-within:border-[#3f0e40] focus-within:ring-[#3f0e40]/10'
              }`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={content}
                onChange={handleChange}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                onBlur={() => {
                  if (wasTypingRef.current) {
                    onTyping?.(false);
                    wasTypingRef.current = false;
                  }
                }}
                disabled={disabled}
                placeholder={editMode ? 'Edit your message' : placeholder}
                className="scrollbar-thin py-2 w-full resize-none bg-transparent text-[14px] font-medium text-gray-800 outline-none placeholder:text-gray-400 tracking-tight leading-normal"
                style={{
                  height: '36px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onInput={(e) => {
                  e.target.style.height = '36px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
              />
              <div className="flex shrink-0 items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden"
                />
                
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 transition-smooth hover:text-[#3f0e40] rounded-full ${showEmojiPicker ? 'text-[#3f0e40]' : 'text-gray-400'}`}
                    title="Add emoji"
                    disabled={disabled}
                  >
                    <SmilePlus size={18} />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-2xl border border-black/5 bg-white scale-100 animate-in slide-in-from-bottom-4 duration-300">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        autoFocusSearch={false}
                        theme="light"
                        width={300}
                        height={400}
                      />
                    </div>
                  )}
                </div>
                {!editMode && (
                  <button
                    type="button"
                    onClick={isRecordingVoice ? handleStopVoiceRecording : handleStartVoiceRecording}
                    className={`p-2 transition-smooth rounded-full ${
                      isRecordingVoice
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-400 hover:text-[#3f0e40]'
                    }`}
                    title={isRecordingVoice ? 'Stop recording' : 'Record voice message'}
                    disabled={disabled || Boolean(pendingFile)}
                  >
                    {isRecordingVoice ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                  </button>
                )}
                {editMode && (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="ml-1 mr-1 rounded-full px-3 py-2 text-sm font-bold text-gray-500 transition hover:bg-white hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Send button - RIGHT side OUTSIDE */}
        {editMode ? (
          <button
            onClick={handleSubmit}
            type="submit"
            disabled={!canSend}
            className={`mb-1 flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-bold text-white transition-smooth ${
              canSend ? 'bg-[#25d366] hover:scale-105 active:scale-95 shadow-lg shadow-[#25d366]/20' : 'bg-gray-200 cursor-not-allowed'
            }`}
            title="Save changes"
          >
            {submitLabel}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            type="submit"
            disabled={!canSend}
            className={`mb-1 flex h-10 w-10 shrink-0 items-center justify-center transition-smooth rounded-full ${
              canSend ? 'text-[#3f0e40] hover:scale-110 active:scale-95' : 'text-gray-200 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <SendHorizonal size={20} className={canSend ? 'ml-0.5' : ''} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
