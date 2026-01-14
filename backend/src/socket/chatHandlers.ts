import type { Server as SocketServer } from 'socket.io';
import type { AuthenticatedSocket } from './index';
import {
  sendAdminChatMessage,
  markMessagesAsRead,
  sendUserChatMessage,
  getOrCreateUserThread,
  markAdminMessagesAsRead,
  getThreadById
} from '@modules/chat/chat.service';
import { logger } from '@config/logger';

// Socket event types
export interface JoinThreadPayload {
  threadId: string;
}

export interface LeaveThreadPayload {
  threadId: string;
}

export interface SendMessagePayload {
  threadId: string;
  content: string;
}

export interface UserSendMessagePayload {
  content: string;
}

export interface TypingPayload {
  threadId: string;
}

export interface MarkReadPayload {
  threadId: string;
}

// ============================================================================
// ADMIN CHAT HANDLERS
// ============================================================================
export const registerChatHandlers = (socket: AuthenticatedSocket, io: SocketServer): void => {
  const { userId, email } = socket.data;

  // Join a specific thread room
  socket.on('join_thread', (payload: JoinThreadPayload) => {
    const { threadId } = payload;
    if (!threadId) return;

    const roomName = `thread:${threadId}`;
    socket.join(roomName);
    logger.info(`Admin ${email} joined thread room: ${roomName}`);
  });

  // Leave a specific thread room
  socket.on('leave_thread', (payload: LeaveThreadPayload) => {
    const { threadId } = payload;
    if (!threadId) return;

    const roomName = `thread:${threadId}`;
    socket.leave(roomName);
    logger.info(`Admin ${email} left thread room: ${roomName}`);
  });

  // Send a message as admin
  socket.on('send_message', async (payload: SendMessagePayload) => {
    const { threadId, content } = payload;
    if (!threadId || !content?.trim()) {
      socket.emit('error', { message: 'threadId and content are required' });
      return;
    }

    try {
      const result = await sendAdminChatMessage({
        threadId,
        content: content.trim(),
        adminId: userId
      });

      // Emit to the specific thread room (for admins viewing the thread)
      io.to(`thread:${threadId}`).emit('new_message', {
        message: result.message,
        thread: result.thread
      });

      // Emit to admin:all room for thread list updates
      io.to('admin:all').emit('thread_updated', {
        threadId,
        message: result.message
      });

      // Emit to the user who owns this thread
      const userRoom = `user:${result.thread.user_id}`;
      logger.info(`[Socket] Emitting new_message to room: ${userRoom}`);
      io.to(userRoom).emit('new_message', {
        message: result.message,
        thread: result.thread
      });

      logger.info(`Admin ${email} sent message to thread ${threadId}, user room: ${userRoom}`);
    } catch (error) {
      logger.error(`Failed to send message: ${error}`);
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  });

  // Typing indicator start
  socket.on('typing_start', async (payload: TypingPayload) => {
    const { threadId } = payload;
    if (!threadId) return;

    const typingEvent = {
      threadId,
      userId,
      email,
      senderType: 'admin',
      isTyping: true
    };

    // Broadcast to thread room (for other admins viewing)
    socket.to(`thread:${threadId}`).emit('user_typing', typingEvent);

    // Also emit to the user who owns this thread
    const thread = await getThreadById(threadId);
    if (thread) {
      io.to(`user:${thread.user_id}`).emit('user_typing', typingEvent);
    }
  });

  // Typing indicator stop
  socket.on('typing_stop', async (payload: TypingPayload) => {
    const { threadId } = payload;
    if (!threadId) return;

    const typingEvent = {
      threadId,
      userId,
      email,
      senderType: 'admin',
      isTyping: false
    };

    // Broadcast to thread room (for other admins viewing)
    socket.to(`thread:${threadId}`).emit('user_typing', typingEvent);

    // Also emit to the user who owns this thread
    const thread = await getThreadById(threadId);
    if (thread) {
      io.to(`user:${thread.user_id}`).emit('user_typing', typingEvent);
    }
  });

  // Mark messages as read (admin reading user messages)
  socket.on('mark_read', async (payload: MarkReadPayload) => {
    const { threadId } = payload;
    if (!threadId) return;

    try {
      const result = await markMessagesAsRead({ threadId });

      // Emit to admin:all room for unread count updates
      io.to('admin:all').emit('messages_read', {
        threadId,
        updatedCount: result.updated_count
      });

      // Also emit unread count update
      io.to('admin:all').emit('unread_count_update', {
        threadId,
        unreadCount: 0
      });

      logger.info(`Admin ${email} marked thread ${threadId} as read (${result.updated_count} messages)`);
    } catch (error) {
      logger.error(`Failed to mark messages as read: ${error}`);
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      });
    }
  });
};

