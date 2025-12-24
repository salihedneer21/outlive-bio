import React from 'react';

interface ImageViewerProps {
  label: string;
  url: string | null | undefined;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ label, url }) => {
  if (!url) {
    return (
      <div className="space-y-1 rounded-lg border border-dashed border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        <div className="font-medium text-neutral-700 dark:text-neutral-200">{label}</div>
        <div>No file uploaded</div>
      </div>
    );
  }

  const lower = url.toLowerCase();
  const isPdf = lower.includes('.pdf');

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="font-medium text-neutral-800 dark:text-neutral-100">{label}</div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14h14" />
          </svg>
          Open
        </a>
      </div>

      {isPdf ? (
        <div className="flex items-center gap-2 rounded-md bg-neutral-100 p-2 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2a2 2 0 00-2 2v16c0 1.1.9 2 2 2h7.5a2 2 0 001.414-.586l3.5-3.5A2 2 0 0019 17.5V4a2 2 0 00-2-2H6zm0 2h11v13.5L15.5 19H6V4z" />
          </svg>
          <span>PDF file – click &quot;Open&quot; to view</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
          <img
            src={url}
            alt={label}
            className="max-h-56 w-full object-contain bg-white dark:bg-neutral-900"
          />
        </div>
      )}
    </div>
  );
}

