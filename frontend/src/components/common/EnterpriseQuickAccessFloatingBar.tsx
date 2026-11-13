import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { AttendanceAndGamesModal } from '../teacher/AttendanceAndGamesModal';
import { StudentExamsAndWalletModal } from '../student/StudentExamsAndWalletModal';
import { Wallet, Award, Gamepad2, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const EnterpriseQuickAccessFloatingBar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {user.role === 'STUDENT' && (
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-bold text-xs shadow-xl transition-all hover:scale-105"
          >
            <Wallet className="w-4 h-4" />
            <span>Session Balances & Exams</span>
          </button>
        )}

        {user.role === 'TEACHER' && (
          <button
            onClick={() => setIsTeacherModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full font-bold text-xs shadow-xl transition-all hover:scale-105"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Attendance & Unlock Games</span>
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
          studentName="Selected Student"
          onClose={() => setIsTeacherModalOpen(false)}
        />
      )}
    </>
  );
};
