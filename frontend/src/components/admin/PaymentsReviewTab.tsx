import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { paymentsApi } from '../../lib/enterpriseApi';
import { PaymentModel } from '../../types';
import { toast } from '../../store/toastStore';
import { formatIsraelDateTime } from '../../lib/timeUtils';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Download,
  AlertCircle,
  User,
  Calendar,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const PaymentsReviewTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments-list'],
    queryFn: () => paymentsApi.list(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      toast.success(
        language === 'he'
          ? 'התשלום אושר בהצלחה ומכסת החבילה הוקצתה לתלמיד ל-30 יום!'
          : 'Payment approved and session package quotas assigned to student!'
      );
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה באישור תשלום' : 'Approval failed')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => paymentsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      toast.success(language === 'he' ? 'התשלום נדחה' : 'Payment marked rejected');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בדחיית תשלום' : 'Rejection failed')),
  });

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const studentName = `${p.student?.user?.firstName || ''} ${p.student?.user?.lastName || ''}`.toLowerCase();
      const studentEmail = (p.student?.user?.email || '').toLowerCase();
      const packageName = (p.package?.name || '').toLowerCase();
      const submitter = (p.createdBy?.firstName || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        !term ||
        studentName.includes(term) ||
        studentEmail.includes(term) ||
        packageName.includes(term) ||
        submitter.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [payments, statusFilter, searchTerm]);

  // KPI Metrics
  const totalCount = payments.length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
  const approvedCount = payments.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = payments.filter((p) => p.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Receipt}
        badgeText={language === 'he' ? 'בדיקת תשלומי חבילות ואישורי העברה' : 'Sales Payment Auditing & Receipts'}
        statusText={language === 'he' ? 'פעיל' : 'Live'}
        title={language === 'he' ? 'אישור ובדיקת תשלומי מכירות' : 'Proof-of-Payment Reviews'}
        description={
          language === 'he'
            ? 'בדיקת תשלומים שהוזנו על ידי צוות המכירות עם אסמכתאות העברה. אישור התשלום מקצה מיידית את מכסת השיעורים לתלמיד לתוקף של 30 יום.'
            : 'Review package purchase payments submitted by the Sales team with verified proof screenshots. Approving instantly credits 30-day session package quotas to the student.'
        }
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {language === 'he' ? 'סה״כ תשלומים שהוגשו' : 'Total Submissions'}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {language === 'he' ? 'ממתינים לבדיקה' : 'Pending Review'}
          </span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1.5">{pendingCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {language === 'he' ? 'תשלומים שאושרו' : 'Approved & Credited'}
          </span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5">{approvedCount}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
            {language === 'he' ? 'תשלומים שנדחו' : 'Rejected'}
          </span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1.5">{rejectedCount}</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'he' ? 'חיפוש לפי תלמיד, חבילה, אימייל או מגיש...' : 'Search by student, package, email, or submitter...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-brand-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && (language === 'he' ? 'הכל' : 'All')}
              {st === 'PENDING' && (language === 'he' ? `ממתינים (${pendingCount})` : `Pending (${pendingCount})`)}
              {st === 'APPROVED' && (language === 'he' ? `אושרו (${approvedCount})` : `Approved (${approvedCount})`)}
              {st === 'REJECTED' && (language === 'he' ? `נדחו (${rejectedCount})` : `Rejected (${rejectedCount})`)}
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
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'חבילת שיעורים' : 'Package'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'הוגש ע״י' : 'Submitted By'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'מועד הגשה' : 'Submission Timestamp'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'אסמכתת תשלום' : 'Payment Proof'}</th>
                <th className="py-3.5 px-4 font-bold text-start">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                <th className="py-3.5 px-4 font-bold text-end">{language === 'he' ? 'פעולות' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p) => {
                const formattedTime = formatIsraelDateTime(p.createdAt, {
                  includeDate: true,
                  locale: language === 'he' ? 'he-IL' : 'en-US',
                });

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    {/* Student Info */}
                    <td className="p-4 font-medium">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {p.student?.user?.firstName} {p.student?.user?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.student?.user?.email}</div>
                    </td>

                    {/* Package */}
                    <td className="p-4">
                      <span className="font-black text-slate-900 dark:text-white">{p.package?.name}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.package?.sessionItems?.map((si: any) => `${si.quantity}x ${si.sessionType?.name}`).join(' • ')}
                      </div>
                    </td>

                    {/* Submitter */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800/40">
                        <User className="w-3 h-3" />
                        <span>{p.createdBy?.role}: {p.createdBy?.firstName}</span>
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedTime}</span>
                      </div>
                    </td>

                    {/* Proof Screenshot */}
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedScreenshot(p.screenshotUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50/60 dark:bg-brand-teal-950/50 text-brand-teal-800 dark:text-brand-teal-200 hover:bg-brand-teal-100 font-bold text-xs transition active:scale-95 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                        <span>{language === 'he' ? 'צפה באסמכתת תשלום' : 'Inspect Payment Receipt'}</span>
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60'
                            : p.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300/60'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60'
                        }`}
                      >
                        {p.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {p.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {p.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>
                          {p.status === 'APPROVED'
                            ? (language === 'he' ? 'אושר' : 'APPROVED')
                            : p.status === 'REJECTED'
                            ? (language === 'he' ? 'נדחה' : 'REJECTED')
                            : (language === 'he' ? 'ממתין' : 'PENDING')}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-end">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => approveMutation.mutate(p.id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50"
                          >
                            {language === 'he' ? 'אשר והקצה' : 'Approve & Credit'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt(language === 'he' ? 'ציין סיבת דחייה:' : 'Enter rejection reason:');
                              if (reason !== null) rejectMutation.mutate({ id: p.id, reason });
                            }}
                            disabled={rejectMutation.isPending}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-bold transition border border-rose-200 dark:border-rose-800 active:scale-95"
                          >
                            {language === 'he' ? 'דחה' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          {language === 'he' ? 'נסגר בארכיון' : 'Archived'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {language === 'he' ? 'לא נמצאו רשומות תשלום תואמות' : 'No matching payment records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT SCREENSHOT MODAL */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === 'he' ? 'אסמכתת תשלום מאומתת' : 'Verified Payment Receipt'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center max-h-[65vh]">
              <img
                src={selectedScreenshot}
                alt="Payment Receipt"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={selectedScreenshot}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal-700 dark:text-brand-teal-300 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{language === 'he' ? 'פתח בחלון נפרד' : 'Open in New Tab'}</span>
              </a>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
