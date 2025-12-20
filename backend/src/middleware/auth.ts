import type { NextFunction, Request, Response } from 'express';
import { getSupabaseServiceClient } from '@lib/supabase';
import { getUserRole } from '@modules/auth/auth.service';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization header missing or malformed' });
      return;
    }

    const accessToken = authHeader.slice('Bearer '.length).trim();

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
    const role = await getUserRole(accessToken, user.id);

    if (role !== 'admin') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    // Attach authenticated admin user to response locals for downstream handlers
    (res.locals as { authUser?: { id: string; email: string | null; role: string | null } }).authUser =
      {
        id: user.id,
        email: user.email ?? null,
        role
      };

    next();
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to authenticate request'
    });
  }
};
