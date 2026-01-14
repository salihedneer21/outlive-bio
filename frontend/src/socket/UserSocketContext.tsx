import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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

export interface ChatJoinedEvent {
  thread: ChatThread;
}

export interface UserTypingEvent {
  threadId: string;
  userId: string;
  email: string;
  senderType: 'admin' | 'user';
  isTyping: boolean;
}

export interface SocketError {
  message: string;
}

interface UserSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  thread: ChatThread | null;
  joinChat: () => void;
  sendMessage: (content: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
}

const UserSocketContext = createContext<UserSocketContextValue | undefined>(undefined);

interface UserSocketProviderProps {
  children: React.ReactNode;
  accessToken?: string; // Optional: pass token directly for non-cookie auth
  enabled?: boolean; // Whether to connect (default: true)
}

export const UserSocketProvider: React.FC<UserSocketProviderProps> = ({
  children,
  accessToken,
  enabled = true
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) {
      // Disconnect if disabled
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setThread(null);
      }
      return;
    }

    // Create socket connection
    const socketOptions: Parameters<typeof io>[1] = {
      withCredentials: true, // Send cookies
      transports: ['polling', 'websocket'], // Polling first to ensure cookies are sent
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      upgrade: true // Allow upgrade to websocket after initial polling connection
    };

    // If access token is provided, send it in auth
    if (accessToken) {
      socketOptions.auth = { token: accessToken };
    }

    const newSocket = io(SOCKET_URL, socketOptions);

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[User Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[User Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[User Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error: SocketError) => {
      console.error('[User Socket] Error:', error.message);
    });

    // Handle chat joined event
    newSocket.on('chat_joined', (event: ChatJoinedEvent) => {
      console.log('[User Socket] Chat joined:', event.thread.id);
      setThread(event.thread);
    });

    return () => {
      console.log('[User Socket] Cleaning up connection');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, accessToken]);

  // Socket actions
  const joinChat = useCallback(() => {
    socketRef.current?.emit('join_chat');
  }, []);

  const sendMessage = useCallback((content: string) => {
    socketRef.current?.emit('send_message', { content });
  }, []);

  const startTyping = useCallback(() => {
    socketRef.current?.emit('typing_start');
  }, []);

  const stopTyping = useCallback(() => {
    socketRef.current?.emit('typing_stop');
  }, []);

  const markAsRead = useCallback(() => {
    socketRef.current?.emit('mark_read');
  }, []);

  return (
    <UserSocketContext.Provider
      value={{
        socket,
        isConnected,
        thread,
        joinChat,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead
      }}
    >
      {children}
    </UserSocketContext.Provider>
  );
};

export const useUserSocket = (): UserSocketContextValue => {
  const ctx = useContext(UserSocketContext);
  if (!ctx) {
    throw new Error('useUserSocket must be used within UserSocketProvider');
  }
  return ctx;
};

// Custom hook for subscribing to socket events - handles cleanup properly
export function useUserSocketEvent<T>(
  eventName: string,
  callback: (event: T) => void,
  deps: React.DependencyList = []
): void {
  const { socket } = useUserSocket();
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
    console.log(`[User Socket] Subscribed to ${eventName}`);

    return () => {
      socket.off(eventName, handler);
      console.log(`[User Socket] Unsubscribed from ${eventName}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName, ...deps]);
}
