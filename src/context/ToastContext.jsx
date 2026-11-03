import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { ok: CheckCircle2, info: Info, warn: TriangleAlert };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ toast: push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || Info;
          return (
            <div key={t.id} className={`toast toast--${t.tone}`}>
              <Icon size={18} aria-hidden /> <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext).toast;
