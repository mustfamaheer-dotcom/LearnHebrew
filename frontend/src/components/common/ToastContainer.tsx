import React from 'react';
import { useToastStore, ToastItem } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: {
    container: 'border-emerald-200 dark:border-emerald-800/80 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
    icon: 'text-emerald-600 dark:text-emerald-400',
    accent: 'bg-emerald-500',
  },
  error: {
    container: 'border-rose-200 dark:border-rose-800/80 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
    icon: 'text-rose-600 dark:text-rose-400',
    accent: 'bg-rose-500',
  },
  warning: {
    container: 'border-amber-200 dark:border-amber-800/80 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
    icon: 'text-amber-600 dark:text-amber-400',
    accent: 'bg-amber-500',
  },
  info: {
    container: 'border-brand-teal-200 dark:border-brand-teal-800/80 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
    icon: 'text-brand-teal-600 dark:text-brand-teal-400',
    accent: 'bg-brand-teal-600',
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 end-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item: ToastItem) => {
        const Icon = icons[item.type] || Info;
        const colorStyle = styles[item.type] || styles.info;

        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border ${colorStyle.container} transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}
          >
            <div className="p-1 rounded-xl shrink-0 mt-0.5">
              <Icon className={`w-5 h-5 ${colorStyle.icon}`} />
            </div>

            <div className="flex-1 overflow-hidden">
              {item.title && (
                <h4 className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white mb-0.5">
                  {item.title}
                </h4>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {item.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

