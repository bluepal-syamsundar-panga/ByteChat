import { MoreVertical, Reply, Trash2, Users, LogOut, Pin, Pencil, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupDmService from '../../services/groupDmService';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useToastStore from '../../store/toastStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupInviteModal from './GroupInviteModal';
import GroupInfoDrawer from './GroupInfoDrawer';
import Modal from '../Shared/Modal';

const GroupDMChatWindow = ({ group }) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { addToast } = useToastStore();
  const {
    groupMessages,
    setGroupMessages,
    setActiveThread,
    clearGroupUnread,
    setNotifications,
    setGroupConversations,
    upsertGroupMessage,
    removeGroupMessage,
  } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const menuRef = useRef(null);
  const scrollRef = useRef(null);

  const thread = groupMessages[group?.id] ?? [];
  const members = group?.members || [];
  const selectedMessage = useMemo(
    () => thread.find((message) => message.id === selectedMessageId && !message.isDeleted) ?? null,
    [thread, selectedMessageId]
  );
  const isCreator = String(group?.createdBy?.id) === String(currentUser?.id);

  const scrollToBottom = (behavior = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!group?.id) {
      return;
    }

    let mounted = true;
    setActiveThread({ type: 'group', id: group.id });

    async function loadConversation() {
      try {
        setLoading(true);
        const [messagesResponse, groupResponse] = await Promise.all([
          groupDmService.getMessages(group.id),
          groupDmService.getGroup(group.id),
        ]);
        if (!mounted) {
          return;
        }

        const messagesData = messagesResponse.data || [];
        const nextMessages = [...(messagesData.content ?? messagesData ?? [])].reverse();
        const freshGroup = groupResponse.data || group;

        setGroupMessages(group.id, nextMessages);
        setGroupConversations((prev) =>
          prev.map((item) => (String(item.id) === String(freshGroup.id) ? freshGroup : item))
        );
        await groupDmService.markAsRead(group.id);
        clearGroupUnread(group.id);
        setNotifications((prev) =>
          prev.filter(
            (notification) =>
              !(notification.type === 'GROUP_DIRECT_MESSAGE' && String(notification.relatedEntityId) === String(group.id))
          )
        );
        setTimeout(() => scrollToBottom('auto'), 50);
      } catch (error) {
        console.error('Failed to load group conversation', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConversation();

    return () => {
      mounted = false;
      setActiveThread(null);
    };
  }, [group?.id, setActiveThread, setGroupMessages, clearGroupUnread, setNotifications, setGroupConversations]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!group?.id || loading) {
      return;
    }

    clearGroupUnread(group.id);
    setNotifications((prev) =>
      prev.filter(
        (notification) =>
          !(notification.type === 'GROUP_DIRECT_MESSAGE' && String(notification.relatedEntityId) === String(group.id))
      )
    );
    setTimeout(() => scrollToBottom(thread.length > 0 ? 'smooth' : 'auto'), 50);
  }, [group?.id, thread, loading, clearGroupUnread, setNotifications]);

  const refreshGroup = async () => {
    if (!group?.id) {
      return;
    }

    try {
      const response = await groupDmService.getGroup(group.id);
      const freshGroup = response.data || null;
      if (freshGroup) {
        setGroupConversations((prev) =>
          prev.map((item) => (String(item.id) === String(freshGroup.id) ? freshGroup : item))
        );
      }
    } catch (error) {
      console.error('Failed to refresh group conversation', error);
    }
  };

  const handleSend = async (content, file) => {
    try {
      let fileUrl = null;
      let fileType = 'FILE';

      if (file) {
        const chatService = (await import('../../services/chatService')).default;
        const resp = await chatService.uploadFile(file);
        const attachment = resp?.data ?? resp;
        fileUrl = attachment?.fileUrl ?? attachment?.url ?? null;
        if (file.type?.startsWith('video/')) fileType = 'VIDEO';
        else if (file.type?.startsWith('audio/')) fileType = 'AUDIO';
        else if (!file.type?.startsWith('image/')) fileType = 'DOCUMENT';
      }

      if (fileUrl) {
        await groupDmService.sendMessage(group.id, { content: fileUrl, type: fileType });
      }

      if (content?.trim()) {
        await groupDmService.sendMessage(group.id, { content, type: 'TEXT', replyToMessageId: replyTarget?.id ?? null });
      }

      setReplyTarget(null);
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (error) {
      console.error('Failed to send group message', error);
      addToast('Failed to send group message', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await groupDmService.leaveGroup(group.id);
      setGroupConversations((prev) => prev.filter((item) => String(item.id) !== String(group.id)));
      addToast('Left group conversation', 'success');
      navigate(activeWorkspaceIdPath(group?.workspaceId));
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to leave group', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await groupDmService.deleteGroup(group.id);
      setGroupConversations((prev) => prev.filter((item) => String(item.id) !== String(group.id)));
      addToast('Group conversation deleted', 'success');
      navigate(activeWorkspaceIdPath(group?.workspaceId));
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete group', 'error');
    } finally {
      setShowDeleteGroupModal(false);
    }
  };

  const handleInviteModalClose = async (didInvite) => {
    setShowInviteModal(false);
    if (didInvite) {
      await refreshGroup();
    }
  };

  const membersLabel = `${group?.memberCount ?? members.length ?? 0} members`;
  const pinnedMessages = useMemo(() => thread.filter((message) => message.isPinned), [thread]);
  const latestPinnedMessage = pinnedMessages[pinnedMessages.length - 1] ?? null;

  if (!group?.id) {
    return null;
  }

  const handleEdit = (message) => {
    setEditTarget(message);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditTarget(null);
    setEditContent('');
  };

  const confirmEditMessage = async (content) => {
    if (!editTarget || !content.trim() || content === editTarget.content) {
      cancelEdit();
      return;
    }

    try {
      const response = await groupDmService.editMessage(editTarget.id, content.trim());
      upsertGroupMessage(group.id, response.data || response);
      addToast('Message updated', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to edit message', 'error');
    } finally {
      cancelEdit();
    }
  };

  const handleDelete = (message) => {
    setDeleteTarget(message);
    setShowDeleteMessageModal(true);
  };

  const confirmDeleteMessage = async (scope = 'everyone') => {
    if (!deleteTarget) {
      return;
    }

    try {
      const response = await groupDmService.deleteMessage(deleteTarget.id, scope);
      if (scope === 'self') {
        removeGroupMessage(group.id, deleteTarget.id);
        addToast('Message removed from your view', 'success');
      } else {
        upsertGroupMessage(group.id, response.data || response);
        addToast('Message deleted', 'success');
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete message', 'error');
    } finally {
      setShowDeleteMessageModal(false);
      setDeleteTarget(null);
    }
  };

  const handlePin = async (message) => {
    try {
      const response = await groupDmService.pinMessage(message.id);
      upsertGroupMessage(group.id, response.data || response);
      const updatedMessage = response.data || response;
      addToast(updatedMessage?.isPinned ? 'Message pinned' : 'Message unpinned', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update pin', 'error');
    }
  };

  const handleReact = async (message, emoji) => {
    if (!emoji) {
      return;
    }

    try {
      const response = await groupDmService.reactToMessage(message.id, emoji);
      upsertGroupMessage(group.id, response.data || response);
      setSelectedMessageId(null);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to react to group message', error);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/50 px-8 py-2.5 backdrop-blur-md transition-all duration-300">
        <div className="flex cursor-pointer items-center gap-3 select-none" onClick={() => setShowGroupInfo(true)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3f0e40]/10 text-[#3f0e40]">
            <Users size={16} />
          </div>
          <div>
            <div className="text-[17px] leading-none tracking-tight text-gray-900">{group.name}</div>
            <div className="mt-1 text-[10px] font-bold text-[#3f0e40]">{membersLabel} • Click for info</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="hidden h-8 items-center justify-center gap-2 rounded-full bg-[#3f0e40] px-3.5 text-xs font-bold text-white sm:flex"
          >
            <Users size={14} />
            <span>Invite</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-smooth ${
                showMenu ? 'bg-black/5 text-gray-900' : 'text-gray-400 hover:bg-black/5 hover:text-gray-900'
              }`}
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-3 w-56 border border-black/5 bg-white py-2 shadow-2xl">
                {selectedMessage ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTarget(selectedMessage);
                        setShowMenu(false);
                        setSelectedMessageId(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                    >
                      <Reply size={16} className="text-[#6b6a6b]" />
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handlePin(selectedMessage);
                        setShowMenu(false);
                        setSelectedMessageId(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                    >
                      <Pin size={16} className="text-[#6b6a6b]" />
                      {selectedMessage.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    {selectedMessage.senderId === currentUser?.id && !selectedMessage.isDeleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            handleEdit(selectedMessage);
                            setShowMenu(false);
                            setSelectedMessageId(null);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                        >
                          <Pencil size={16} className="text-[#6b6a6b]" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDelete(selectedMessage);
                            setShowMenu(false);
                            setSelectedMessageId(null);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#e01e5a] transition hover:bg-[#e01e5a]/10"
                        >
                          <Trash2 size={16} className="text-[#e01e5a]" />
                          Delete
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(true);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5 sm:hidden"
                    >
                      <Users size={16} className="text-[#6b6a6b]" />
                      Invite member
                    </button>

                    {!isCreator && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          handleLeaveGroup();
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#1d1c1d] transition hover:bg-black/5"
                      >
                        <LogOut size={16} className="text-[#6b6a6b]" />
                        Leave group
                      </button>
                    )}

                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteGroupModal(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[#e01e5a] transition hover:bg-[#e01e5a]/10"
                      >
                        <Trash2 size={16} className="text-[#e01e5a]" />
                        Delete group
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 pt-4 md:px-8" />

      {latestPinnedMessage && (
        <div className="px-6 pb-3 md:px-8">
          <div className="flex items-center gap-2 rounded-2xl border border-[#f2e7b5] bg-[#fffbea] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3bf] text-[#8c5b00]">
              <Pin size={14} />
            </div>
            <button
              type="button"
              onClick={() => setSelectedMessageId(latestPinnedMessage.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm text-[#4b4a4b]">
                {latestPinnedMessage.content?.trim() || 'Pinned attachment'}
              </p>
            </button>
            <button
              type="button"
              onClick={() => handlePin(latestPinnedMessage)}
              className="rounded-full p-1.5 text-[#8c5b00] transition hover:bg-[#fff3bf]"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 md:px-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#6b6a6b]">Loading group conversation...</div>
        ) : thread.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="text-2xl font-black tracking-tight text-gray-900">No messages yet</div>
            <div className="mt-3 max-w-sm font-medium leading-relaxed text-gray-500">
              Start the private group conversation.
            </div>
            <button
              type="button"
              onClick={() => handleSend('Hello everyone,')}
              className="mt-8 bg-[#2c0b2d] px-6 py-3 font-bold text-white transition-smooth hover:bg-[#1a061b]"
            >
              Say Hello!
            </button>
          </div>
        ) : (
          thread.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              participants={members}
              isSelected={!message.isDeleted && selectedMessageId === message.id}
              onClick={() => {
                if (message.isDeleted) {
                  setSelectedMessageId(null);
                  setShowMenu(false);
                  return;
                }
                setSelectedMessageId((prev) => (prev === message.id ? null : message.id));
                setShowMenu(false);
              }}
              onReact={(emoji) => handleReact(message, emoji)}
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <MessageInput
        placeholder={`Message ${group.name}`}
        onSendMessage={editTarget ? confirmEditMessage : handleSend}
        disabled={false}
        mentionSuggestions={members}
        currentUserId={currentUser?.id}
        editMode={Boolean(editTarget)}
        editValue={editContent}
        onCancelEdit={cancelEdit}
        editLabel={editTarget?.content}
        submitLabel="Save"
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
      />

      <GroupInviteModal
        isOpen={showInviteModal}
        onClose={handleInviteModalClose}
        group={group}
      />

      <GroupInfoDrawer
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        group={group}
        onMemberRemoved={(userId) => {
          setGroupConversations((prev) =>
            prev.map((item) => {
              if (String(item.id) !== String(group.id)) {
                return item;
              }
              const nextMembers = (item.members || []).filter((member) => String(member.id) !== String(userId));
              return {
                ...item,
                members: nextMembers,
                memberCount: nextMembers.length,
              };
            })
          );
        }}
      />

      <Modal
        isOpen={showDeleteGroupModal}
        onClose={() => setShowDeleteGroupModal(false)}
        title="Delete group?"
        rounded="rounded-none"
      >
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-[#6b6a6b]">
            Deleting this group will remove it for every member.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteGroupModal(false)}
              className="px-5 py-2.5 text-sm font-bold text-[#6b6a6b] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteGroup}
              className="bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
            >
              Delete group
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteMessageModal}
        onClose={() => setShowDeleteMessageModal(false)}
        title="Delete message?"
        rounded="rounded-none"
      >
        <div className="p-1">
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            Choose how you want to delete this message.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => confirmDeleteMessage('self')}
              className="w-full border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Delete from me
            </button>
            {deleteTarget?.senderId === currentUser?.id && (
              <button
                type="button"
                onClick={() => confirmDeleteMessage('everyone')}
                className="w-full bg-red-600 px-4 py-3 text-left text-sm font-bold text-white transition-all hover:bg-red-700"
              >
                Delete from everyone
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteMessageModal(false)}
              className="w-full border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

function activeWorkspaceIdPath(workspaceId) {
  return workspaceId ? `/chat/workspace/${workspaceId}` : '/';
}

export default GroupDMChatWindow;
