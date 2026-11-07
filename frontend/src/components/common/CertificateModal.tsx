import React from 'react';
import {
  Award,
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export interface CertificateData {
  id: string;
  studentId: string;
  studentName: string;
  packageName: string;
  packageNameHe?: string | null;
  levelAchieved: string;
  levelAchievedHe?: string | null;
  completionDate: string;
  certificateNumber: string;
  verificationCode?: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  const { language } = useTranslation();
  const isHe = language === 'he';

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(certificate.completionDate).toLocaleDateString(
    isHe ? 'he-IL' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jerusalem',
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8">
        {/* Modal Top Bar */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/60 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {isHe ? 'תעודת סיום רשמית - ENGREW' : 'Official Certificate of Completion'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHe ? 'הדפס / שמור כ-PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-6 sm:p-12 bg-amber-50/30 dark:bg-slate-950 flex flex-col items-center justify-center text-center relative overflow-hidden select-none">
          {/* Decorative Corner Accents */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-500/40 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-500/40 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-500/40 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-500/40 rounded-br-xl pointer-events-none" />

          {/* Certificate Inner Frame */}
          <div className="w-full max-w-2xl p-8 sm:p-12 rounded-3xl border-4 border-double border-amber-500/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl flex flex-col items-center relative">
            {/* Watermark Seal */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 p-0.5 shadow-lg mb-6 ring-4 ring-amber-400/20">
              <div className="w-full h-full rounded-full bg-slate-950 text-amber-400 font-serif flex flex-col items-center justify-center border-2 border-amber-300/40">
                <span className="text-2xl leading-none">✡</span>
                <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">ENGREW</span>
              </div>
            </div>

            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 mb-1">
              {isHe ? 'האקדמיה ללימודי עברית מודרנית' : 'Engrew Hebrew Language Academy'}
            </p>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-wide uppercase font-serif mb-2">
              {isHe ? 'תעודת סיום והצטיינות' : 'Certificate of Completion'}
            </h1>

            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-2" />

            <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4">
              {isHe ? 'זאת לתעודה כי התלמיד/ה' : 'This official certificate is proudly awarded to'}
            </p>

            {/* Student Name */}
            <h2 className="text-3xl sm:text-4xl font-black text-teal-800 dark:text-teal-300 tracking-tight font-serif mb-4 underline decoration-amber-400/50 decoration-2 underline-offset-8">
              {certificate.studentName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed mb-6">
              {isHe ? (
                <>
                  השלים/ה בהצלחה את כל מפגשי הלימוד והמשימות המעשיות במסלול{' '}
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {certificate.packageNameHe || certificate.packageName}
                  </span>{' '}
                  והגיע/ה לרמת שליטה{' '}
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">
                    {certificate.levelAchievedHe || certificate.levelAchieved}
                  </span>
                  .
                </>
              ) : (
                <>
                  has successfully completed all intensive 1-on-1 sessions and practical milestones in{' '}
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {certificate.packageName}
                  </span>{' '}
                  demonstrating verified proficiency at level{' '}
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {certificate.levelAchieved}
                  </span>
                  .
                </>
              )}
            </p>

            {/* Verification Footer */}
            <div className="w-full pt-6 mt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div className="text-start">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  {isHe ? 'תאריך סיום והסמכה:' : 'Completion Date:'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formattedDate}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Israel Standard Time (IDT)</span>
              </div>

              <div className="text-end">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  {isHe ? 'מספר תעודה מאומת:' : 'Serial Certificate ID:'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                  {certificate.certificateNumber}
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5 flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3 inline" />
                  {isHe ? 'מאומת במערכת' : 'Blockchain & DB Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

