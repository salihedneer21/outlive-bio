import type { NextFunction, Request, Response } from 'express';
import { getSupabaseServiceClient } from '@lib/supabase';

/**
 * Middleware specifically for user chat - completely independent from admin auth.
 * Accepts tokens via:
 * 1. Authorization Bearer header
 * 2. outlive_user_access cookie (for user portal)
 * 3. outlive_admin_access cookie (so admins can also use user endpoints if needed)
 */

const getTokenFromRequest = (req: Request): string | null => {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) return token;
  }

  // Try cookies
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';').map((part) => part.trim());

  // Try user cookie
  for (const part of parts) {
    if (part.startsWith('outlive_user_access=')) {
      const value = part.slice('outlive_user_access='.length);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  // Also accept admin cookie (admins should be able to use user endpoints)
  for (const part of parts) {
    if (part.startsWith('outlive_admin_access=')) {
      const value = part.slice('outlive_admin_access='.length);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
};

export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = getTokenFromRequest(req);

    if (!accessToken) {
      res.status(401).json({ message: 'Access token is required' });
      return;
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      res.status(401).json({ message: 'Invalid or expired access token' });
      return;
    }

    const user = data.user;

    // Attach authenticated user to response locals
    (res.locals as { authUser?: { id: string; email: string | null; role: string | null } }).authUser =
      {
        id: user.id,
        email: user.email ?? null,
        role: 'user'
      };

    next();
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to authenticate request'
    });
  }
};
