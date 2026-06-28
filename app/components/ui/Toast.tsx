import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms — 0 = persist
  action?: ToastAction;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  /** Convenience: confirmation toast with two action buttons */
  confirm: (opts: {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  }) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, 'id'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const duration = opts.duration ?? 4000;

      setToasts((prev) => [...prev, { ...opts, id }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const confirm = useCallback(
    (opts: {
      title: string;
      description?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm: () => void;
    }) => {
      const id = `toast-${Date.now()}`;

      setToasts((prev) => [
        ...prev,
        {
          id,
          title: opts.title,
          description: opts.description,
          variant: 'warning',
          duration: 0, // persist until user responds
          action: {
            label: opts.confirmLabel ?? 'Confirm',
            variant: 'destructive',
            onClick: () => {
              dismiss(id);
              opts.onConfirm();
            },
          },
        } satisfies Toast,
      ]);

      // Auto-dismiss after 10s for safety
      const timer = setTimeout(() => dismiss(id), 10000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, confirm }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Icons by variant ────────────────────────────────────────────────────────
const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />,
  error: <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />,
  info: <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />,
};

const BORDER: Record<ToastVariant, string> = {
  success: 'border-emerald-200 dark:border-emerald-900/60',
  error: 'border-red-200 dark:border-red-900/60',
  warning: 'border-amber-200 dark:border-amber-900/60',
  info: 'border-blue-200 dark:border-blue-900/60',
};

const PROGRESS: Record<ToastVariant, string> = {
  success: 'bg-emerald-500',
  error: 'bg-destructive',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

// ─── Single Toast Card ───────────────────────────────────────────────────────
function ToastCard(props: { t: Toast; onDismiss: () => void }) {
  const { t, onDismiss } = props;

  const [progress, setProgress] = useState(100);
  const variant = t.variant ?? 'info';
  const duration = t.duration ?? 4000;

  useEffect(() => {
    if (duration === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [duration]);

  return (
    <div
      className={`
        group relative flex flex-col gap-1 w-80 max-w-[90vw]
        bg-background text-foreground border-border rounded-lg shadow-xl overflow-hidden
        animate-in slide-in-from-right-full duration-300
        ${BORDER[variant]}
      `}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 h-[2px] w-full bg-border">
          <div
            className={`h-full transition-none ${PROGRESS[variant]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4 pt-5">
        {ICONS[variant]}

        <div className="flex-1 min-w-0">
          <p className="mono-text text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            {t.title}
          </p>
          {t.description && (
            <p className="mono-text text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              {t.description}
            </p>
          )}

          {t.action && (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={t.action.onClick}
                className={`mono-text text-[10px] px-2.5 py-1 rounded border font-bold cursor-pointer transition-colors ${
                  t.action.variant === 'destructive'
                    ? 'bg-destructive text-destructive-foreground border-destructive/80 hover:bg-destructive/90'
                    : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                }`}
              >
                {t.action.label}
              </button>
              <button
                onClick={onDismiss}
                className="mono-text text-[10px] px-2.5 py-1 rounded border border-border text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors cursor-pointer shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Toaster (portal) ────────────────────────────────────────────────────────
function Toaster() {
  const { toasts, dismiss } = useContext(ToastContext)!;

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <React.Fragment key={t.id}>
          <ToastCard t={t} onDismiss={() => dismiss(t.id)} />
        </React.Fragment>
      ))}
    </div>
  );
}
