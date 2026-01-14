import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/auth/AuthContext';
import type { ChatMessage, ChatThread } from '@outlive/shared';

// In development: use empty string to connect via Vite proxy (same-origin)
// In production: use full URL from env (remove /api suffix)
const SOCKET_URL = import.meta.env.DEV
  ? '' // Empty string = connect to same origin, Vite proxies /socket.io to backend
  : (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/api$/, '');

// Socket event types
export interface NewMessageEvent {
  message: ChatMessage;
  thread?: ChatThread;
}

export interface ThreadUpdatedEvent {
  threadId: string;
  message: ChatMessage;
}

export interface NewUserMessageEvent {
  threadId: string;
  message: ChatMessage;
}

export interface UserTypingEvent {
  threadId: string;
  userId: string;
  email: string;
  isTyping: boolean;
}

export interface MessagesReadEvent {
  threadId: string;
  updatedCount: number;
}

export interface UnreadCountUpdateEvent {
  threadId: string;
  unreadCount: number;
}

interface AdminSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinThread: (threadId: string) => void;
  leaveThread: (threadId: string) => void;
  sendMessage: (threadId: string, content: string) => void;
  startTyping: (threadId: string) => void;
  stopTyping: (threadId: string) => void;
  markAsRead: (threadId: string) => void;
}

const AdminSocketContext = createContext<AdminSocketContextValue | undefined>(undefined);

export const AdminSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!isReady || !user || !accessToken) {
      // Disconnect if user logs out or no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    // Pass token via handshake auth for cross-origin support (works in both dev and production)
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
        clientType: 'admin'  // Explicitly identify as admin frontend
      },
      withCredentials: true, // Also send cookies as fallback
      transports: ['polling', 'websocket'], // Polling first, then upgrade
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      upgrade: true // Allow upgrade to websocket after initial polling connection
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('[Socket] Error:', error.message);
    });

    return () => {
      console.log('[Socket] Cleaning up connection');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, isReady, accessToken]);

  // Socket actions - use socketRef directly for stability
  const joinThread = useCallback((threadId: string) => {
    socketRef.current?.emit('join_thread', { threadId });
  }, []);

  const leaveThread = useCallback((threadId: string) => {
    socketRef.current?.emit('leave_thread', { threadId });
  }, []);

  const sendMessage = useCallback((threadId: string, content: string) => {
    socketRef.current?.emit('send_message', { threadId, content });
  }, []);

  const startTyping = useCallback((threadId: string) => {
    socketRef.current?.emit('typing_start', { threadId });
  }, []);

  const stopTyping = useCallback((threadId: string) => {
    socketRef.current?.emit('typing_stop', { threadId });
  }, []);

  const markAsRead = useCallback((threadId: string) => {
    socketRef.current?.emit('mark_read', { threadId });
  }, []);

  return (
    <AdminSocketContext.Provider
      value={{
        socket,
        isConnected,
        joinThread,
        leaveThread,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead
      }}
    >
      {children}
    </AdminSocketContext.Provider>
  );
};

export const useAdminSocket = (): AdminSocketContextValue => {
  const ctx = useContext(AdminSocketContext);
  if (!ctx) {
    throw new Error('useAdminSocket must be used within AdminSocketProvider');
  }
  return ctx;
};

// Custom hook for subscribing to socket events - handles cleanup properly
export function useSocketEvent<T>(
  eventName: string,
  callback: (event: T) => void,
  deps: React.DependencyList = []
): void {
  const { socket } = useAdminSocket();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (event: T) => {
      callbackRef.current(event);
    };

    socket.on(eventName, handler);
    console.log(`[Socket] Subscribed to ${eventName}`);

    return () => {
      socket.off(eventName, handler);
      console.log(`[Socket] Unsubscribed from ${eventName}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName, ...deps]);
}
