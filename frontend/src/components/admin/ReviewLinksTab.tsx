import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { reviewLinksApi } from '../../lib/enterpriseApi';
import { ReviewLinkModel } from '../../types';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';
import { formatIsraelDateTime } from '../../lib/timeUtils';
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  ExternalLink,
  Check,
  X,
  Sparkles,
  Globe,
  Radio,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const ReviewLinksTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    targetUrl: 'https://engrew.com/reviews',
    label: '',
  });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['review-links'],
    queryFn: reviewLinksApi.list,
  });

  const createMutation = useMutation({
    mutationFn: reviewLinksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-links'] });
      toast.success(language === 'he' ? 'קישור משוב חד-פעמי הופק בהצלחה' : 'Single-use review link generated');
      setIsCreating(false);
      setForm({ targetUrl: 'https://engrew.com/reviews', label: '' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בהפקת קישור' : 'Failed to generate link')),
  });

  const deleteMutation = useMutation({
    mutationFn: reviewLinksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-links'] });
      toast.success(language === 'he' ? 'הקישור הוסר' : 'Link deleted');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה במחיקת קישור' : 'Failed to delete link')),
  });

  const copyToClipboard = (token: string, id: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(language === 'he' ? 'הקישור הועתק ללוח!' : 'Single-use link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const isUsed = Boolean(l.isUsed);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'USED' && isUsed) ||
        (statusFilter === 'ACTIVE' && !isUsed);

      const label = (l.label || '').toLowerCase();
      const target = (l.targetUrl || '').toLowerCase();
      const token = (l.token || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || label.includes(term) || target.includes(term) || token.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [links, statusFilter, searchTerm]);

  // KPIs
  const totalCount = links.length;
  const activeCount = links.filter((l) => !l.isUsed).length;
  const usedCount = links.filter((l) => l.isUsed).length;
  const conversionRate = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Link2}
        badgeText={language === 'he' ? 'מערכת קישורי משוב מאובטחים' : 'Anti-Fraud Tokenized Reviews'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'קישורי משוב חד-פעמיים' : 'Single-Use Review Links'}
        description={
          language === 'he'
            ? 'הפקת קישורים אישיים חד-פעמיים לכתיבת משוב. הקישור מתכלה אוטומטית בעת השימוש למניעת ספאם והטיית דירוגים.'
            : 'Generate verified, single-use review links. Each token is irreversibly consumed upon submission to ensure authentic, unmanipulated student reviews.'
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

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {language === 'he' ? 'סה״כ קישורים שהופקו' : 'Total Links Generated'}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {language === 'he' ? 'פעילים (ממתינים למשוב)' : 'Active (Awaiting Review)'}
          </span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5">{activeCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-xs">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
            {language === 'he' ? 'נוצלו בהצלחה' : 'Redeemed & Consumed'}
          </span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1.5">{usedCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 shadow-xs">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
            {language === 'he' ? 'אחוז המרת משובים' : 'Review Conversion'}
          </span>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1.5">{conversionRate}%</p>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4 shadow-xs animate-in fade-in duration-200">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'הפקת הזמנת משוב מאובטחת' : 'Generate Secure Review Invitation'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'כתובת יעד להפניה (Destination URL)' : 'Target Destination URL'}
              </label>
              <input
                type="text"
                placeholder="https://engrew.com/reviews or Trustpilot URL"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'שם מזהה פנימי / תלמיד' : 'Internal Identifier / Student Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: עומר פארוק - חבילת 20 שיעורים' : 'e.g. Omar Farouk - VIP Student'}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-brand-teal-100 dark:border-slate-800">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
            >
              {createMutation.isPending
                ? (language === 'he' ? 'מפיק...' : 'Generating...')
                : (language === 'he' ? 'הפק קישור' : 'Generate Link')}
            </button>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'he' ? 'חיפוש לפי תלמיד, יעד או קוד טוקן...' : 'Search by student label, target, or token...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'USED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-brand-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && (language === 'he' ? 'הכל' : 'All')}
              {st === 'ACTIVE' && (language === 'he' ? `פעילים (${activeCount})` : `Active (${activeCount})`)}
              {st === 'USED' && (language === 'he' ? `נוצלו (${usedCount})` : `Redeemed (${usedCount})`)}
            </button>
          ))}
        </div>
      </div>

      {/* REPORT TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'מזהה תלמיד ויעד' : 'Label & Target'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'קישור חד-פעמי' : 'Single-Use URL'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'מועד שימוש ו-IP' : 'Redemption Telemetry'}</th>
                <th className="py-3.5 px-4 font-bold text-end">{language === 'he' ? 'פעולות' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLinks.map((l) => {
                const isCopied = copiedId === l.id;
                const formattedUsedTime = l.usedAt
                  ? formatIsraelDateTime(l.usedAt, {
                      includeDate: true,
                      locale: language === 'he' ? 'he-IL' : 'en-US',
                    })
                  : null;

                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {l.label || (language === 'he' ? 'משוב כללי' : 'General Review')}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                        {l.targetUrl}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          /review/{l.token.substring(0, 10)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(l.token, l.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title={language === 'he' ? 'העתק קישור' : 'Copy link'}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.isUsed
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60'
                        }`}
                      >
                        {l.isUsed ? <CheckCircle2 className="w-3 h-3 text-slate-400" /> : <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />}
                        <span>
                          {l.isUsed
                            ? (language === 'he' ? 'נוצל וננעל' : 'Redeemed & Locked')
                            : (language === 'he' ? 'פעיל להגשה' : 'Active & Ready')}
                        </span>
                      </span>
                    </td>

                    <td className="p-4 text-slate-500 text-[11px]">
                      {l.isUsed ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{formattedUsedTime}</div>
                          <div className="text-[10px] font-mono text-slate-400">IP: {l.usedByIp || 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">{language === 'he' ? 'טרם נוצל' : 'Awaiting feedback'}</span>
                      )}
                    </td>

                    <td className="p-4 text-end">
                      <button
                        onClick={async () => {
                          const confirmed = await confirmDialog({
                            title: 'Delete Review Link',
                            titleHe: 'מחיקת קישור משוב',
                            message: `Are you sure you want to delete this single-use review link?`,
                            messageHe: `האם למחוק קישור משוב חד-פעמי זה לצמיתות?`,
                            confirmText: 'Delete Link',
                            confirmTextHe: 'מחק קישור',
                            variant: 'danger',
                          });
                          if (confirmed) {
                            deleteMutation.mutate(l.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title={language === 'he' ? 'מחק' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLinks.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {language === 'he' ? 'לא נמצאו קישורי משוב' : 'No review links found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
