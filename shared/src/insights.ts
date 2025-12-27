export type InsightType = 'alert' | 'recommendation' | 'education';

export type InsightCtaType = 'learn_more' | 'discuss_with_doctor';

export interface AdminPatientInsight {
  id: string;
  patientId: string;
  providerId: string | null;
  createdUserId: string | null;
  insightType: InsightType;
  title: string;
  previewText: string;
  bodyText: string | null;
  ctaType: InsightCtaType;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

