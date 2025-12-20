import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string) => void;
  error: (title: string) => void;
  info: (title: string) => void;
  warning: (title: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 150);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      const timer = setTimeout(handleRemove, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleRemove]);

  return (
    <div
      onClick={handleRemove}
      className={`
        cursor-pointer rounded-md border px-3 py-2 shadow-sm
        bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800
        transition-all duration-150
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}
      `}
      role="alert"
    >
      <p className="text-xs text-neutral-900 dark:text-neutral-100">{toast.title}</p>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const success = useCallback(
    (title: string) => addToast({ type: 'success', title }),
    [addToast]
  );

  const error = useCallback(
    (title: string) => addToast({ type: 'error', title, duration: 5000 }),
    [addToast]
  );

  const info = useCallback(
    (title: string) => addToast({ type: 'info', title }),
    [addToast]
  );

  const warning = useCallback(
    (title: string) => addToast({ type: 'warning', title, duration: 4000 }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
