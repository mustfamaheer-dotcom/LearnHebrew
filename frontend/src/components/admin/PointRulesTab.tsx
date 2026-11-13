import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointRulesApi } from '../../lib/enterpriseApi';
import { PointRuleModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Coins, Save, Edit3 } from 'lucide-react';

export const PointRulesTab: React.FC = () => {
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          Gamification & Reward Point Rules (Admin Managed)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Adjust the points economy across the platform. Control points awarded per completed session, practice games, streaks, and homework.
        </p>
      </div>

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
                  {r.eventType}
                </span>
                <span className="text-xs text-slate-400">Updated: {new Date(r.updatedAt).toLocaleDateString()}</span>
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
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">+{r.points}</span>
                    <span className="text-sm font-semibold text-amber-500">Points</span>
                    <button
                      onClick={() => {
                        setEditingId(r.id);
                        setPointsVal(r.points);
                      }}
                      className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
