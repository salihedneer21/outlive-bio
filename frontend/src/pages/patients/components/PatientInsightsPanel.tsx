import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminPatient, AdminPatientInsight, InsightType, InsightCtaType } from '@outlive/shared';
import {
  createPatientInsight,
  deletePatientInsight,
  listPatientInsights,
  updatePatientInsight
} from '@/api/patientInsights';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toaster';

interface PatientInsightsPanelProps {
  patient: AdminPatient;
}

type InsightEditorState = {
  id: string | null;
  insightType: InsightType;
  title: string;
  previewText: string;
  ctaType: InsightCtaType;
  bodyText: string;
  isVisible: boolean;
};

type ConfirmModal =
  | { type: 'delete'; insight: AdminPatientInsight }
  | { type: 'hide' | 'show'; insight: AdminPatientInsight };

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const EyeIcon = ({ off = false }: { off?: boolean }) => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {off ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.057 10.057 0 012.478-4.568M6.18 6.18A9.957 9.957 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.05 10.05 0 01-4.132 5.225M15 12a3 3 0 00-3-3m0 0a3 3 0 00-2.121.879M12 9l7.5 7.5M4.5 4.5L12 12"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    )}
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2m-7 7h.01M9 12h6m-3 7l9-9a2.121 2.121 0 00-3-3l-9 9V19h3z" />
  </svg>
);

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

const formatInsightTypeLabel = (type: InsightType): string => {
  switch (type) {
    case 'alert':
      return 'Alert';
    case 'recommendation':
      return 'Recommendation';
    case 'education':
      return 'Education';
    default:
      return type;
  }
};

const formatCtaLabel = (cta: InsightCtaType): string => {
  switch (cta) {
    case 'learn_more':
      return 'Learn more';
    case 'discuss_with_doctor':
      return 'Discuss with doctor';
    default:
      return cta;
  }
};

