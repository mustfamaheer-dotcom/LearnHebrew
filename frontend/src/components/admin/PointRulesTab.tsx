import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { pointRulesApi } from '../../lib/enterpriseApi';
import { PointRuleModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Coins, Save, Edit3 } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const PointRulesTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pointsVal, setPointsVal] = useState<number>(0);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['point-rules'],
    queryFn: pointRulesApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, points }: { id: string; points: number }) =>
      pointRulesApi.update(id, { points }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-rules'] });
      toast.success('Reward points value updated');
      setEditingId(null);
    },
  });

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((r) => {
          const isEditing = editingId === r.id;
          return (
            <div
              key={r.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  {language === 'he'
                    ? r.eventType === 'SESSION_COMPLETED'
                      ? 'השלמת שיעור'
                      : r.eventType === 'HOMEWORK_SUBMITTED'
                      ? 'הגשת שיעורי בית'
                      : r.eventType === 'GAME_PLAYED'
                      ? 'משחק לימודי'
                      : r.eventType === 'STREAK_MILESTONE'
                      ? 'רצף ימי למידה'
                      : r.eventType
                    : r.eventType}
                </span>
                <span className="text-xs text-slate-400">
                  {language === 'he' ? 'עודכן:' : 'Updated:'} {new Date(r.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={pointsVal}
                      onChange={(e) => setPointsVal(Number(e.target.value))}
                      className="w-24 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-lg"
                    />
                    <button
                      onClick={() => updateMutation.mutate({ id: r.id, points: pointsVal })}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      title={language === 'he' ? 'שמור' : 'Save'}
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">+{r.points}</span>
                    <span className="text-sm font-semibold text-amber-500">{language === 'he' ? 'נקודות' : 'Points'}</span>
                    <button
                      onClick={() => {
                        setEditingId(r.id);
                        setPointsVal(r.points);
                      }}
                      className="ms-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={language === 'he' ? 'ערוך' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
