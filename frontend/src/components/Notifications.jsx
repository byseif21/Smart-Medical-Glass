import { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { NotificationsContext } from '../hooks/useNotifications';

const baseToastClasses =
  'w-full max-w-sm rounded-xl border px-4 py-3 shadow-medical-lg animate-slide-down pointer-events-auto';

const typeStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-sky-50 border-sky-200 text-sky-900',
};

const typeIcon = {
  success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  info: <Info className="h-5 w-5 text-sky-600" />,
};

const Toast = ({ toast, onDismiss }) => {
  const variant = typeStyles[toast.type] || typeStyles.info;

  return (
    <div className={`${baseToastClasses} ${variant}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{typeIcon[toast.type] || typeIcon.info}</div>
        <div className="flex-1 min-w-0">
          {toast.title ? <div className="font-semibold leading-5">{toast.title}</div> : null}
          {toast.message ? (
            <div className={`text-sm ${toast.title ? 'mt-0.5' : ''}`}>{toast.message}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-md px-2 py-1 text-sm hover:bg-black/5"
          aria-label="Dismiss notification"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
};

export const NotificationsProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ type = 'info', title, message, durationMs = 4500 } = {}) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const toast = { id, type, title, message };

      setToasts((current) => [toast, ...current].slice(0, 4));

      if (durationMs > 0) {
        const timeout = setTimeout(() => dismiss(id), durationMs);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationsContext.Provider>
  );
};
