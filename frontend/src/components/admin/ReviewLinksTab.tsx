import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { reviewLinksApi } from '../../lib/enterpriseApi';
import { ReviewLinkModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Link2, Plus, Copy, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const ReviewLinksTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ targetUrl: 'https://engrew.com/reviews', label: '' });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['review-links'],
    queryFn: reviewLinksApi.list,
  });

  const createMutation = useMutation({
    mutationFn: reviewLinksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-links'] });
      toast.success('Single-use review link generated');
      setIsCreating(false);
      setForm({ targetUrl: 'https://engrew.com/reviews', label: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewLinksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-links'] });
      toast.success('Link deleted');
    },
  });

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Single-use link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Link2}
        badgeText={language === 'he' ? 'מערכת קישורי משוב מאובטחים' : 'Anti-Fraud Tokenized Reviews'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'קישורי משוב חד-פעמיים' : 'Single-Use Review Links'}
        description={
          language === 'he'
            ? 'הפקת קישורים חד-פעמיים ואישיים לכתיבת משוב. הקישור מנוצל באופן בלתי הפיך בעת ההגשה למניעת ספאם והטיה.'
            : 'Generate private, one-time platform review URLs. The token is irreversibly consumed upon submission to prevent spam and manipulation.'
        }
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'הפק קישור חד-פעמי' : 'Generate Single-Use Link'}</span>
          </button>
        }
      />

      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'הפקת הזמנת משוב' : 'Generate Review Invitation'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'כתובת יעד להפניה' : 'Target Destination URL'}
              </label>
              <input
                type="text"
                placeholder="e.g. Trustpilot / Google Reviews / Internal Form"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'שם מזהה פנימי / תלמיד' : 'Internal Label / Student Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: עבור התלמיד עומר פארוק' : 'e.g. For VIP Student Omar Farouk'}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-sm font-semibold"
            >
              {language === 'he' ? 'הפק קישור' : 'Generate Link'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">{language === 'he' ? 'מזהה ויעד' : 'Label & Target'}</th>
                <th className="p-4">{language === 'he' ? 'כתובת קישור' : 'Single-Use URL'}</th>
                <th className="p-4">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                <th className="p-4">{language === 'he' ? 'זמן שימוש ו-IP' : 'Used At & IP'}</th>
                <th className="p-4 text-end">{language === 'he' ? 'פעולות' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{l.label || 'Standard Review'}</div>
                    <div className="text-xs text-slate-400 font-mono truncate max-w-xs">{l.targetUrl}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      /review/{l.token.substring(0, 12)}...
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        l.isUsed
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {l.isUsed ? 'Consumed (Used)' : 'Available (1-Time)'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {l.isUsed ? (
                      <div>
                        <div>{new Date(l.usedAt!).toLocaleString()}</div>
                        <div className="font-mono text-[10px] text-slate-400">IP: {l.usedByIp || 'Logged'}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not yet visited</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {!l.isUsed && (
                      <button
                        onClick={() => copyToClipboard(l.token)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 rounded-lg"
                        title="Copy single use link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this review link?')) deleteMutation.mutate(l.id);
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
