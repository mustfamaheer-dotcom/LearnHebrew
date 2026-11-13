import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { AttendanceAndGamesModal } from '../teacher/AttendanceAndGamesModal';
import { StudentExamsAndWalletModal } from '../student/StudentExamsAndWalletModal';
import { Layers, Award, Gamepad2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const EnterpriseQuickAccessFloatingBar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { language } = useTranslation();
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="fixed bottom-6 end-6 z-40 flex items-center gap-2">
        {user.role === 'STUDENT' && (
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-teal-700 to-brand-teal-800 hover:from-brand-teal-800 hover:to-brand-teal-900 text-white rounded-full font-bold text-xs shadow-xl transition-all hover:scale-105 active:scale-95 border border-white/20"
          >
            <Layers className="w-4 h-4 text-brand-olive-300" />
            <span>
              {language === 'he' ? 'חבילות שיעורים ומבחנים' : 'Session Packages & Exams'}
            </span>
          </button>
        )}

        {user.role === 'TEACHER' && (
          <button
            onClick={() => setIsTeacherModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full font-bold text-xs shadow-xl transition-all hover:scale-105 active:scale-95 border border-white/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {language === 'he' ? 'רישום נוכחות ופתיחת משחקים' : 'Mark Attendance & Unlock Games'}
            </span>
          </button>
        )}
      </div>

      <StudentExamsAndWalletModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />

      {isTeacherModalOpen && (
        <AttendanceAndGamesModal
          lessonId="latest"
          studentId="latest"
          studentName={language === 'he' ? 'תלמיד נבחר' : 'Selected Student'}
          onClose={() => setIsTeacherModalOpen(false)}
        />
      )}
    </>
  );
};
