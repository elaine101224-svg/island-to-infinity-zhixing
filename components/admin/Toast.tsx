'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Access toast notifications from any client component rendered inside the
 * admin layout: `const toast = useToast(); toast.success('Saved');`
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    success: (message: string) => ctx.show('success', message),
    error: (message: string) => ctx.show('error', message),
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 w-[calc(100%-3rem)] sm:w-auto sm:max-w-sm"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const Icon = isSuccess ? CheckCircle2 : AlertCircle;
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 bg-white rounded-xl shadow-lg border border-sand pl-4 pr-3 py-3.5 animate-toast-in border-l-4 ${
                isSuccess ? 'border-l-sage' : 'border-l-red-500'
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  isSuccess ? 'text-sage' : 'text-red-500'
                }`}
              />
              <p className="flex-1 text-sm text-earth-dark leading-snug">
                {toast.message}
              </p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-earth-light hover:text-earth-dark transition-colors flex-shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
