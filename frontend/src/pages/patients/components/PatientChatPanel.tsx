import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminPatient } from '@outlive/shared';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/api/supabaseClient';
import {
  fetchChatMessages,
  fetchChatThreads,
  sendAdminChatMessageApi,
  type AdminChatMessage
} from '@/api/chat';

interface PatientChatPanelProps {
  patient: AdminPatient | null;
}

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

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description
}) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
      {icon}
    </div>
    <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</p>
    <p className="mt-1 max-w-[200px] text-xs text-neutral-500 dark:text-neutral-400">
      {description}
    </p>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-300" />
      <span className="text-xs text-neutral-500 dark:text-neutral-400">Loading messages...</span>
    </div>
  </div>
);

export const PatientChatPanel: React.FC<PatientChatPanelProps> = ({ patient }) => {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadMessages = useCallback(
    async (existingThreadId: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchChatMessages(existingThreadId, 200);
        setMessages(res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initialize thread for this patient
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!patient?.userId) {
        setThreadId(null);
        setMessages([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetchChatThreads(1, 200);
        const threads = res.data ?? [];
        const existingThread = threads.find((t) => t.patient_id === patient.userId) ?? null;

        if (cancelled) return;

        if (!existingThread) {
          setThreadId(null);
          setMessages([]);
          return;
        }

        setThreadId(existingThread.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [patient?.userId]);

  // Load messages when thread is known
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    void loadMessages(threadId);
  }, [threadId, loadMessages]);

  // Subscribe to Supabase realtime for this thread
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !threadId) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    const channel = supabase
      // Match patient app naming convention for easier debugging
      .channel(`chat_messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload: any) => {
          const newMsg = payload.new as AdminChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [threadId]);

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

  const handleSend = async () => {
    if (!patient?.userId) {
      setError('Patient user id is missing');
      return;
    }
    const text = input.trim();
    if (!text) return;

    try {
      setSending(true);
      setError(null);

      const res = await sendAdminChatMessageApi({
        patientId: patient.userId,
        body: text
      });

      setThreadId(res.data.thread.id);

      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.message.id)) return prev;
        return [...prev, res.data.message];
      });

      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!patient) {
    return (
      <EmptyState
        icon={
          <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        title="No patient selected"
        description="Select a patient to view their chat conversation"
      />
    );
  }

  if (!patient.userId) {
    return (
      <EmptyState
        icon={
          <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        title="Chat unavailable"
        description="This patient doesn't have a linked user account"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100">
          <svg className="h-4 w-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.938L3 20l1.352-3.157A7.829 7.829 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Concierge Chat
          </h3>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            Direct messages with patient
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
        {loading ? (
          <LoadingSpinner />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.938L3 20l1.352-3.157A7.829 7.829 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="No messages yet"
            description="Start the conversation by sending a message below"
          />
        ) : (
          <div className="space-y-3 p-4">
            {messages.map((m) => {
              const isAdmin = m.sender_role === 'admin';
              return (
                <div
                  key={m.id}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                    {!isAdmin && (
                      <div className="mb-1 flex items-center gap-1.5 pl-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Patient
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 ${
                        isAdmin
                          ? 'rounded-br-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                          : 'rounded-bl-md border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed">{m.body}</p>
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
              onChange={(e) => setInput(e.target.value)}
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
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
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
