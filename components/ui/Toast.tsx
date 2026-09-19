'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string, duration?: number) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Event listener fallback for non-React contexts
type ToastEventDetail = {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

export const toast = {
  success: (title: string, description?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('dims-toast', {
          detail: { type: 'success', title, description },
        })
      );
    }
  },
  error: (title: string, description?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('dims-toast', {
          detail: { type: 'error', title, description },
        })
      );
    }
  },
  warning: (title: string, description?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('dims-toast', {
          detail: { type: 'warning', title, description },
        })
      );
    }
  },
  info: (title: string, description?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('dims-toast', {
          detail: { type: 'info', title, description },
        })
      );
    }
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      if (customEvent.detail) {
        const { type, title, description, duration } = customEvent.detail;
        showToast(type, title, description, duration);
      }
    };

    window.addEventListener('dims-toast', handleCustomToast);
    return () => window.removeEventListener('dims-toast', handleCustomToast);
  }, [showToast]);

  const value = {
    showToast,
    success: (title: string, desc?: string) => showToast('success', title, desc),
    error: (title: string, desc?: string) => showToast('error', title, desc),
    warning: (title: string, desc?: string) => showToast('warning', title, desc),
    info: (title: string, desc?: string) => showToast('info', title, desc),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          let Icon = CheckCircle2;
          let iconColor = 'text-[#16A34A]';
          let borderColor = 'border-[#E4E4E0]';
          let bgIcon = 'bg-[#F0FDF4]';

          if (t.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-[#DC2626]';
            borderColor = 'border-[#FCA5A5]';
            bgIcon = 'bg-[#FEF2F2]';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-[#D97706]';
            borderColor = 'border-[#FDE68A]';
            bgIcon = 'bg-[#FFFBEB]';
          } else if (t.type === 'info') {
            Icon = Info;
            iconColor = 'text-[#4F46E5]';
            borderColor = 'border-[#C7D2FE]';
            bgIcon = 'bg-[#EEF2FF]';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white border ${borderColor} rounded-xl shadow-lg transition-all transform translate-y-0 opacity-100 duration-200`}
            >
              <div className={`p-1.5 rounded-lg ${bgIcon} shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-[#141414] leading-snug">{t.title}</p>
                {t.description && (
                  <p className="text-[11px] text-[#8C8C8A] mt-0.5 leading-normal">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md text-[#8C8C8A] hover:text-[#141414] hover:bg-[#F8F8F6] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: toast.info,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
    };
  }
  return context;
};
