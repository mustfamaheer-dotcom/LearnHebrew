import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherActionsApi } from '../../lib/enterpriseApi';
import { api } from '../../lib/api';
import { toast } from '../../store/toastStore';
import { CheckCircle2, XCircle, Gamepad2, X, Award, ShieldAlert } from 'lucide-react';

interface Props {
  lessonId: string;
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const AttendanceAndGamesModal: React.FC<Props> = ({
  lessonId,
  studentId,
  studentName,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedGameId, setSelectedGameId] = useState<string>('');

  const { data: games = [] } = useQuery({
    queryKey: ['available-games'],
    queryFn: async () => {
      const res = await api.get('/games');
      return res.data || [];
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (status: 'ATTENDED' | 'ABSENT' | 'EXCUSED') =>
      teacherActionsApi.markAttendance(lessonId, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-calendar'] });
      toast.success(`Student attendance marked as: ${status}! Notification sent to student.`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to mark attendance'),
  });

  const unlockGameMutation = useMutation({
    mutationFn: () => teacherActionsApi.unlockGame(selectedGameId, studentId, lessonId),
    onSuccess: () => {
      toast.success('Practice game unlocked for student! They can play 1 time until next session.');
      setSelectedGameId('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to unlock game'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Post-Session Management</h3>
            <p className="text-xs text-slate-500">Student: {studentName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Attendance Action */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Mark Student Attendance</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => markAttendanceMutation.mutate('ATTENDED')}
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm hover:bg-emerald-100 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Attended ✅
            </button>
            <button
              onClick={() => markAttendanceMutation.mutate('ABSENT')}
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-sm hover:bg-red-100 transition"
            >
              <XCircle className="w-4 h-4" /> Absent ⚠️
            </button>
          </div>
        </div>

        {/* 2. Unlock Game for Student */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4 text-indigo-500" /> 2. Unlock Post-Lesson Practice Game
          </h4>
          <p className="text-xs text-slate-500">
            The student can play this game 1 time. It locks automatically after play until your next lesson.
          </p>

          <div className="flex gap-2">
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
            >
              <option value="">Select a game to unlock</option>
              {games.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.gameType}) — +{g.pointsReward} pts
                </option>
              ))}
            </select>
            <button
              onClick={() => unlockGameMutation.mutate()}
              disabled={!selectedGameId || unlockGameMutation.isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Unlock
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
