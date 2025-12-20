import React, { createContext, useContext, useEffect, useState } from 'react';

interface PreferencesContextValue {
  pageSize: number;
  setPageSize: (size: number) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const PAGE_SIZE_STORAGE_KEY = 'outlive_admin_page_size';

const getInitialPageSize = (): number => {
  if (typeof window === 'undefined') return 10;

  const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return 10;
  }

  return parsed;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageSize, setPageSizeState] = useState<number>(() => getInitialPageSize());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [pageSize]);

  const setPageSize = (size: number) => {
    const safeSize = Math.min(Math.max(size, 1), 100);
    setPageSizeState(safeSize);
  };

  return (
    <PreferencesContext.Provider
      value={{
        pageSize,
        setPageSize
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextValue => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
};

