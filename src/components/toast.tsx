import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ToastMsg {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
  isHovered?: boolean;
  isExiting?: boolean;
}

const ToastContext = createContext<{ showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastSeq = useRef(0);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timers.current.delete(id);
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, msg, type, isHovered: false, isExiting: false }]);

    const timer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
      setTimeout(() => removeToast(id), 300);
    }, 3000);

    timers.current.set(id, timer);
  }, [removeToast]);

  const handleMouseEnter = (id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isHovered: true } : t)));
  };

  const handleMouseLeave = (id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isHovered: false } : t)));

    const timer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
      setTimeout(() => removeToast(id), 300);
    }, 1500);

    timers.current.set(id, timer);
  };

  const toastContextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={toastContextValue}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => handleMouseEnter(t.id)}
            onMouseLeave={() => handleMouseLeave(t.id)}
            className={`flex items-center px-4 py-3 rounded-lg shadow-xl border text-[13px] font-medium transition-all transform animate-in fade-in slide-in-from-top-5 select-text cursor-text
            ${t.isExiting ? 'fade-out opacity-0' : 'opacity-100'}
            ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/40 dark:border-red-800 dark:text-red-400'
      : t.type === 'success' ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/40 dark:border-green-800 dark:text-green-400'
        : 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400'}`}
          >
            {t.type === 'error' ? (
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            ) : t.type === 'success' ? (
              <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
            ) : (
              <Bell size={16} className="mr-2 flex-shrink-0" />
            )}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).showToast;
}
