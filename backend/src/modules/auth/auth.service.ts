import type { LoginResponseData } from './auth.types';
import { getSupabaseClient, getSupabaseServiceClient } from '@lib/supabase';

/*
  * Attempts to decode the user role from the JWT access token.
  * If unsuccessful, returns null.
  * Right now it's not working properly, so we fallback to DB lookup.
  * cuz we don't have custom claims set up yet.(user_role)
*/
const decodeUserRoleFromToken = (accessToken: string | undefined): string | null => {
  if (!accessToken) {
    return null;
  }

  try {
    const [, payload] = accessToken.split('.');
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return typeof decoded.user_role === 'string' ? decoded.user_role : null;
  } catch {
    return null;
  }
};

const fetchUserRoleFromDatabase = async (userId: string): Promise<string | null> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return typeof data.role === 'string' ? data.role : null;
};

export const getUserRole = async (
  accessToken: string | undefined,
  userId: string
): Promise<string | null> => {
  // const tokenRole = decodeUserRoleFromToken(accessToken);
  // if (tokenRole) {
  //   return tokenRole;
  // }

  // if (!userId) {
  //   return null;
  // }
  // add above later when custom claims are set up

  return fetchUserRoleFromDatabase(userId);
};

export const loginUser = async (email: string, password: string): Promise<LoginResponseData> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session || !data.user) {
    const err: Error & { code?: string } = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const { session, user } = data;

  const role = await getUserRole(session.access_token, user.id);

  if (role !== 'admin') {
    const err: Error & { code?: string } = new Error('Admin access required');
    err.code = 'FORBIDDEN';
    throw err;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? ''
    },
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token ?? ''
    },
    role
  };
};

export const refreshUserSession = async (refreshToken: string): Promise<LoginResponseData> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session || !data.user) {
    const err: Error & { code?: string } = new Error('Invalid or expired refresh token');
    err.code = 'INVALID_REFRESH';
    throw err;
  }

  const { session, user } = data;

  const role = await getUserRole(session.access_token, user.id);

  if (role !== 'admin') {
    const err: Error & { code?: string } = new Error('Admin access required');
    err.code = 'FORBIDDEN';
    throw err;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? ''
    },
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token ?? refreshToken
    },
    role
  };
};
