import type { Request, Response } from 'express';
import type { LoginRequestBody } from './auth.types';
import { loginUser, refreshUserSession } from './auth.service';
import type { ApiResponse } from '../../types/app';

const REFRESH_COOKIE_NAME = 'outlive_admin_refresh';
const ACCESS_COOKIE_NAME = 'outlive_admin_access';

const getRefreshTokenFromRequest = (req: Request): string | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${REFRESH_COOKIE_NAME}=`)) {
      const value = part.slice(REFRESH_COOKIE_NAME.length + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
};

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none' as const,
  path: '/api/auth/refresh',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});

const getAccessCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none' as const,
  path: '/api',
  // Persist login similarly to refresh cookie; actual JWT expiry is still enforced by Supabase.
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});

const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshCookieOptions());
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, getAccessCookieOptions());
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<LoginRequestBody>;

  if (!body.email || !body.password) {
    res.status(400).json({
      message: 'Email and password are required'
    });
    return;
  }

  try {
    const result = await loginUser(body.email, body.password);

    // Store tokens in HttpOnly cookies instead of returning them in the body.
    setAuthCookies(res, result.tokens);

    const response: ApiResponse<{ user: typeof result.user; role: string | null }> = {
      data: {
        user: result.user,
        role: result.role
      },
      message: 'Login successful'
    };

    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    const code = (error as { code?: string }).code;

    if (code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ message });
      return;
    }

    if (code === 'FORBIDDEN') {
      res.status(403).json({ message });
      return;
    }

    res.status(500).json({
      message: 'Internal authentication error'
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token is missing' });
      return;
    }

    const result = await refreshUserSession(refreshToken);

    // Rotate cookies if Supabase provided new tokens.
    setAuthCookies(res, result.tokens);

    const response: ApiResponse<{ user: typeof result.user; role: string | null }> = {
      data: {
        user: result.user,
        role: result.role
      },
      message: 'Session refreshed'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    // Clear invalid/expired refresh cookie.
    res.cookie(REFRESH_COOKIE_NAME, '', {
      ...getRefreshCookieOptions(),
      maxAge: 0
    });

    if (code === 'INVALID_REFRESH') {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to refresh session'
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  // Clear auth cookies on logout.
  res.cookie(REFRESH_COOKIE_NAME, '', {
    ...getRefreshCookieOptions(),
    maxAge: 0
  });
  res.cookie(ACCESS_COOKIE_NAME, '', {
    ...getAccessCookieOptions(),
    maxAge: 0
  });

  res.status(204).end();
};
