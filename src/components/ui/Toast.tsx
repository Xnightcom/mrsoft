import React from 'react';
import { useToast, ToastType } from '@/hooks/useToast';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function ToastProvider() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ id, message, type, onDismiss }: { id: string; message: string; type: ToastType; onDismiss: () => void }) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#0F0F0F]',
          border: 'border-[#1A6B1A]',
          icon: <CheckCircle className="h-5 w-5 text-[#1A6B1A]" />,
        };
      case 'error':
        return {
          bg: 'bg-[#0F0F0F]',
          border: 'border-[#CC0000]',
          icon: <AlertCircle className="h-5 w-5 text-[#CC0000]" />,
        };
      default:
        return {
          bg: 'bg-[#0F0F0F]',
          border: 'border-[#1A3A6B]',
          icon: <Info className="h-5 w-5 text-[#1A3A6B]" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`animate-toast-in flex items-center gap-3 p-4 rounded-xl border-l-[4px] border border-y-white/10 border-r-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${styles.bg} ${styles.border}`}
      role="alert"
    >
      <div className="shrink-0">{styles.icon}</div>
      <p className="text-sm font-medium text-white max-w-[300px] flex-1 break-words">{message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 ml-2 text-white/50 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
