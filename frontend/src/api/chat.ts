import { apiFetch } from './client';
import type {
  ChatThread,
  ChatMessage,
  ChatThreadWithDetails
} from '@outlive/shared';

// Re-export types for convenience
export type { ChatThread, ChatMessage, ChatThreadWithDetails };

export interface AdminNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  critical: boolean;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Fetch all chat threads with user info and unread counts
 */
export async function fetchChatThreads(
  page = 1,
  pageSize = 50
): Promise<{ data: { threads: ChatThreadWithDetails[]; total: number } }> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  return apiFetch<{ data: { threads: ChatThreadWithDetails[]; total: number } }>(
    `/admin/chat/threads?${params.toString()}`,
    { method: 'GET' }
  );
}

/**
 * Fetch messages for a specific thread
 */
export async function fetchChatMessages(
  threadId: string,
  limit = 100
): Promise<{ data: { messages: ChatMessage[]; thread: ChatThread } }> {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch<{ data: { messages: ChatMessage[]; thread: ChatThread } }>(
    `/admin/chat/threads/${threadId}/messages?${params.toString()}`,
    { method: 'GET' }
  );
}

/**
 * Send a message as admin to a thread
 */
export async function sendAdminChatMessageApi(input: {
  threadId: string;
  content: string;
}): Promise<{ data: { message: ChatMessage; thread: ChatThread } }> {
  return apiFetch<{ data: { message: ChatMessage; thread: ChatThread } }>(
    `/admin/chat/threads/${input.threadId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content: input.content })
    }
  );
}

/**
 * Mark all user messages in a thread as read
 */
export async function markMessagesAsReadApi(
  threadId: string
): Promise<{ data: { updated_count: number } }> {
  return apiFetch<{ data: { updated_count: number } }>(
    `/admin/chat/threads/${threadId}/read`,
    { method: 'POST' }
  );
}

/**
 * Fetch chat notifications
 */
export async function fetchChatNotifications(): Promise<{ data: AdminNotification[] }> {
  return apiFetch<{ data: AdminNotification[] }>('/admin/notifications?type=chat', {
    method: 'GET'
  });
}

/**
 * Fetch all notifications
 */
export async function fetchAllNotifications(
  page?: number,
  pageSize?: number
): Promise<{ data: AdminNotification[] }> {
  const params = new URLSearchParams();
  if (page && page > 0) {
    params.set('page', String(page));
  }
  if (pageSize && pageSize > 0) {
    params.set('pageSize', String(pageSize));
  }

  const query = params.toString();
  const path = query ? `/admin/notifications?${query}` : '/admin/notifications';

  return apiFetch<{ data: AdminNotification[] }>(path, {
    method: 'GET'
  });
}
