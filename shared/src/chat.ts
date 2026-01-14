export interface ChatThread {
  id: string;
  user_id: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: string;
  read: boolean;
}

export interface ChatThreadWithDetails extends ChatThread {
  unread_count: number;
  user_email?: string;
  user_name?: string;
  last_message?: string;
  last_message_at?: string;
}

export interface SendMessagePayload {
  content: string;
}

export interface ChatThreadsResponse {
  threads: ChatThreadWithDetails[];
  total: number;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  thread: ChatThread;
}

export interface MarkReadResponse {
  updated_count: number;
}
