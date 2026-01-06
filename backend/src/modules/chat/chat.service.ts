import { getSupabaseServiceClient } from '@lib/supabase';
import { KlaviyoCrmService } from '@modules/klaviyo/klaviyo.crm.service';

export interface AdminChatThread {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  patient_email: string | null;
  patient_name: string | null;
}

export interface AdminChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'patient' | 'admin';
  body: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const getAdminChatThreads = async ({
  page,
  pageSize
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminChatThread[]> => {
  const supabase = getSupabaseServiceClient();

  const safePage = page && page > 0 ? page : 1;
  const safePageSize =
    pageSize && pageSize > 0 ? Math.min(pageSize, 200) : 50;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const threads = (data ?? []) as Array<{
    id: string;
    patient_id: string;
    created_at: string;
    updated_at: string;
    last_message_at: string | null;
    last_message_preview: string | null;
  }>;

  if (threads.length === 0) {
    return [];
  }

  // Enrich threads with patient email/name using patients + profile tables
  const supabaseProfiles = getSupabaseServiceClient();
  const patientIds = Array.from(
    new Set(
      threads
        .map((t) => t.patient_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  let emailByUserId = new Map<string, string | null>();
  let nameByUserId = new Map<string, string | null>();

  if (patientIds.length > 0) {
    // Try to get email from patients table (user_id -> email)
    const { data: patientsData } = await supabaseProfiles
      .from('patients')
      .select('user_id, email')
      .in('user_id', patientIds);

    if (patientsData) {
      for (const row of patientsData as Array<{ user_id: string; email: string | null }>) {
        emailByUserId.set(row.user_id, row.email ?? null);
      }
    }

    // Try to get name from profile table
    const { data: profilesData } = await supabaseProfiles
      .from('profile')
      .select('user_id, first_name, last_name')
      .in('user_id', patientIds);

    if (profilesData) {
      for (const row of profilesData as Array<{
        user_id: string;
        first_name: string | null;
        last_name: string | null;
      }>) {
        const first = row.first_name ?? '';
        const last = row.last_name ?? '';
        const full = `${first} ${last}`.trim();
        nameByUserId.set(row.user_id, full || null);
      }
    }
  }

  return threads.map((row) => ({
    id: row.id,
    patient_id: row.patient_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_at: row.last_message_at,
    last_message_preview: row.last_message_preview,
    patient_email: emailByUserId.get(row.patient_id) ?? null,
    patient_name: nameByUserId.get(row.patient_id) ?? null
  }));
};

export const getAdminChatMessages = async ({
  threadId,
  limit
}: {
  threadId: string;
  limit?: number;
}): Promise<AdminChatMessage[]> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit ?? 100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminChatMessage[];
};

export const sendAdminChatMessage = async ({
  patientId,
  body,
  adminId,
  adminEmail
}: {
  patientId: string;
  body: string;
  adminId: string;
  adminEmail?: string;
}) => {
  const supabase = getSupabaseServiceClient();

  // Ensure thread exists
  const { data: existingThreads, error: threadError } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('patient_id', patientId)
    .limit(1);

  if (threadError) {
    throw new Error(threadError.message);
  }

  let thread = existingThreads && existingThreads[0];

  if (!thread) {
    const { data: inserted, error: insertError } = await supabase
      .from('chat_threads')
      .insert({ patient_id: patientId })
      .select('*')
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? 'Failed to create chat thread');
    }

    thread = inserted;
  }

  // Insert message as admin
  const { data: insertedMessages, error: messageError } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: thread.id,
      sender_id: adminId,
      sender_role: 'admin',
      body
    })
    .select('*')
    .limit(1);

  if (messageError || !insertedMessages || !insertedMessages[0]) {
    throw new Error(messageError?.message ?? 'Failed to send message');
  }

  const message = insertedMessages[0] as AdminChatMessage;

  // Update thread summary
  await supabase
    .from('chat_threads')
    .update({
      last_message_at: message.created_at,
      last_message_preview: message.body?.substring(0, 140) ?? ''
    })
    .eq('id', thread.id);

  // Create notifications for this admin message
  try {
    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

    // System-level chat notification visible to all admins
    await supabase.from('notifications').insert({
      user_id: SYSTEM_USER_ID,
      type: 'chat',
      title: 'New admin message',
      body: body.substring(0, 80) || 'New message from care team',
      related_entity_type: 'chat_message',
      related_entity_id: message.id,
      metadata: {
        patientId,
        threadId: thread.id,
        messagePreview: body.substring(0, 100),
        source: 'inhouse_chat_admin',
        direction: 'admin_to_patient',
        adminId,
        adminEmail: adminEmail ?? null
      }
    });

    // Patient-specific notification so the patient can see the message in their app
    await supabase.from('notifications').insert({
      user_id: patientId,
      type: 'chat',
      title: 'New message from your care team',
      body: body.substring(0, 80) || 'You have a new message',
      related_entity_type: 'chat_message',
      related_entity_id: message.id,
      metadata: {
        threadId: thread.id,
        messagePreview: body.substring(0, 100),
        source: 'inhouse_chat_admin',
        direction: 'admin_to_patient'
      }
    });
  } catch {
    // Do not fail chat if notification creation fails
  }

  // Trigger Klaviyo "Message Received" event for admin -> patient messages
  try {
    const { data: patientRows, error: patientError } = await supabase
      .from('patients')
      .select('email')
      .eq('user_id', patientId)
      .limit(1);

    const patientEmail =
      !patientError && patientRows && patientRows[0] && typeof patientRows[0].email === 'string'
        ? (patientRows[0].email as string)
        : undefined;

    if (patientEmail) {
      await KlaviyoCrmService.sendMessageReceived({
        patientId,
        email: patientEmail,
        channel: 'admin'
      });
    }
  } catch {
    // Klaviyo failures must not impact chat delivery
  }

  return { thread, message };
};