export const PatientInsightsPanel: React.FC<PatientInsightsPanelProps> = ({ patient }) => {
  const toast = useToast();
  const [insights, setInsights] = useState<AdminPatientInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [editor, setEditor] = useState<InsightEditorState>({
    id: null,
    insightType: 'alert',
    title: '',
    previewText: '',
    ctaType: 'learn_more',
    bodyText: '',
    isVisible: true
  });
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInsights = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await listPatientInsights(patient.id);
        if (!cancelled) {
          setInsights(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            typeof err === 'object' && err && 'message' in err
              ? (err as { message?: string }).message ?? 'Failed to load insights'
              : 'Failed to load insights';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  const sortedInsights = useMemo(
    () =>
      [...insights].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [insights]
  );

  const openCreate = () => {
    setEditor({
      id: null,
      insightType: 'alert',
      title: '',
      previewText: '',
      ctaType: 'learn_more',
      bodyText: '',
      isVisible: true
    });
    setIsEditorOpen(true);
  };

  const openEdit = (insight: AdminPatientInsight) => {
    setEditor({
      id: insight.id,
      insightType: insight.insightType,
      title: insight.title,
      previewText: insight.previewText,
      ctaType: insight.ctaType,
      bodyText: insight.bodyText ?? '',
      isVisible: insight.isVisible
    });
    setIsEditorOpen(true);
  };

  useEffect(() => {
    if (isEditorOpen && editorRef.current) {
      editorRef.current.innerHTML = editor.bodyText || '';
    }
    // We only want to reset when opening or switching the edited insight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorOpen, editor.id]);

  const handleBodyInput = (event: React.FormEvent<HTMLDivElement>) => {
    const value = (event.currentTarget as HTMLDivElement).innerHTML;
    setEditor((prev) => ({ ...prev, bodyText: value }));
  };

  const applyFormat = (command: string, value?: string) => {
    try {
      // eslint-disable-next-line deprecation/deprecation
      document.execCommand(command, false, value);
      if (editorRef.current) {
        setEditor((prev) => ({ ...prev, bodyText: editorRef.current?.innerHTML ?? '' }));
      }
    } catch {
      // ignore formatting errors in older browsers
    }
  };

  const handleSave = async () => {
    if (!editor.title.trim() || !editor.previewText.trim()) {
      toast.error('Title and preview text are required');
      return;
    }

    if (editor.ctaType === 'learn_more' && !editor.bodyText.trim()) {
      toast.error('Body text is required for "Learn more"');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (editor.id) {
        const res = await updatePatientInsight(editor.id, {
          insightType: editor.insightType,
          title: editor.title.trim(),
          previewText: editor.previewText.trim(),
          bodyText: editor.ctaType === 'learn_more' ? editor.bodyText : null,
          ctaType: editor.ctaType,
          isVisible: editor.isVisible
        });

        setInsights((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)));
        toast.success('Insight updated');
      } else {
        const res = await createPatientInsight(patient.id, {
          insightType: editor.insightType,
          title: editor.title.trim(),
          previewText: editor.previewText.trim(),
          bodyText: editor.ctaType === 'learn_more' ? editor.bodyText : undefined,
          ctaType: editor.ctaType,
          isVisible: editor.isVisible
        });

        setInsights((prev) => [res.data, ...prev]);
        toast.success('Insight created');
      }

      setIsEditorOpen(false);
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to save insight'
          : 'Failed to save insight';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;

    setIsConfirmLoading(true);
    try {
      const { type, insight } = confirmModal;

      if (type === 'delete') {
        await deletePatientInsight(insight.id);
        setInsights((prev) => prev.filter((i) => i.id !== insight.id));
        toast.success('Insight deleted');
      } else if (type === 'hide' || type === 'show') {
        const res = await updatePatientInsight(insight.id, {
          isVisible: type === 'show'
        });
        setInsights((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)));
        toast.success(type === 'show' ? 'Insight visible to patient' : 'Insight hidden from patient');
      }

      setConfirmModal(null);
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Action failed'
          : 'Action failed';
      toast.error(msg);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const modalConfig = useMemo(() => {
    if (!confirmModal) return null;
    const { type, insight } = confirmModal;

    if (type === 'delete') {
      return {
        title: 'Delete insight',
        message: `Are you sure you want to delete "${insight.title}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'danger' as const
      };
    }

    return {
      title: insight.isVisible ? 'Hide insight from patient' : 'Show insight to patient',
      message: insight.isVisible
        ? 'This insight will no longer be visible in the patient portal.'
        : 'This insight will become visible in the patient portal.',
      confirmLabel: insight.isVisible ? 'Hide' : 'Show',
      variant: 'default' as const
    };
  }, [confirmModal]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 p-3 dark:border-neutral-800">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Insights
          </div>
          <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Patient-specific alerts, recommendations and education.
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          <PlusIcon />
          New insight
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-2/3" />
              <div className="mt-3 flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ) : sortedInsights.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
            <p className="font-medium text-neutral-700 dark:text-neutral-200">
              No insights created yet
            </p>
            <p className="mt-1">
              Create alerts, recommendations or educational content that will appear in the patient
              portal.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 p-3">
            {sortedInsights.map((insight) => (
              <li
                key={insight.id}
                className="rounded-lg border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          insight.insightType === 'alert'
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : insight.insightType === 'recommendation'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}
                      >
                        {formatInsightTypeLabel(insight.insightType)}
                      </span>
                      <span className="truncate font-medium text-neutral-900 dark:text-neutral-50">
                        {insight.title}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-neutral-600 dark:text-neutral-300">
                      {insight.previewText}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>{formatCtaLabel(insight.ctaType)}</span>
                      <span>•</span>
                      <span>{insight.isVisible ? 'Visible to patient' : 'Hidden from patient'}</span>
                      <span>•</span>
                      <span>Created {formatDate(insight.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          type: insight.isVisible ? 'hide' : 'show',
                          insight
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <EyeIcon off={!insight.isVisible} />
                      {insight.isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(insight)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ type: 'delete', insight })}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <Modal
          isOpen={isEditorOpen}
          title={editor.id ? 'Edit insight' : 'New insight'}
          onClose={() => setIsEditorOpen(false)}
          error={error ?? undefined}
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">
                Type
              </label>
              <select
                value={editor.insightType}
                onChange={(e) =>
                  setEditor((prev) => ({ ...prev, insightType: e.target.value as InsightType }))
                }
                className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
              >
                <option value="alert">Alert</option>
                <option value="recommendation">Recommendation</option>
                <option value="education">Education</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">
                Title
              </label>
              <input
                type="text"
                value={editor.title}
                onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={50}
                className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                placeholder="Short title (max 50 characters)"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">
                Preview text
              </label>
              <textarea
                value={editor.previewText}
                onChange={(e) => setEditor((prev) => ({ ...prev, previewText: e.target.value }))}
                maxLength={120}
                rows={3}
                className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                placeholder="Short description that appears on the card"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">
                Call to action
              </label>
              <select
                value={editor.ctaType}
                onChange={(e) =>
                  setEditor((prev) => ({ ...prev, ctaType: e.target.value as InsightCtaType }))
                }
                className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
              >
                <option value="learn_more">"Learn more" – opens detail view</option>
                <option value="discuss_with_doctor">
                  "Discuss with doctor" – routes to chat
                </option>
              </select>
            </div>
            {editor.ctaType === 'learn_more' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  Body (required)
                </label>
                <div className="flex flex-wrap gap-1 rounded-md bg-neutral-100 p-1.5 text-[11px] dark:bg-neutral-800">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="inline-flex h-7 items-center justify-center rounded px-2 font-semibold text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="inline-flex h-7 items-center justify-center rounded px-2 italic text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('underline')}
                    className="inline-flex h-7 items-center justify-center rounded px-2 underline text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    U
                  </button>
                  <span className="mx-1 h-5 w-px bg-neutral-300 dark:bg-neutral-600" />
                  <button
                    type="button"
                    onClick={() => applyFormat('insertUnorderedList')}
                    className="inline-flex h-7 items-center justify-center rounded px-2 text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('insertOrderedList')}
                    className="inline-flex h-7 items-center justify-center rounded px-2 text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    1. List
                  </button>
                  <span className="mx-1 h-5 w-px bg-neutral-300 dark:bg-neutral-600" />
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('Enter URL');
                      if (url && url.trim()) {
                        applyFormat('createLink', url.trim());
                      }
                    }}
                    className="inline-flex h-7 items-center justify-center rounded px-2 text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('removeFormat')}
                    className="inline-flex h-7 items-center justify-center rounded px-2 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50">
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleBodyInput}
                    className="insight-editor min-h-[160px] whitespace-pre-wrap break-words outline-none"
                    data-placeholder="This content will show when the patient taps 'Learn more'"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="insight-visible"
                  type="checkbox"
                  checked={editor.isVisible}
                  onChange={(e) =>
                    setEditor((prev) => ({ ...prev, isVisible: e.target.checked }))
                  }
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900/20 dark:border-neutral-600 dark:bg-neutral-900"
                />
                <label
                  htmlFor="insight-visible"
                  className="text-xs text-neutral-700 dark:text-neutral-300"
                >
                  Visible to patient
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  {isSaving ? 'Saving…' : editor.id ? 'Save insight' : 'Create insight'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modalConfig && confirmModal && (
        <Modal
          isOpen={!!confirmModal}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel={modalConfig.confirmLabel}
          variant={modalConfig.variant}
          isLoading={isConfirmLoading}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};
