import React, { useState } from 'react';
import { X, Copy, Check, Share2, Award, Star, Video, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { haptics } from '../../utils/haptics';
import { triggerConfetti } from '../../utils/confetti';
import { toast } from '../../store/toastStore';
import { getAvatarUrl } from '../../utils/avatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teacher: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
}

export const TeacherShareModal: React.FC<Props> = ({ isOpen, onClose, teacher }) => {
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const teacherSlug = `${teacher.firstName.toLowerCase()}-${teacher.lastName.toLowerCase()}`;
  const shareUrl = `https://engrew.com/teacher/${teacherSlug}`;

  const handleCopyLink = () => {
    haptics.success();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    triggerConfetti.celebrate();
    toast.success(
      language === 'he' ? 'קישור הפרופיל הועתק בהצלחה!' : 'Profile share link copied to clipboard!'
    );
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    haptics.tap();
    const text = encodeURIComponent(
      language === 'he'
        ? `היי! אני מזמין אותך ללמוד עברית מדוברת בשיעורים אישיים 1-על-1 ב-Engrew Hebrew Academy:\n${shareUrl}`
        : `Hi! I invite you to learn conversational Hebrew with me 1-on-1 on Engrew Hebrew Academy:\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-700 dark:text-brand-teal-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {language === 'he' ? 'כרטיס מורה וקישור לשיתוף' : 'Share Instructor Profile'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'he' ? 'שתף את פרופיל ההוראה שלך עם תלמידים חדשים' : 'Share with prospective Hebrew students'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Preview Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-teal-900 via-brand-teal-850 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-teal-800 text-white flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-brand-olive-400/40 shrink-0">
              {teacher.avatarUrl ? (
                <img
                  src={getAvatarUrl(teacher.avatarUrl)}
                  alt={teacher.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>{language === 'he' ? 'מורה מוסמך' : 'Certified Native'}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>4.98 (98)</span>
                </span>
              </div>
              <h4 className="text-lg font-black tracking-tight truncate">
                {teacher.firstName} {teacher.lastName}
              </h4>
              <p className="text-xs text-brand-teal-100/80 truncate">
                {language === 'he' ? 'מומחה בהוראת עברית מדוברת ואולפן' : 'Conversational Hebrew & Ulpan Specialist'}
              </p>
            </div>
          </div>
        </div>

        {/* Share Link Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === 'he' ? 'קישור פרופיל אישי' : 'Personal Profile Link'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-teal-800 hover:bg-brand-teal-900 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (language === 'he' ? 'הועתק!' : 'Copied!') : (language === 'he' ? 'העתק' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* 1-Click WhatsApp Share */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{language === 'he' ? 'שתף בוואטסאפ (WhatsApp)' : 'Share via WhatsApp'}</span>
        </button>
      </div>
    </div>
  );
};
