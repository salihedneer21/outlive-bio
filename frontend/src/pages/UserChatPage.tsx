import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useUserSocket,
  useUserSocketEvent,
  type NewMessageEvent,
  type UserTypingEvent
} from '@/socket/UserSocketContext';
import { fetchUserChatMessages, type ChatMessage } from '@/api/userChat';

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

const LoadingSpinner: React.FC = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-300" />
      <span className="text-xs text-neutral-500 dark:text-neutral-400">Loading messages...</span>
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
      <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.938L3 20l1.352-3.157A7.829 7.829 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
      Welcome to Concierge Chat
    </p>
    <p className="mt-1 max-w-[240px] text-xs text-neutral-500 dark:text-neutral-400">
      Send us a message and our team will get back to you shortly
    </p>
  </div>
);

export const UserChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [adminTyping, setAdminTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isConnected,
    thread,
    joinChat,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    markAsRead
  } = useUserSocket();

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load messages initially via REST API
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUserChatMessages(200);
      setMessages(res.data.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Join chat room when socket connects
  useEffect(() => {
    if (isConnected) {
      joinChat();
    }
  }, [isConnected, joinChat]);

  // Load messages on mount
  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (isConnected && thread) {
      markAsRead();
    }
  }, [isConnected, thread, markAsRead]);

  // Subscribe to new messages
  useUserSocketEvent<NewMessageEvent>('new_message', (event) => {
    const newMsg = event.message;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    // Mark as read if from admin
    if (newMsg.sender_type === 'admin') {
      markAsRead();
    }
  });

  // Subscribe to typing indicators
  useUserSocketEvent<UserTypingEvent>('user_typing', (event) => {
    if (event.senderType === 'admin') {
      setAdminTyping(event.isTyping);

      // Auto-clear typing after 3 seconds if no update
      if (event.isTyping) {
        setTimeout(() => setAdminTyping(false), 3000);
      }
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Typing indicator handling
  const handleInputChange = (value: string) => {
    setInput(value);

    // Send typing start
    startTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to send typing stop
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping();

    setSending(true);
    setError(null);

    // Send via socket
    sendSocketMessage(text);

    // Clear input immediately for better UX
    setInput('');

    // Reset sending state after a short delay
    setTimeout(() => setSending(false), 500);
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#fdb482] to-[#ff7c66]">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.938L3 20l1.352-3.157A7.829 7.829 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            Concierge Chat
          </h1>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            We typically reply within a few minutes
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {isConnected ? 'Online' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Typing indicator */}
      {adminTyping && (
        <div className="border-b border-neutral-100 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Concierge is typing...
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSpinner />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 p-4">
            {messages.map((m) => {
              const isUser = m.sender_type === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
                    {!isUser && (
                      <div className="mb-1 flex items-center gap-1.5 pl-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#fdb482] to-[#ff7c66]" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Concierge
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isUser
                          ? 'rounded-br-md bg-gradient-to-r from-[#fdb482] to-[#ff7c66] text-white'
                          : 'rounded-bl-md border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <div className={`mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {formatMessageTime(m.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
