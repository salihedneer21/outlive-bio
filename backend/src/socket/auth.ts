import type { Socket } from 'socket.io';
import { getSupabaseServiceClient } from '@lib/supabase';
import { getUserRole } from '@modules/auth/auth.service';
import { logger } from '@config/logger';

const ADMIN_ACCESS_COOKIE_NAME = 'outlive_admin_access';
const USER_ACCESS_COOKIE_NAME = 'outlive_user_access';

const getAccessTokenFromSocket = (socket: Socket): { token: string; source: 'admin' | 'user' | 'handshake' } | null => {
  // First try auth.token from handshake (for user apps that pass token directly)
  const authToken = socket.handshake.auth?.token;
  if (authToken && typeof authToken === 'string') {
    logger.info(`[Socket Auth] Found token in handshake auth`);
    return { token: authToken, source: 'handshake' };
  }

  // Try query parameter
  const queryToken = socket.handshake.query?.token;
  if (queryToken && typeof queryToken === 'string') {
    logger.info(`[Socket Auth] Found token in query params`);
    return { token: queryToken, source: 'handshake' };
  }

  // Try cookies
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) {
    logger.warn(`[Socket Auth] No cookie header present`);
    return null;
  }

  const parts = cookieHeader.split(';').map((part) => part.trim());

  // Try admin cookie first
  for (const part of parts) {
    if (part.startsWith(`${ADMIN_ACCESS_COOKIE_NAME}=`)) {
      const value = part.slice(ADMIN_ACCESS_COOKIE_NAME.length + 1);
      logger.info(`[Socket Auth] Found admin access token cookie`);
      try {
        return { token: decodeURIComponent(value), source: 'admin' };
      } catch {
        return { token: value, source: 'admin' };
      }
    }
  }

  // Try user cookie
  for (const part of parts) {
    if (part.startsWith(`${USER_ACCESS_COOKIE_NAME}=`)) {
      const value = part.slice(USER_ACCESS_COOKIE_NAME.length + 1);
      logger.info(`[Socket Auth] Found user access token cookie`);
      try {
        return { token: decodeURIComponent(value), source: 'user' };
      } catch {
        return { token: value, source: 'user' };
      }
    }
  }

  logger.warn(`[Socket Auth] Cookie header present but no access token found. Cookies: ${parts.map(p => p.split('=')[0]).join(', ')}`);
  return null;
};

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const tokenResult = getAccessTokenFromSocket(socket);

    if (!tokenResult) {
      logger.warn(`Socket auth failed: No access token (socket: ${socket.id})`);
      return next(new Error('Access token is required'));
    }

    const { token: accessToken, source } = tokenResult;

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      logger.warn(`Socket auth failed: Invalid token (socket: ${socket.id})`);
      return next(new Error('Invalid or expired access token'));
    }

    const user = data.user;

    // Determine role securely:
    // 1. clientType from handshake indicates INTENT (which frontend they're using)
    // 2. But for 'admin' intent, we MUST verify they actually have admin role in database
    // This prevents users from spoofing clientType: 'admin' to gain access
    const clientType = socket.handshake.auth?.clientType;
    let effectiveRole: string;

    if (clientType === 'admin' || source === 'admin') {
      // User claims to be admin - VERIFY from database
      const dbRole = await getUserRole(accessToken, user.id);
      if (dbRole === 'admin') {
        effectiveRole = 'admin';
      } else {
        // Not actually an admin - deny or treat as user
        logger.warn(`[Socket Auth] User ${user.email} claimed admin but has role: ${dbRole}`);
        effectiveRole = 'user';
      }
    } else if (clientType === 'user' || source === 'user') {
      // Explicit user clientType = user role (no verification needed)
      effectiveRole = 'user';
    } else {
      // No explicit clientType - default to user for safety
      effectiveRole = 'user';
    }

    logger.info(`[Socket Auth] Determined role: ${effectiveRole} (clientType: ${clientType}, tokenSource: ${source})`);

    // Attach user data to socket
    socket.data = {
      userId: user.id,
      email: user.email ?? null,
      role: effectiveRole
    };

    logger.info(`Socket auth success: ${user.email} (socket: ${socket.id}, role: ${effectiveRole})`);
    next();
  } catch (error) {
    logger.error(`Socket auth error: ${socket.id}`, error);
    next(new Error('Authentication failed'));
  }
};
