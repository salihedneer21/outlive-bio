import type { Request, Response } from 'express';
import type {
  AdminPatientInsight,
  CreateAdminPatientInsightInput,
  UpdateAdminPatientInsightInput
} from './patientInsights.types';
import {
  createPatientInsight,
  deletePatientInsight,
  getPatientInsights,
  updatePatientInsight
} from './patientInsights.service';
import type { ApiResponse } from '../../types/app';

export const listPatientInsightsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  try {
    const insights = await getPatientInsights(patientId);

    const response: ApiResponse<AdminPatientInsight[]> = {
      data: insights,
      message: 'Patient insights fetched successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patient insights'
    });
  }
};

export const createPatientInsightHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const patientId = req.params.id;

  if (!patientId) {
    res.status(400).json({ message: 'Patient id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { insightType, title, previewText, bodyText, ctaType, isVisible } =
    req.body as Partial<CreateAdminPatientInsightInput>;

  if (!insightType || !title || !previewText || !ctaType) {
    res.status(400).json({ message: 'insightType, title, previewText and ctaType are required' });
    return;
  }

  try {
    const insight = await createPatientInsight({
      patientId,
      insightType,
      title,
      previewText,
      bodyText: bodyText ?? null,
      ctaType,
      isVisible,
      createdUserId: authUser.id
    });

    const response: ApiResponse<AdminPatientInsight> = {
      data: insight,
      message: 'Patient insight created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create patient insight'
    });
  }
};

export const updatePatientInsightHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const insightId = req.params.insightId;

  if (!insightId) {
    res.status(400).json({ message: 'Insight id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const {
    insightType,
    title,
    previewText,
    bodyText,
    ctaType,
    isVisible
  } = req.body as UpdateAdminPatientInsightInput;

  try {
    const updated = await updatePatientInsight(insightId, {
      insightType,
      title,
      previewText,
      bodyText,
      ctaType,
      isVisible
    });

    const response: ApiResponse<AdminPatientInsight> = {
      data: updated,
      message: 'Patient insight updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Patient insight not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update patient insight'
    });
  }
};

export const deletePatientInsightHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const insightId = req.params.insightId;

  if (!insightId) {
    res.status(400).json({ message: 'Insight id is required' });
    return;
  }

  const authUser = (res.locals as {
    authUser?: { id: string; email: string | null; role: string | null };
  }).authUser;

  if (!authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const result = await deletePatientInsight(insightId);

    const response: ApiResponse<typeof result> = {
      data: result,
      message: 'Patient insight deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code === 'NOT_FOUND') {
      res.status(404).json({ message: 'Patient insight not found' });
      return;
    }

    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete patient insight'
    });
  }
};

