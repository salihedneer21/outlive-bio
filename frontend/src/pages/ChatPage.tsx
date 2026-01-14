import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchChatMessages,
  fetchChatThreads,
  type ChatThreadWithDetails,
  type ChatMessage
} from '@/api/chat';
import {
  useAdminSocket,
  useSocketEvent,
  type NewMessageEvent,
  type NewUserMessageEvent,
  type UserTypingEvent,
  type UnreadCountUpdateEvent
} from '@/socket/AdminSocketContext';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Message01Icon,
  Search01Icon,
  SentIcon
} from '@hugeicons/core-free-icons';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatMessageTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const ThreadListSkeleton: React.FC = () => (
  <div className="space-y-1 p-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-3 w-8" />
      </div>
    ))}
  </div>
);

const MessagesSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
          <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-2xl`} />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    ))}
  </div>
);

export const ChatPage: React.FC = () => {
  const [threads, setThreads] = useState<ChatThreadWithDetails[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThreadWithDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, { email: string; timeout: ReturnType<typeof setTimeout> }>>(new Map());

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevThreadRef = useRef<string | null>(null);

  const {
    isConnected,
    joinThread,
    leaveThread,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    markAsRead
  } = useAdminSocket();

  // Keep refs for state that socket handlers need to access
  const selectedThreadRef = useRef<ChatThreadWithDetails | null>(null);
  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load threads
  const loadThreads = useCallback(async () => {
    try {
      setThreadsLoading(true);
      const res = await fetchChatThreads(1, 100);
      setThreads(res.data.threads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  // Load messages for selected thread
  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setMessagesLoading(true);
      setError(null);
      const res = await fetchChatMessages(threadId, 200);
      setMessages(res.data.messages ?? []);

      // Mark messages as read when opening thread via socket
      markAsRead(threadId);

      // Update unread count in thread list
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, unread_count: 0 } : t
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [markAsRead]);

  // Initial load
  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  // Load messages when thread is selected
  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedThread.id);
  }, [selectedThread, loadMessages]);

  // Join/leave thread rooms when selecting threads
  useEffect(() => {
    if (prevThreadRef.current && prevThreadRef.current !== selectedThread?.id) {
      leaveThread(prevThreadRef.current);
    }

    if (selectedThread) {
      joinThread(selectedThread.id);
      prevThreadRef.current = selectedThread.id;
    } else {
      prevThreadRef.current = null;
    }
  }, [selectedThread, joinThread, leaveThread]);

  // Subscribe to socket events for real-time updates using stable hooks
  useSocketEvent<NewMessageEvent>('new_message', (event) => {
    const newMsg = event.message;
    const currentThread = selectedThreadRef.current;

    if (currentThread && newMsg.thread_id === currentThread.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // If user sent a message, mark as read immediately since we're viewing
      if (newMsg.sender_type === 'user') {
        markAsRead(currentThread.id);
      }
    }

    // Update thread preview
    setThreads((prev) =>
      prev.map((t) =>
        t.id === newMsg.thread_id
          ? {
              ...t,
              last_message_at: newMsg.created_at,
              last_message: newMsg.content?.substring(0, 100) || '',
              unread_count: currentThread?.id === newMsg.thread_id ? 0 : t.unread_count
            }
          : t
      )
    );
  });

  useSocketEvent<NewUserMessageEvent>('new_user_message', (event) => {
    const { threadId, message } = event;
    const currentThread = selectedThreadRef.current;

    // Update unread count if not viewing this thread
    if (currentThread?.id !== threadId) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                unread_count: t.unread_count + 1,
                last_message_at: message.created_at,
                last_message: message.content?.substring(0, 100) || ''
              }
            : t
        )
      );
    }
  });

  useSocketEvent<UserTypingEvent>('user_typing', (event) => {
    const { threadId, userId, email, isTyping } = event;
    const currentThread = selectedThreadRef.current;
    if (currentThread?.id !== threadId) return;

    setTypingUsers((prev) => {
      const updated = new Map(prev);
      if (isTyping) {
        // Clear existing timeout if any
        const existing = updated.get(userId);
        if (existing) clearTimeout(existing.timeout);

        // Set timeout to auto-clear typing status (4s to handle network latency)
        const timeout = setTimeout(() => {
          setTypingUsers((p) => {
            const u = new Map(p);
            u.delete(userId);
            return u;
          });
        }, 4000);

        updated.set(userId, { email, timeout });
      } else {
        const existing = updated.get(userId);
        if (existing) clearTimeout(existing.timeout);
        updated.delete(userId);
      }
      return updated;
    });
  });

  useSocketEvent<UnreadCountUpdateEvent>('unread_count_update', (event) => {
    const { threadId, unreadCount } = event;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, unread_count: unreadCount } : t
      )
    );
  });

  // Auto-scroll when messages change or typing indicator appears
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, typingUsers.size]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Typing indicator handling
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!selectedThread) return;

    // Send typing start
    startTyping(selectedThread.id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to send typing stop
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedThread) {
        stopTyping(selectedThread.id);
      }
    }, 2000);
  };

  const handleSend = () => {
    if (!selectedThread) {
      setError('No thread selected');
      return;
    }
    const text = input.trim();
    if (!text) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(selectedThread.id);

    setSending(true);
    setError(null);

    // Send via socket - the socket handler will add the message to state via onNewMessage
    sendSocketMessage(selectedThread.id, text);

    // Clear input immediately for better UX
    setInput('');

    // Reset sending state after a short delay (socket doesn't return acknowledgment)
    setTimeout(() => setSending(false), 500);
  };

  // Filter threads by search
  const filteredThreads = threads.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.user_name?.toLowerCase().includes(q) ||
      t.user_email?.toLowerCase().includes(q) ||
      t.last_message?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q)
    );
  });

  // Sort threads by last message (already sorted by API, but ensure consistency)
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    const aTime = a.last_message_at || a.updated_at;
    const bTime = b.last_message_at || b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col lg:h-[calc(100vh-40px)]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
          Messages
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Chat with patients in real-time
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {/* Thread List - Left Sidebar */}
        <div className="flex w-80 flex-shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
          {/* Search */}
          <div className="border-b border-neutral-100 p-3 dark:border-neutral-800">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <ThreadListSkeleton />
            ) : sortedThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <HugeiconsIcon icon={Message01Icon} size={24} className="text-neutral-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {searchQuery ? 'No matches found' : 'No conversations yet'}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {searchQuery ? 'Try a different search term' : 'Conversations will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {sortedThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      selectedThread?.id === thread.id
                        ? 'bg-neutral-100 dark:bg-neutral-800'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fdb482] to-[#ff7c66] text-white">
                        <span className="text-sm font-semibold">
                          {(thread.user_name || thread.user_email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      {/* Unread badge */}
                      {thread.unread_count > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {thread.unread_count > 9 ? '9+' : thread.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-sm font-medium ${
                          thread.unread_count > 0
                            ? 'text-neutral-900 dark:text-neutral-50'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {thread.user_name || thread.user_email || 'Unknown User'}
                        </p>
                        <span className="ml-2 flex-shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
                          {thread.last_message_at ? formatDate(thread.last_message_at) : ''}
                        </span>
                      </div>
                      <p className={`mt-0.5 truncate text-xs ${
                        thread.unread_count > 0
                          ? 'font-medium text-neutral-700 dark:text-neutral-300'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {thread.last_message || thread.subject || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - Right */}
        <div className="flex flex-1 flex-col">
          {!selectedThread ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <HugeiconsIcon icon={Message01Icon} size={32} className="text-neutral-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Select a conversation
              </p>
              <p className="mt-1 max-w-[240px] text-xs text-neutral-500 dark:text-neutral-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fdb482] to-[#ff7c66] text-white">
                  <span className="text-sm font-semibold">
                    {(selectedThread.user_name || selectedThread.user_email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {selectedThread.user_name || 'Unknown User'}
                  </h3>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedThread.user_email || selectedThread.subject || selectedThread.user_id}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isConnected ? 'Live' : 'Connecting...'}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
                {messagesLoading ? (
                  <MessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <HugeiconsIcon icon={Message01Icon} size={24} className="text-neutral-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      No messages yet
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Start the conversation below
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {messages.map((m) => {
                      const isAdmin = m.sender_type === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                            {!isAdmin && (
                              <div className="mb-1 flex items-center gap-1.5 pl-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                                <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                  User
                                </span>
                              </div>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${
                                isAdmin
                                  ? 'rounded-br-md bg-gradient-to-r from-[#fdb482] to-[#ff7c66] text-white'
                                  : 'rounded-bl-md border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
                              }`}
                            >
                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            </div>
                            <div className={`mt-1 px-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                {formatMessageTime(m.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Typing indicator - inline at bottom of messages */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%]">
                          <div className="mb-1 flex items-center gap-1.5 pl-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                              User
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0ms' }} />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '150ms' }} />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-2 dark:border-red-900/50 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="ml-auto text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      rows={1}
                      className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:bg-neutral-800 dark:focus:ring-neutral-100/5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !input.trim()}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#fdb482] to-[#ff7c66] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <HugeiconsIcon icon={SentIcon} size={18} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
