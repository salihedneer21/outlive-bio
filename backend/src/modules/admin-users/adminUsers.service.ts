import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  AdminUserDto,
  AdminUsersResultDto,
  AdminUserSearchResultDto,
  AdminUserSearchUserDto
} from './adminUsers.types';

export const getAdminUsers = async (): Promise<AdminUsersResultDto> => {
  const supabase = getSupabaseServiceClient();

  const { data: roleRows, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', 'admin');

  if (rolesError) {
    throw rolesError;
  }

  const roles = (roleRows ?? []) as { user_id: string; role: string }[];

  if (roles.length === 0) {
    return { admins: [] };
  }

  const userIds = Array.from(new Set(roles.map((r) => r.user_id)));

  const rolesByUserId = new Map<string, string>();
  for (const r of roles) {
    rolesByUserId.set(r.user_id, r.role);
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profile')
    .select('user_id, first_name, last_name')
    .in('user_id', userIds);

  if (profilesError) {
    throw profilesError;
  }

  const profilesByUserId = new Map<
    string,
    { first_name: string | null; last_name: string | null }
  >();

  for (const row of (profilesData ?? []) as any[]) {
    profilesByUserId.set(row.user_id as string, {
      first_name: (row.first_name as string | null) ?? null,
      last_name: (row.last_name as string | null) ?? null
    });
  }

  const admins: AdminUserDto[] = [];

  for (const userId of userIds) {
    const {
      data: userData,
      error: userError
    } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      continue;
    }

    const authUser = userData.user;

    let name: AdminUserDto['name'] | undefined;

    const profileRow = profilesByUserId.get(userId);

    if (profileRow) {
      const first = profileRow.first_name ?? null;
      const last = profileRow.last_name ?? null;
      const full =
        first || last ? [first, last].filter(Boolean).join(' ') || null : null;

      name = { first, last, full };
    }

    admins.push({
      id: authUser.id,
      email: authUser.email ?? null,
      role: rolesByUserId.get(userId) ?? null,
      createdAt: authUser.created_at ?? null,
      name
    });
  }

  return { admins };
};

export const searchUsersForAdminRole = async (
  query: string,
  limit: number = 20
): Promise<AdminUserSearchResultDto> => {
  const supabase = getSupabaseServiceClient();

  const q = query.trim();
  if (!q) {
    return { users: [] };
  }

  const { data: patientRows, error: patientsError } = await supabase
    .from('patients')
    .select('user_id, first_name, last_name, email')
    .or(
      [
        `email.ilike.%${q}%`,
        `first_name.ilike.%${q}%`,
        `last_name.ilike.%${q}%`
      ].join(',')
    )
    .limit(limit);

  if (patientsError) {
    throw patientsError;
  }

  const rows = (patientRows ?? []) as {
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  }[];

  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  if (userIds.length === 0) {
    return { users: [] };
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds);

  if (rolesError) {
    throw rolesError;
  }

  const adminIds = new Set(
    (roleRows ?? [])
      .filter((r) => (r as { role?: string }).role === 'admin')
      .map((r) => (r as { user_id: string }).user_id)
  );

  const users: AdminUserSearchUserDto[] = rows
    .filter((row) => row.user_id && userIds.includes(row.user_id))
    .map((row) => {
      const first = row.first_name ?? null;
      const last = row.last_name ?? null;
      const full =
        first || last ? [first, last].filter(Boolean).join(' ') || null : null;

      return {
        id: row.user_id as string,
        email: row.email ?? null,
        name: { first, last, full },
        isAdmin: adminIds.has(row.user_id as string)
      };
    });

  return { users };
};

export const addAdminRole = async (userId: string): Promise<void> => {
  const supabase = getSupabaseServiceClient();

  const trimmed = userId.trim();
  if (!trimmed) {
    const err: Error & { code?: string } = new Error('userId is required');
    err.code = 'BAD_REQUEST';
    throw err;
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(trimmed);
  if (userError || !userData?.user) {
    const err: Error & { code?: string } = new Error('User not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const { data: existing } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('user_id', trimmed)
    .maybeSingle();

  if (existing && (existing as { role?: string }).role === 'admin') {
    return;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', trimmed);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: trimmed, role: 'admin' });

    if (insertError) {
      throw insertError;
    }
  }
};

export const removeAdminRole = async (userId: string): Promise<void> => {
  const supabase = getSupabaseServiceClient();

  const trimmed = userId.trim();
  if (!trimmed) {
    const err: Error & { code?: string } = new Error('userId is required');
    err.code = 'BAD_REQUEST';
    throw err;
  }

  const { data: existing, error: selectError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('user_id', trimmed)
    .eq('role', 'admin')
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (!existing) {
    const err: Error & { code?: string } = new Error('Admin role not found for user');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', trimmed)
    .eq('role', 'admin');

  if (error) {
    throw error;
  }
};
