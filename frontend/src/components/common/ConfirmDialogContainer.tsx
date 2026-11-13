import React, { useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useConfirmDialogStore } from '../../store/confirmDialogStore';
import { haptics } from '../../utils/haptics';
import {
  AlertTriangle,
  Trash2,
  HelpCircle,
  X,
  ShieldAlert,
} from 'lucide-react';

export const ConfirmDialogContainer: React.FC = () => {
  const { language } = useTranslation();
  const { isOpen, options, handleConfirm, handleCancel } = useConfirmDialogStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel, handleConfirm]);

  if (!isOpen || !options) return null;

  const isHe = language === 'he';
  const variant = options.variant || 'danger';

  // Localized texts
  const title = isHe
    ? options.titleHe || options.title || 'אישור פעולה'
    : options.title || 'Confirm Action';

  const message = isHe
    ? options.messageHe || options.message
    : options.message;

  const confirmText = isHe
    ? options.confirmTextHe || options.confirmText || (variant === 'danger' ? 'מחק / אשר' : 'אישור')
    : options.confirmText || (variant === 'danger' ? 'Delete' : 'Confirm');

  const cancelText = isHe
    ? options.cancelTextHe || options.cancelText || 'ביטול'
    : options.cancelText || 'Cancel';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Stripe */}
        <div
          className={`h-1.5 w-full ${
            variant === 'danger'
              ? 'bg-gradient-to-r from-rose-500 to-rose-600'
              : variant === 'warning'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600'
              : 'bg-gradient-to-r from-brand-teal-500 to-brand-teal-700'
          }`}
        />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header with Icon and Close Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                  variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60'
                    : variant === 'warning'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
                    : 'bg-teal-50 text-brand-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60'
                }`}
              >
                {variant === 'danger' ? (
                  <Trash2 className="w-6 h-6 animate-pulse" />
                ) : variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  {variant === 'danger'
                    ? isHe ? 'פעולה בלתי הפיכה' : 'Destructive Action'
                    : isHe ? 'אישור מערכת' : 'System Prompt'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dialog Message */}
          <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            {message}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                handleCancel();
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.tap();
                handleConfirm();
              }}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs text-white shadow-md active:scale-95 transition-all ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 ring-2 ring-rose-500/20'
                  : variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                  : 'bg-brand-teal-800 hover:bg-brand-teal-900 shadow-brand-teal-800/25'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