// ============================================================================
// USER CHAT HANDLERS
// ============================================================================
export const registerUserChatHandlers = (socket: AuthenticatedSocket, io: SocketServer): void => {
  const { userId, email } = socket.data;

  // User joins their own thread room (auto-join on connect)
  socket.on('join_chat', async () => {
    try {
      const thread = await getOrCreateUserThread(userId);
      const roomName = `thread:${thread.id}`;
      socket.join(roomName);

      // Send thread info back to user
      socket.emit('chat_joined', { thread });

      logger.info(`User ${email} joined their chat room: ${roomName}`);
    } catch (error) {
      logger.error(`Failed to join chat for user ${email}: ${error}`);
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to join chat'
      });
    }
  });

  // Send a message as user
  socket.on('send_message', async (payload: UserSendMessagePayload) => {
    const { content } = payload;
    if (!content?.trim()) {
      socket.emit('error', { message: 'content is required' });
      return;
    }

    try {
      const result = await sendUserChatMessage({
        userId,
        content: content.trim()
      });

      // Emit to user's own socket (for confirmation)
      socket.emit('new_message', {
        message: result.message,
        thread: result.thread
      });
      logger.info(`[Socket] User message emitted to sender socket`);

      // Emit to the thread room (for admins viewing this thread)
      const threadRoom = `thread:${result.thread.id}`;
      io.to(threadRoom).emit('new_message', {
        message: result.message,
        thread: result.thread
      });
      logger.info(`[Socket] User message emitted to thread room: ${threadRoom}`);

      // Emit to admin:all room for notifications and unread count
      io.to('admin:all').emit('new_user_message', {
        threadId: result.thread.id,
        message: result.message
      });
      logger.info(`[Socket] User message emitted to admin:all room`);

      logger.info(`User ${email} sent message to thread ${result.thread.id}`);
    } catch (error) {
      logger.error(`Failed to send user message: ${error}`);
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  });

  // Typing indicator start
  socket.on('typing_start', async () => {
    try {
      const thread = await getOrCreateUserThread(userId);

      // Broadcast to thread room
      socket.to(`thread:${thread.id}`).emit('user_typing', {
        threadId: thread.id,
        userId,
        email,
        senderType: 'user',
        isTyping: true
      });

      // Also emit to admin:all for admins not in the thread room
      io.to('admin:all').emit('user_typing', {
        threadId: thread.id,
        userId,
        email,
        senderType: 'user',
        isTyping: true
      });
    } catch (error) {
      logger.error(`Failed to emit typing start: ${error}`);
    }
  });

  // Typing indicator stop
  socket.on('typing_stop', async () => {
    try {
      const thread = await getOrCreateUserThread(userId);

      // Broadcast to thread room
      socket.to(`thread:${thread.id}`).emit('user_typing', {
        threadId: thread.id,
        userId,
        email,
        senderType: 'user',
        isTyping: false
      });

      // Also emit to admin:all
      io.to('admin:all').emit('user_typing', {
        threadId: thread.id,
        userId,
        email,
        senderType: 'user',
        isTyping: false
      });
    } catch (error) {
      logger.error(`Failed to emit typing stop: ${error}`);
    }
  });

  // Mark admin messages as read (user reading admin messages)
  socket.on('mark_read', async () => {
    try {
      const thread = await getOrCreateUserThread(userId);
      await markAdminMessagesAsRead({ threadId: thread.id });

      logger.info(`User ${email} marked admin messages as read in thread ${thread.id}`);
    } catch (error) {
      logger.error(`Failed to mark messages as read: ${error}`);
      socket.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      });
    }
  });
};

// ============================================================================
// UTILITY FUNCTIONS FOR EMITTING FROM REST HANDLERS
// ============================================================================

// Emit new user message to admins (called from user chat REST service)
export const emitNewUserMessage = (
  io: SocketServer,
  threadId: string,
  userId: string,
  message: {
    id: string;
    thread_id: string;
    sender_id: string;
    sender_type: string;
    content: string;
    created_at: string;
    read: boolean;
  }
): void => {
  // Emit to thread room (for admins viewing this specific thread)
  io.to(`thread:${threadId}`).emit('new_message', { message });

  // Emit to admin:all for notifications and unread badges
  io.to('admin:all').emit('new_user_message', {
    threadId,
    message
  });

  // Emit to user's room for confirmation
  io.to(`user:${userId}`).emit('new_message', { message });
};

// Emit new admin message to user (called from admin chat REST service)
export const emitNewAdminMessage = (
  io: SocketServer,
  threadId: string,
  userId: string,
  message: {
    id: string;
    thread_id: string;
    sender_id: string;
    sender_type: string;
    content: string;
    created_at: string;
    read: boolean;
  }
): void => {
  // Emit to thread room (for admins viewing this thread)
  io.to(`thread:${threadId}`).emit('new_message', { message });

  // Emit to admin:all for thread list updates
  io.to('admin:all').emit('thread_updated', {
    threadId,
    message
  });

  // Emit to the user who owns this thread
  io.to(`user:${userId}`).emit('new_message', { message });
};
