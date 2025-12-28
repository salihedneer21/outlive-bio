import { getSupabaseServiceClient } from '@lib/supabase';

export interface AdminNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  critical: boolean;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, unknown> | null;
}

export const getAdminNotifications = async ({
  type,
  page,
  pageSize
}: {
  type?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminNotification[]> => {
  const supabase = getSupabaseServiceClient();

  const safePage = page && page > 0 ? page : 1;
  const safePageSize =
    pageSize && pageSize > 0 ? Math.min(pageSize, 200) : 50;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', {
      ascending: false
    })
    .range(from, to);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminNotification[];
};

export const getAdminPatientNotifications = async ({
  patientId,
  page,
  pageSize
}: {
  patientId: string;
}): Promise<AdminNotification[]> => {
  const supabase = getSupabaseServiceClient();

  const safePage = page && page > 0 ? page : 1;
  const safePageSize =
    pageSize && pageSize > 0 ? Math.min(pageSize, 200) : 50;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', patientId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminNotification[];
};

export const getAdminChatNotifications = async ({
  page,
  pageSize
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminNotification[]> => {
  const supabase = getSupabaseServiceClient();

  const safePage = page && page > 0 ? page : 1;
  const safePageSize =
    pageSize && pageSize > 0 ? Math.min(pageSize, 200) : 50;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'chat')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminNotification[];
};
