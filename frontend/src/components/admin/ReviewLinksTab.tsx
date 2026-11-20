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
  Star,
  MessageSquare,
  Eye,
  Users,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const ReviewLinksTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isHe = language === 'he';
  const isAr = language === 'ar';
  const isRtl = isHe || isAr;
  const loc = (ar: string, he: string, en: string) => (isAr ? ar : isHe ? he : en);

  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingSubmissions, setInspectingSubmissions] = useState<ReviewLinkModel | null>(null);

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
      toast.success(loc('تم إصدار رابط تقييم معتمد بنجاح', 'קישור משוב מאומת הופק בהצלחה', 'Verified review link generated successfully'));
      setIsCreating(false);
      setForm({ targetUrl: 'https://engrew.com/reviews', label: '' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || loc('خطأ في إصدار الرابط', 'שגיאה בהפקת קישור', 'Failed to generate link')),
  });

  const deleteMutation = useMutation({
    mutationFn: reviewLinksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-links'] });
      toast.success(loc('تم حذف الرابط بنجاح', 'הקישור הוסר', 'Link deleted successfully'));
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || loc('خطأ في حذف الرابط', 'שגיאה במחיקת קישור', 'Failed to delete link')),
  });

  const copyToClipboard = (token: string, id: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(loc('تم نسخ الرابط المعتمد إلى الحافظة!', 'הקישור הועתק ללוח!', 'Verified review link copied to clipboard!'));
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const isUsed = Boolean(l.isUsed || (l.usageCount && l.usageCount > 0));
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
  const activeCount = links.filter((l) => !(l.isUsed || (l.usageCount && l.usageCount > 0))).length;
  const usedCount = links.filter((l) => Boolean(l.isUsed || (l.usageCount && l.usageCount > 0))).length;
  const totalSubmissions = links.reduce((sum, l) => sum + (l.submissions?.length || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Link2}
        badgeText={loc('منظومة تقييمات الطلاب المعتمدة', 'מערכת קישורי משוב מאובטחים', 'Verified Tokenized Review System')}
        statusText={loc('نشط ومستمر', 'פעיל', 'Active')}
        title={loc('روابط تقييم الطلاب المعتمدة', 'קישורי משוב מאומתים', 'Verified Public Review Links')}
        description={
          loc(
            'روابط تقييم دائمة ومعتمدة لمشاركة الطلاب. تدعم الاستخدام المتعدد وتسجيل تقييمات الدروس والمدرسين مباشرة وبأعلى موثوقية.',
            'הפקת קישורים אישיים ומאומתים לכתיבת משוב. הקישורים פעילים באופן רציף ומאפשרים איסוף ביקורות אותנטיות על המורים והאקדמיה.',
            'Generate verified, multi-use review links. Students and clients can access the direct feedback form repeatedly to submit authentic reviews and ratings.'
          )
        }
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{loc('إنشاء رابط تقييم جديد', 'הפק קישור משוב', 'Generate Review Link')}</span>
          </button>
        }
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {loc('إجمالي الروابط المصدرة', 'סה״כ קישורים שהופקו', 'Total Links Generated')}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {loc('روابط نشطة جاهزة', 'פעילים ומוכנים', 'Active & Ready')}
          </span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5">{activeCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-xs">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
            {loc('روابط جرى فتحها', 'קישורים שנפתחו', 'Accessed Links')}
          </span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1.5">{usedCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 shadow-xs">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
            {loc('التقييمات المسلمة', 'משובים שהתקבלו', 'Total Reviews Submitted')}
          </span>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1.5">{totalSubmissions}</p>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4 shadow-xs animate-in fade-in duration-200">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {loc('إنشاء دعوة تقييم معتمدة', 'הפקת הזמנת משוב מאובטחת', 'Generate Secure Review Invitation')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {loc('عنوان الوجهة الإضافية (اختياري)', 'כתובת יעד להפניה (Destination URL)', 'Destination / External Review URL (Optional)')}
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
                {loc('تسمية أو اسم الطالب / المجموعة', 'שם מזהה פנימי / תלמיד', 'Internal Label / Student Name')}
              </label>
              <input
                type="text"
                placeholder={loc('مثال: طلاب المستوى المبتدئ - دفعة 2026', 'לדוגמה: עומר פארוק - חבילת 20 שיעורים', 'e.g. Omar Farouk - VIP Student')}
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
              {loc('إلغاء', 'ביטול', 'Cancel')}
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
            >
              {createMutation.isPending
                ? loc('جارٍ الإنشاء...', 'מפיק...', 'Generating...')
                : loc('إنشاء الرابط', 'הפק קישור', 'Generate Link')}
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
            placeholder={loc('البحث حسب التسمية أو الرابط أو التوكن...', 'חיפוש לפי תלמיד, יעד או קוד טוקן...', 'Search by student label, target, or token...')}
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
              {st === 'ALL' && loc('الكل', 'הכל', 'All')}
              {st === 'ACTIVE' && loc(`نشطة (${activeCount})`, `פעילים (${activeCount})`, `Active (${activeCount})`)}
              {st === 'USED' && loc(`مستخدمة (${usedCount})`, `נוצלו (${usedCount})`, `Accessed (${usedCount})`)}
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
                <th className="py-3.5 px-4 font-bold text-start">{loc('تسمية الرابط والوجهة', 'מזהה תלמיד ויעד', 'Label & Target')}</th>
                <th className="py-3.5 px-4 font-bold text-start">{loc('الرابط المباشر للتقييم', 'קישור ישיר', 'Direct Review URL')}</th>
                <th className="py-3.5 px-4 font-bold text-start">{loc('الحالة والنشاط', 'סטטוס', 'Status & Access')}</th>
                <th className="py-3.5 px-4 font-bold text-start">{loc('التقييمات المسلمة', 'משובים שהתקבלו', 'Submissions')}</th>
                <th className="py-3.5 px-4 font-bold text-end">{loc('الإجراءات', 'פעולות', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLinks.map((l) => {
                const isCopied = copiedId === l.id;
                const formattedUsedTime = l.usedAt
                  ? formatIsraelDateTime(l.usedAt, {
                      includeDate: true,
                      locale: isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                    })
                  : null;

                const submissionsCount = l.submissions?.length || 0;

                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {l.label || loc('تقييم الأكاديمية العام', 'משוב כללי', 'General Review')}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                        {l.targetUrl}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          /review/{l.token.substring(0, 14)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(l.token, l.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title={loc('نسخ الرابط', 'העתק קישור', 'Copy link')}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`/review/${l.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-brand-teal-700 dark:hover:text-brand-teal-400"
                          title={loc('فتح الرابط للمعاينة', 'פתח קישור', 'Open review link')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{loc('رابط نشط ومتعدد الاستخدام', 'קישור פעיל רב-פעמי', 'Active Multi-Use Link')}</span>
                        </span>
                        {l.usageCount ? (
                          <div className="text-[10px] text-slate-500 font-medium">
                            {loc(`جرت زيارته ${l.usageCount} مرة`, `נפתח ${l.usageCount} פעמים`, `Accessed ${l.usageCount} times`)}
                            {formattedUsedTime && ` • ${formattedUsedTime}`}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            {loc('جاهز للاستخدام', 'מוכן לשימוש', 'Ready for use')}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      {submissionsCount > 0 ? (
                        <button
                          onClick={() => setInspectingSubmissions(l)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-extrabold hover:bg-purple-100 transition"
                        >
                          <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                          <span>{loc(`${submissionsCount} تقييمات`, `${submissionsCount} ביקורות`, `${submissionsCount} Reviews`)}</span>
                          <Eye className="w-3 h-3 ms-0.5 opacity-70" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {loc('لا توجد تقييمات بعد', 'אין ביקורות עדיין', 'No submissions yet')}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-end">
                      <button
                        onClick={async () => {
                          const confirmed = await confirmDialog({
                            title: loc('حذف رابط التقييم', 'מחיקת קישור משוב', 'Delete Review Link'),
                            message: loc('هل أنت متأكد من رغبتك في حذف هذا الرابط؟', 'האם למחוק קישור משוב זה לצמיתות?', 'Are you sure you want to delete this review link?'),
                            confirmText: loc('حذف', 'מחק קישור', 'Delete Link'),
                            variant: 'danger',
                          });
                          if (confirmed) {
                            deleteMutation.mutate(l.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title={loc('حذف', 'מחק', 'Delete')}
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
                    {loc('لم يتم العثور على روابط تقييم', 'לא נמצאו קישורי משוב', 'No review links found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMISSIONS INSPECTION MODAL */}
      {inspectingSubmissions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setInspectingSubmissions(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span>{loc('التقييمات المسلمة عبر الرابط', 'ביקורות שהתקבלו דרך הקישור', 'Submissions via Review Link')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {inspectingSubmissions.label || loc('رابط التقييم المعتمد', 'קישור משוב', 'Review Link')}
                </p>
              </div>
              <button
                onClick={() => setInspectingSubmissions(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {inspectingSubmissions.submissions && inspectingSubmissions.submissions.length > 0 ? (
                inspectingSubmissions.submissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {sub.reviewerName || 'Student'}
                        </span>
                        {sub.reviewerEmail && (
                          <span className="text-[10px] text-slate-400">({sub.reviewerEmail})</span>
                        )}
                      </div>
                      <div className="flex items-center text-amber-500 font-black text-xs gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{sub.rating}/5</span>
                      </div>
                    </div>

                    {sub.title && (
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {sub.title}
                      </h4>
                    )}

                    {sub.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        "{sub.comment}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px] text-slate-400">
                      <span>
                        {sub.teachingRating ? `Teaching: ${sub.teachingRating}★ • ` : ''}
                        {sub.platformRating ? `Platform: ${sub.platformRating}★` : ''}
                      </span>
                      <span>
                        {formatIsraelDateTime(sub.createdAt, {
                          includeDate: true,
                          locale: isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  {loc('لا توجد تقييمات مرسلة حتى الآن.', 'אין ביקורות עדיין.', 'No submissions recorded yet.')}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingSubmissions(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                {loc('إغلاق', 'סגור', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
