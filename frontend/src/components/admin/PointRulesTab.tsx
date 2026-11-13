import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { pointRulesApi } from '../../lib/enterpriseApi';
import { PointRuleModel } from '../../types';
import { toast } from '../../store/toastStore';
import {
  Coins,
  Save,
  Edit3,
  Calendar,
  FileText,
  Gamepad2,
  Flame,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  X,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'SESSION_COMPLETED':
      return CheckCircle2;
    case 'HOMEWORK_SUBMITTED':
      return FileText;
    case 'GAME_PLAYED':
      return Gamepad2;
    case 'STREAK_MILESTONE':
      return Flame;
    default:
      return Sparkles;
  }
};

const getEventTitle = (eventType: string, lang: string) => {
  if (lang === 'he') {
    switch (eventType) {
      case 'SESSION_COMPLETED':
        return 'השלמת שיעור חי';
      case 'HOMEWORK_SUBMITTED':
        return 'הגשת שיעורי בית';
      case 'GAME_PLAYED':
        return 'משחק לימודי 3D';
      case 'STREAK_MILESTONE':
        return 'רצף ימי למידה (Streak)';
      default:
        return eventType;
    }
  }
  switch (eventType) {
    case 'SESSION_COMPLETED':
      return 'Completed Live Session';
    case 'HOMEWORK_SUBMITTED':
      return 'Homework Assignment Submitted';
    case 'GAME_PLAYED':
      return 'Practice Game Completed';
    case 'STREAK_MILESTONE':
      return 'Learning Streak Milestone';
    default:
      return eventType;
  }
};

export const PointRulesTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<PointRuleModel | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['point-rules'],
    queryFn: pointRulesApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { points: number; isActive?: boolean; description?: string } }) =>
      pointRulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-rules'] });
      toast.success(language === 'he' ? 'חוק הנקודות עודכן בהצלחה' : 'Reward points value updated');
      setEditingRule(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בעדכון חוק נקודות' : 'Failed to update rule')),
  });

  const handleQuickAdjust = (r: PointRuleModel, delta: number) => {
    const newPoints = Math.max(1, r.points + delta);
    updateMutation.mutate({ id: r.id, data: { points: newPoints } });
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Coins}
        badgeText={language === 'he' ? 'מנוע כלכלת נקודות ומשחוק' : 'Gamification Economy Engine'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'חוקי נקודות ותגמולים' : 'Reward & Point Rules'}
        description={
          language === 'he'
            ? 'התאמת כלכלת הנקודות ברחבי הפלטפורמה. שליטה על כמות הנקודות המוענקות עבור שיעורים שהושלמו, משחקים לימודיים, רצפי למידה ושיעורי בית.'
            : 'Fine-tune the points economy across the platform. Control points awarded per completed session, educational games, learning streaks, and homework.'
        }
      />

      {/* EDIT RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <Coins className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {getEventTitle(editingRule.eventType, language)}
                </h3>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'כמות נקודות לתגמול' : 'Points Awarded'}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    value={editingRule.points}
                    onChange={(e) => setEditingRule({ ...editingRule, points: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingRule({ ...editingRule, points: Math.max(1, editingRule.points - 5) })}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRule({ ...editingRule, points: editingRule.points + 5 })}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'תיאור והסבר לתלמיד' : 'Rule Description'}
                </label>
                <textarea
                  rows={2}
                  value={editingRule.description || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingRule.isActive !== false}
                    onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                    className="rounded text-brand-teal-800 focus:ring-brand-teal-700 w-4 h-4"
                  />
                  <span>{language === 'he' ? 'חוק פעיל ומעניק נקודות' : 'Active Reward Rule'}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingRule) {
                    updateMutation.mutate({
                      id: editingRule.id,
                      data: {
                        points: editingRule.points,
                        description: editingRule.description,
                        isActive: editingRule.isActive,
                      },
                    });
                  }
                }}
                disabled={updateMutation.isPending}
                className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
              >
                {updateMutation.isPending
                  ? (language === 'he' ? 'שומר...' : 'Saving...')
                  : (language === 'he' ? 'שמור שינויים' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULES CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rules.map((r) => {
          const Icon = getEventIcon(r.eventType);
          const isStreak = r.eventType === 'STREAK_MILESTONE';

          return (
            <div
              key={r.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {getEventTitle(r.eventType, language)}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400">{r.eventType}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingRule(r)}
                    className="p-1.5 text-slate-400 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={language === 'he' ? 'ערוך חוק' : 'Edit Rule'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    +{r.points}
                  </span>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    {language === 'he' ? 'נקודות' : 'Points'}
                  </span>
                </div>

                {r.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {r.description}
                  </p>
                )}
              </div>

              {/* Quick Adjustment Micro-Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-400">
                  {language === 'he' ? 'כיוונון מהיר:' : 'Quick adjust:'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickAdjust(r, -5)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(r, +5)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(r, +10)}
                    className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-100 transition"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
