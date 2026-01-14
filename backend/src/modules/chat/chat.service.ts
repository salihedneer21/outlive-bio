import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  ChatThread,
  ChatMessage,
  ChatThreadWithDetails
} from '@outlive/shared';

/**
 * Get all chat threads with user info and unread count
 * Uses v2_chat_threads and v2_chat_messages tables
 */
export const getAdminChatThreads = async ({
  page = 1,
  pageSize = 50
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{ threads: ChatThreadWithDetails[]; total: number }> => {
  const supabase = getSupabaseServiceClient();

  const safePage = page > 0 ? page : 1;
  const safePageSize = pageSize > 0 ? Math.min(pageSize, 200) : 50;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  // Get all threads
  const { data: threadsData, error: threadsError, count } = await supabase
    .from('v2_chat_threads')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (threadsError) {
    throw new Error(threadsError.message);
  }

  const threads = (threadsData ?? []) as ChatThread[];

  if (threads.length === 0) {
    return { threads: [], total: count ?? 0 };
  }

  // Get user IDs to fetch user info
  const userIds = [...new Set(threads.map((t) => t.user_id).filter(Boolean))];

  // Fetch user emails from patients table
  const emailByUserId = new Map<string, string | null>();
  const nameByUserId = new Map<string, string | null>();

  if (userIds.length > 0) {
    // Get emails from patients table
    const { data: patientsData } = await supabase
      .from('patients')
      .select('user_id, email')
      .in('user_id', userIds);

    if (patientsData) {
      for (const row of patientsData as Array<{ user_id: string; email: string | null }>) {
        emailByUserId.set(row.user_id, row.email ?? null);
      }
    }

    // Get names from profile table
    const { data: profilesData } = await supabase
      .from('profile')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);

    if (profilesData) {
      for (const row of profilesData as Array<{
        user_id: string;
        first_name: string | null;
        last_name: string | null;
      }>) {
        const first = row.first_name ?? '';
        const last = row.last_name ?? '';
        const full = `${first} ${last}`.trim();
        nameByUserId.set(row.user_id, full || null);
      }
    }
  }

  // Get unread counts and last messages for each thread
  const threadIds = threads.map((t) => t.id);

  // Get unread counts (messages from users that admin hasn't read)
  const { data: unreadData } = await supabase
    .from('v2_chat_messages')
    .select('thread_id')
    .in('thread_id', threadIds)
    .eq('sender_type', 'user')
    .eq('read', false);

  const unreadCountByThread = new Map<string, number>();
  if (unreadData) {
    for (const row of unreadData as Array<{ thread_id: string }>) {
      unreadCountByThread.set(
        row.thread_id,
        (unreadCountByThread.get(row.thread_id) ?? 0) + 1
      );
    }
  }

  // Get last message for each thread
  const lastMessageByThread = new Map<string, { content: string; created_at: string }>();

  for (const threadId of threadIds) {
    const { data: lastMsgData } = await supabase
      .from('v2_chat_messages')
      .select('content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMsgData) {
      lastMessageByThread.set(threadId, {
        content: (lastMsgData as { content: string; created_at: string }).content,
        created_at: (lastMsgData as { content: string; created_at: string }).created_at
      });
    }
  }

  // Build response
  const threadsWithDetails: ChatThreadWithDetails[] = threads.map((t) => {
    const lastMsg = lastMessageByThread.get(t.id);
    return {
      ...t,
      unread_count: unreadCountByThread.get(t.id) ?? 0,
      user_email: emailByUserId.get(t.user_id) ?? undefined,
      user_name: nameByUserId.get(t.user_id) ?? undefined,
      last_message: lastMsg?.content?.substring(0, 100),
      last_message_at: lastMsg?.created_at
    };
  });

  // Sort by last_message_at or updated_at
  threadsWithDetails.sort((a, b) => {
    const aTime = a.last_message_at || a.updated_at;
    const bTime = b.last_message_at || b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return { threads: threadsWithDetails, total: count ?? 0 };
};

/**
 * Get thread by ID
 */
export const getThreadById = async (threadId: string): Promise<ChatThread | null> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('v2_chat_threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (error) {
    return null;
  }

  return data as ChatThread;
};

/**
 * Get messages for a specific thread
 */
export const getAdminChatMessages = async ({
  threadId,
  limit = 100
}: {
  threadId: string;
  limit?: number;
}): Promise<{ messages: ChatMessage[]; thread: ChatThread | null }> => {
  const supabase = getSupabaseServiceClient();

  // Get thread
  const { data: threadData, error: threadError } = await supabase
    .from('v2_chat_threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (threadError) {
    throw new Error(threadError.message);
  }

  // Get messages
  const { data: messagesData, error: messagesError } = await supabase
    .from('v2_chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  return {
    messages: (messagesData ?? []) as ChatMessage[],
    thread: threadData as ChatThread
  };
};

/**
 * Send a message as admin to a specific thread
 */
export const sendAdminChatMessage = async ({
  threadId,
  content,
  adminId
}: {
  threadId: string;
  content: string;
  adminId: string;
}): Promise<{ message: ChatMessage; thread: ChatThread }> => {
  const supabase = getSupabaseServiceClient();

  // Verify thread exists
  const { data: threadData, error: threadError } = await supabase
    .from('v2_chat_threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (threadError || !threadData) {
    throw new Error('Thread not found');
  }

  // Insert message
  const { data: messageData, error: messageError } = await supabase
    .from('v2_chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: adminId,
      sender_type: 'admin',
      content,
      read: false
    })
    .select('*')
    .single();

  if (messageError || !messageData) {
    throw new Error(messageError?.message ?? 'Failed to send message');
  }

  // Update thread's updated_at
  await supabase
    .from('v2_chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  return {
    message: messageData as ChatMessage,
    thread: threadData as ChatThread
  };
};

/**
 * Mark messages in a thread as read by admin
 * Only marks messages from users (sender_type = 'user') as read
 */
export const markMessagesAsRead = async ({
  threadId
}: {
  threadId: string;
}): Promise<{ updated_count: number }> => {
  const supabase = getSupabaseServiceClient();

  // Update all unread user messages in this thread
  const { data, error } = await supabase
    .from('v2_chat_messages')
    .update({ read: true })
    .eq('thread_id', threadId)
    .eq('sender_type', 'user')
    .eq('read', false)
    .select('id');

  if (error) {
    throw new Error(error.message);
  }

  return { updated_count: data?.length ?? 0 };
};

// ============================================================================
// USER CHAT FUNCTIONS
// ============================================================================

/**
 * Get or create a chat thread for a user
 */
export const getOrCreateUserThread = async (userId: string): Promise<ChatThread> => {
  const supabase = getSupabaseServiceClient();

  // Try to find existing thread - get the most recently updated one if multiple exist
  const { data: existingThreads, error: findError } = await supabase
    .from('v2_chat_threads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (findError) {
    throw new Error(findError.message);
  }

  if (existingThreads && existingThreads.length > 0) {
    return existingThreads[0] as ChatThread;
  }

  // Create new thread for user
  const { data: newThread, error: createError } = await supabase
    .from('v2_chat_threads')
    .insert({
      user_id: userId,
      subject: 'Support Chat'
    })
    .select('*')
    .single();

  if (createError || !newThread) {
    throw new Error(createError?.message ?? 'Failed to create chat thread');
  }

  return newThread as ChatThread;
};

/**
 * Get user's chat thread and messages
 */
export const getUserChatMessages = async ({
  userId,
  limit = 100
}: {
  userId: string;
  limit?: number;
}): Promise<{ messages: ChatMessage[]; thread: ChatThread }> => {
  const thread = await getOrCreateUserThread(userId);

  const supabase = getSupabaseServiceClient();

  const { data: messagesData, error: messagesError } = await supabase
    .from('v2_chat_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  return {
    messages: (messagesData ?? []) as ChatMessage[],
    thread
  };
};

/**
 * Send a message as user
 */
export const sendUserChatMessage = async ({
  userId,
  content
}: {
  userId: string;
  content: string;
}): Promise<{ message: ChatMessage; thread: ChatThread }> => {
  const supabase = getSupabaseServiceClient();

  // Get or create thread
  const thread = await getOrCreateUserThread(userId);

  // Insert message
  const { data: messageData, error: messageError } = await supabase
    .from('v2_chat_messages')
    .insert({
      thread_id: thread.id,
      sender_id: userId,
      sender_type: 'user',
      content,
      read: false
    })
    .select('*')
    .single();

  if (messageError || !messageData) {
    throw new Error(messageError?.message ?? 'Failed to send message');
  }

  // Update thread's updated_at
  await supabase
    .from('v2_chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', thread.id);

  return {
    message: messageData as ChatMessage,
    thread
  };
};

/**
 * Mark admin messages as read by user
 * Only marks messages from admins (sender_type = 'admin') as read
 */
export const markAdminMessagesAsRead = async ({
  threadId
}: {
  threadId: string;
}): Promise<{ updated_count: number }> => {
  const supabase = getSupabaseServiceClient();

  // Update all unread admin messages in this thread
  const { data, error } = await supabase
    .from('v2_chat_messages')
    .update({ read: true })
    .eq('thread_id', threadId)
    .eq('sender_type', 'admin')
    .eq('read', false)
    .select('id');

  if (error) {
    throw new Error(error.message);
  }

  return { updated_count: data?.length ?? 0 };
};
