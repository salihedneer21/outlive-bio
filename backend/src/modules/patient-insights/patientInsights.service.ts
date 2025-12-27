import { getSupabaseServiceClient } from '@lib/supabase';
import type {
  AdminPatientInsight,
  CreateAdminPatientInsightInput,
  UpdateAdminPatientInsightInput
} from './patientInsights.types';

const mapRowToAdminPatientInsight = (row: any): AdminPatientInsight => ({
  id: row.id,
  patientId: row.patient_id,
  providerId: row.provider_id ?? null,
  createdUserId: row.created_user_id ?? null,
  insightType: row.insight_type,
  title: row.title,
  previewText: row.preview_text,
  bodyText: row.body_text ?? null,
  ctaType: row.cta_type,
  isVisible: !!row.is_visible,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const getPatientInsights = async (patientId: string): Promise<AdminPatientInsight[]> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('patient_insights')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as any[];
  return rows.map(mapRowToAdminPatientInsight);
};

export const createPatientInsight = async (
  input: CreateAdminPatientInsightInput & { createdUserId: string }
): Promise<AdminPatientInsight> => {
  const supabase = getSupabaseServiceClient();

  const payload: Record<string, unknown> = {
    patient_id: input.patientId,
    provider_id: null,
    created_user_id: input.createdUserId,
    insight_type: input.insightType,
    title: input.title,
    preview_text: input.previewText,
    cta_type: input.ctaType,
    body_text: input.bodyText ?? null,
    is_visible: typeof input.isVisible === 'boolean' ? input.isVisible : true
  };

  const { data, error } = await supabase
    .from('patient_insights')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create patient insight');
  }

  return mapRowToAdminPatientInsight(data);
};

export const updatePatientInsight = async (
  id: string,
  input: UpdateAdminPatientInsightInput
): Promise<AdminPatientInsight> => {
  const supabase = getSupabaseServiceClient();

  const updates: Record<string, unknown> = {};

  if (typeof input.insightType !== 'undefined') {
    updates.insight_type = input.insightType;
  }

  if (typeof input.title !== 'undefined') {
    updates.title = input.title;
  }

  if (typeof input.previewText !== 'undefined') {
    updates.preview_text = input.previewText;
  }

  if (typeof input.bodyText !== 'undefined') {
    updates.body_text = input.bodyText;
  }

  if (typeof input.ctaType !== 'undefined') {
    updates.cta_type = input.ctaType;
  }

  if (typeof input.isVisible !== 'undefined') {
    updates.is_visible = input.isVisible;
  }

  if (Object.keys(updates).length === 0) {
    const supabaseSelect = await supabase
      .from('patient_insights')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (supabaseSelect.error) {
      throw supabaseSelect.error;
    }

    if (!supabaseSelect.data) {
      const notFoundError: Error & { code?: string } = new Error('Patient insight not found');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    return mapRowToAdminPatientInsight(supabaseSelect.data);
  }

  const { data, error } = await supabase
    .from('patient_insights')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error('Patient insight not found');
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  return mapRowToAdminPatientInsight(data);
};

export const deletePatientInsight = async (id: string): Promise<{ id: string }> => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('patient_insights')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError: Error & { code?: string } = new Error(
      'Patient insight not found or delete failed'
    );
    notFoundError.code = 'NOT_FOUND';
    throw notFoundError;
  }

  return { id: (data as { id: string }).id };
};

