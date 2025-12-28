import { apiFetch } from './client';

export interface AdminChatThread {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  patient_email: string | null;
  patient_name: string | null;
}

export interface AdminChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'patient' | 'admin';
  body: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

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

export async function fetchChatThreads(
  page?: number,
  pageSize?: number
): Promise<{ data: AdminChatThread[] }> {
  const params = new URLSearchParams();

  if (page && page > 0) {
    params.set('page', String(page));
  }
  if (pageSize && pageSize > 0) {
    params.set('pageSize', String(pageSize));
  }

  const query = params.toString();
  const path = query ? `/admin/chat/threads?${query}` : '/admin/chat/threads';

  return apiFetch<{ data: AdminChatThread[] }>(path, { method: 'GET' });
}

export async function fetchChatMessages(
  threadId: string,
  limit = 100
): Promise<{ data: AdminChatMessage[] }> {
  const params = new URLSearchParams({ threadId, limit: String(limit) });
  return apiFetch<{ data: AdminChatMessage[] }>(
    `/admin/chat/messages?${params.toString()}`,
    { method: 'GET' }
  );
}

export async function sendAdminChatMessageApi(input: {
  patientId: string;
  body: string;
}): Promise<{ data: { thread: AdminChatThread; message: AdminChatMessage } }> {
  return apiFetch<{ data: { thread: AdminChatThread; message: AdminChatMessage } }>(
    '/admin/chat/messages',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
}

export async function fetchChatNotifications(): Promise<{ data: AdminNotification[] }> {
  return apiFetch<{ data: AdminNotification[] }>('/admin/notifications?type=chat', {
    method: 'GET'
  });
}

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
