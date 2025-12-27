import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkBreaks from 'remark-breaks';
import type { AdminPatient, AdminPatientNote } from '@outlive/shared';
import {
  createPatientNote,
  deletePatientNote,
  listPatientNotes,
  updatePatientNote
} from '@/api/patientNotes';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toaster';

interface PatientNotesPanelProps {
  patient: AdminPatient;
  isActive: boolean;
}

type NoteFilter = 'active' | 'archived';
type ViewState = 'list' | 'editor';

interface NoteEditorState {
  noteId: string | null;
  title: string;
  bodyMarkdown: string;
}

interface ConfirmModal {
  type: 'delete' | 'archive' | 'unarchive' | 'pin' | 'unpin';
  note: AdminPatientNote;
}

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PinIcon = ({ filled = false, className = "h-4 w-4" }: { filled?: boolean; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    {filled ? (
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    )}
  </svg>
);

const ArchiveIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const TrashIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BackIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const NoteIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

const NoteSkeletonItem: React.FC = () => (
  <div className="p-4">
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-3/4" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    </div>
  </div>
);

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const PatientNotesPanel: React.FC<PatientNotesPanelProps> = ({ patient, isActive }) => {
  const toast = useToast();
  const [activeNotes, setActiveNotes] = useState<AdminPatientNote[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<AdminPatientNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('active');
  const [viewState, setViewState] = useState<ViewState>('list');
  const [editor, setEditor] = useState<NoteEditorState>({
    noteId: null,
    title: '',
    bodyMarkdown: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Get notes based on current filter
  const notes = filter === 'active' ? activeNotes : archivedNotes;

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === editor.noteId) ?? null,
    [notes, editor.noteId]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedNote && editor.bodyMarkdown.trim()) return true;
    if (!selectedNote) return false;
    return (
      editor.title !== (selectedNote.title ?? '') ||
      editor.bodyMarkdown !== selectedNote.bodyMarkdown
    );
  }, [selectedNote, editor]);

  const loadNotesFor = useCallback(
    async (target: NoteFilter, forceReload = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await listPatientNotes(patient.id, {
          page: 1,
          pageSize: 50,
          search: search.trim() || undefined,
          includeArchived: target === 'archived'
        });

        if (target === 'active') {
          setActiveNotes(res.data.notes);
        } else {
          setArchivedNotes(res.data.notes);
        }
      } catch (err) {
        const msg = typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message ?? 'Failed to load notes'
          : 'Failed to load notes';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [patient.id, search, toast]
  );

  useEffect(() => {
    if (isActive) {
      void loadNotesFor(filter, true);
    }
  }, [isActive, filter, loadNotesFor]);

  const handleFilterChange = (newFilter: NoteFilter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
  };

  const handleSelectNote = (note: AdminPatientNote) => {
    setEditor({
      noteId: note.id,
      title: note.title ?? '',
      bodyMarkdown: note.bodyMarkdown
    });
    setViewState('editor');
  };

  const handleNewNote = () => {
    setEditor({
      noteId: null,
      title: '',
      bodyMarkdown: ''
    });
    setViewState('editor');
  };

  const handleBackToList = () => {
    setViewState('list');
  };

  const handleSave = async () => {
    if (!editor.bodyMarkdown.trim()) return;
    try {
      setIsSaving(true);
      setError(null);

      if (editor.noteId) {
        const res = await updatePatientNote(editor.noteId, {
          title: editor.title.trim() || null,
          bodyMarkdown: editor.bodyMarkdown
        });

        // Update in whichever list contains this note
        setActiveNotes((prev) =>
          prev.map((n) => (n.id === res.data.id ? res.data : n))
        );
        setArchivedNotes((prev) =>
          prev.map((n) => (n.id === res.data.id ? res.data : n))
        );
        toast.success('Note saved');
      } else {
        const res = await createPatientNote(patient.id, {
          title: editor.title.trim() || undefined,
          bodyMarkdown: editor.bodyMarkdown
        });

        // New notes go to active list
        setActiveNotes((prev) => [res.data, ...prev]);
        setEditor({
          noteId: res.data.id,
          title: res.data.title ?? '',
          bodyMarkdown: res.data.bodyMarkdown
        });
        toast.success('Note created');
      }
    } catch (err) {
      const msg = typeof err === 'object' && err && 'message' in err
        ? (err as { message?: string }).message ?? 'Failed to save note'
        : 'Failed to save note';
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
      const { type, note } = confirmModal;

      if (type === 'delete') {
        await deletePatientNote(note.id);
        // Remove from both lists
        setActiveNotes((prev) => prev.filter((n) => n.id !== note.id));
        setArchivedNotes((prev) => prev.filter((n) => n.id !== note.id));

        if (editor.noteId === note.id) {
          setViewState('list');
          setEditor({ noteId: null, title: '', bodyMarkdown: '' });
        }
        toast.success('Note deleted');
      } else if (type === 'archive' || type === 'unarchive') {
        const res = await updatePatientNote(note.id, { isArchived: type === 'archive' });
        // Update local lists so UI responds immediately
        if (type === 'archive') {
          setActiveNotes((prev) => prev.filter((n) => n.id !== note.id));
          setArchivedNotes((prev) => [res.data, ...prev]);
        } else {
          setArchivedNotes((prev) => prev.filter((n) => n.id !== note.id));
          setActiveNotes((prev) => [res.data, ...prev]);
        }
        toast.success(type === 'archive' ? 'Note archived' : 'Note unarchived');
      } else if (type === 'pin' || type === 'unpin') {
        const res = await updatePatientNote(note.id, { isPinned: type === 'pin' });
        if (filter === 'active') {
          setActiveNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)));
        } else {
          setArchivedNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)));
        }
        toast.success(type === 'pin' ? 'Note pinned' : 'Note unpinned');
      }

      setConfirmModal(null);
    } catch (err) {
      const msg = typeof err === 'object' && err && 'message' in err
        ? (err as { message?: string }).message ?? 'Action failed'
        : 'Action failed';
      toast.error(msg);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadNotesFor(filter, true);
  };

  const renderNotePreview = (note: AdminPatientNote) => {
    const text = note.bodyPlaintext?.trim() || note.bodyMarkdown.replace(/[#*_`>~\-\[\]]+/g, '').trim();
    return text.slice(0, 80);
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes]);

  const getModalConfig = () => {
    if (!confirmModal) return null;
    const { type, note } = confirmModal;
    const title = note.title || 'Untitled';

    switch (type) {
      case 'delete':
        return {
          title: 'Delete Note',
          message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
          confirmLabel: 'Delete',
          variant: 'danger' as const
        };
      case 'archive':
        return {
          title: 'Archive Note',
          message: `Archive "${title}"? You can find it later in the Archived tab.`,
          confirmLabel: 'Archive',
          variant: 'default' as const
        };
      case 'unarchive':
        return {
          title: 'Unarchive Note',
          message: `Move "${title}" back to active notes?`,
          confirmLabel: 'Unarchive',
          variant: 'default' as const
        };
      case 'pin':
        return {
          title: 'Pin Note',
          message: `Pin "${title}" to the top of your notes list?`,
          confirmLabel: 'Pin',
          variant: 'default' as const
        };
      case 'unpin':
        return {
          title: 'Unpin Note',
          message: `Remove "${title}" from pinned notes?`,
          confirmLabel: 'Unpin',
          variant: 'default' as const
        };
      default:
        return null;
    }
  };

  const modalConfig = getModalConfig();

  // List View
  if (viewState === 'list') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-neutral-200 p-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleNewNote}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            <PlusIcon />
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 border-b border-neutral-200 p-3 dark:border-neutral-800">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-shrink-0 gap-1 border-b border-neutral-200 p-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => handleFilterChange('active')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === 'active'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('archived')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === 'archived'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && notes.length === 0 ? (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {Array.from({ length: 4 }).map((_, index) => (
                <NoteSkeletonItem key={index} />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                <NoteIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No notes yet</p>
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  Create your first note
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectNote(note)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-2">
                      {note.isPinned && (
                        <span className="mt-0.5 flex-shrink-0 text-amber-500">
                          <PinIcon filled className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {note.title || 'Untitled'}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                          {renderNotePreview(note) || 'Empty note'}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                          <span>{formatRelativeTime(note.updatedAt)}</span>
                          <span>·</span>
                          <span className="truncate">{note.createdBy.email?.split('@')[0] || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Quick Actions */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ type: note.isPinned ? 'unpin' : 'pin', note });
                      }}
                      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                        note.isPinned
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-neutral-100 text-neutral-500 hover:text-neutral-700 dark:bg-neutral-700 dark:text-neutral-400'
                      }`}
                      title={note.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <PinIcon filled={note.isPinned} className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ type: note.isArchived ? 'unarchive' : 'archive', note });
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 transition-colors hover:text-neutral-700 dark:bg-neutral-700 dark:text-neutral-400"
                      title={note.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <ArchiveIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ type: 'delete', note });
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {modalConfig && (
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
  }

  // Editor View
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <button
          type="button"
          onClick={handleBackToList}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <BackIcon />
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={editor.title}
            onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Untitled"
            className="w-full border-0 bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !editor.bodyMarkdown.trim()}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          {isSaving ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {editor.noteId ? 'Save' : 'Create'}
        </button>
      </div>

      {/* Note Actions */}
      {selectedNote && (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirmModal({ type: selectedNote.isPinned ? 'unpin' : 'pin', note: selectedNote })}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
                selectedNote.isPinned
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <PinIcon filled={selectedNote.isPinned} className="h-3.5 w-3.5" />
              {selectedNote.isPinned ? 'Pinned' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmModal({ type: selectedNote.isArchived ? 'unarchive' : 'archive', note: selectedNote })}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
                selectedNote.isArchived
                  ? 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <ArchiveIcon className="h-3.5 w-3.5" />
              {selectedNote.isArchived ? 'Archived' : 'Archive'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmModal({ type: 'delete', note: selectedNote })}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="flex-shrink-0 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          Unsaved changes
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden" data-color-mode="light">
        <MDEditor
          value={editor.bodyMarkdown}
          onChange={(val) => setEditor((prev) => ({ ...prev, bodyMarkdown: val || '' }))}
          preview="live"
          height="100%"
          visibleDragbar={false}
          className="notes-editor"
          textareaProps={{
            placeholder: 'Write your note here...',
          }}
          previewOptions={{
            // Treat single newlines as hard line breaks in rendered markdown
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            remarkPlugins: [remarkBreaks as any],
          }}
        />
      </div>

      {modalConfig && (
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
