import type { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { authenticateSocket } from './auth';
import { registerChatHandlers, registerUserChatHandlers } from './chatHandlers';
import { logger } from '@config/logger';

let io: SocketServer | null = null;

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email: string | null;
    role: string;
  };
}

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: true,
      credentials: true
    },
    transports: ['polling', 'websocket'], // Polling first to ensure cookies are sent
    allowUpgrades: true
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { email, role } = authSocket.data;

    logger.info(`Socket connected: ${socket.id} (user: ${email}, role: ${role})`);

    if (role === 'admin') {
      // Admin users join the admin:all room to receive all chat events
      socket.join('admin:all');
      logger.info(`Admin ${email} joined admin:all room`);

      // Register admin chat handlers
      registerChatHandlers(authSocket, io!);
    } else {
      // Regular users join their own room for receiving messages
      const { userId } = authSocket.data;
      socket.join(`user:${userId}`);
      logger.info(`User ${email} joined user:${userId} room`);

      // Register user chat handlers
      registerUserChatHandlers(authSocket, io!);
    }

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

export const getIO = (): SocketServer | null => io;
