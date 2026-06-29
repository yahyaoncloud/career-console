import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...options, id };
    setToasts((prev) => [...prev, newToast]);

    if (options.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = React.useMemo(() => ({
    toast: addToast,
    success: (message: string, title?: string) => addToast({ type: 'success', message, title }),
    error: (message: string, title?: string) => addToast({ type: 'error', message, title }),
    warning: (message: string, title?: string) => addToast({ type: 'warning', message, title }),
    info: (message: string, title?: string) => addToast({ type: 'info', message, title }),
  }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 md:p-6 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto w-full flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full fade-in duration-300",
              "bg-white dark:bg-zinc-900",
              t.type === 'success' && "border-emerald-200 dark:border-emerald-900/30",
              t.type === 'error' && "border-rose-200 dark:border-rose-900/30",
              t.type === 'warning' && "border-amber-200 dark:border-amber-900/30",
              t.type === 'info' && "border-indigo-200 dark:border-indigo-900/30"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
              {t.type === 'error' && <AlertCircle size={18} className="text-rose-500" />}
              {t.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
              {t.type === 'info' && <Info size={18} className="text-indigo-500" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-bold font-sans text-zinc-900 dark:text-zinc-100">{t.title}</p>}
              <p className={cn("text-sm", t.title ? "text-zinc-500 dark:text-zinc-400 mt-1" : "text-zinc-900 dark:text-zinc-100 font-medium")}>
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
