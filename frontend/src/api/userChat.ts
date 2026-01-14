import { apiFetch } from './client';
import type { ChatThread, ChatMessage } from '@outlive/shared';

// Re-export types for convenience
export type { ChatThread, ChatMessage };

/**
 * Fetch current user's chat messages
 */
export async function fetchUserChatMessages(
  limit = 100
): Promise<{ data: { messages: ChatMessage[]; thread: ChatThread } }> {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch<{ data: { messages: ChatMessage[]; thread: ChatThread } }>(
    `/user/chat/messages?${params.toString()}`,
    { method: 'GET' }
  );
}

/**
 * Send a message as the current user
 */
export async function sendUserChatMessage(
  content: string
): Promise<{ data: { message: ChatMessage; thread: ChatThread } }> {
  return apiFetch<{ data: { message: ChatMessage; thread: ChatThread } }>(
    '/user/chat/messages',
    {
      method: 'POST',
      body: JSON.stringify({ content })
    }
  );
}

/**
 * Mark admin messages as read by the current user
 */
export async function markUserMessagesAsRead(): Promise<{ data: { updated_count: number } }> {
  return apiFetch<{ data: { updated_count: number } }>(
    '/user/chat/read',
    { method: 'POST' }
  );
}
