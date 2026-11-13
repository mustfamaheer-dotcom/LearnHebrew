import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../lib/enterpriseApi';
import { PaymentModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Receipt, CheckCircle, XCircle, Image, ExternalLink, Clock, ShieldCheck } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const PaymentsReviewTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments-list'],
    queryFn: () => paymentsApi.list(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      toast.success('Payment approved and session package quotas assigned to student!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => paymentsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      toast.success('Payment marked rejected');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Rejection failed'),
  });

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Receipt}
        badgeText="Sales Payment Auditing & WebP Proofs"
        statusText="Live"
        title="Proof-of-Payment Reviews"
        description="Review package purchase payments submitted by the Sales team with automatic WebP screenshots. Approving instantly credits 30-day session package quotas to the student."
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold text-start">Student</th>
                <th className="py-3.5 px-4 font-bold text-start">Package</th>
                <th className="py-3.5 px-4 font-bold text-start">Submitted By</th>
                <th className="py-3.5 px-4 font-bold text-start">Proof Screenshot</th>
                <th className="py-3.5 px-4 font-bold text-start">Status</th>
                <th className="py-3.5 px-4 font-bold text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-medium">
                    <div>{p.student?.user?.firstName} {p.student?.user?.lastName}</div>
                    <div className="text-xs text-slate-400">{p.student?.user?.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-900 dark:text-white">{p.package?.name}</span>
                    <div className="text-xs text-slate-400">
                      {p.package?.sessionItems?.map((si) => `${si.quantity}x ${si.sessionType?.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {p.createdBy?.role}: {p.createdBy?.firstName}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedScreenshot(p.screenshotUrl)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      <Image className="w-4 h-4" /> View WebP Proof
                    </button>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : p.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {p.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(p.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Approve & Credit
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason !== null) rejectMutation.mutate({ id: p.id, reason });
                          }}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Payment Screenshot (WebP Optimized)</h3>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Close ✕
              </button>
            </div>
            <img
              src={selectedScreenshot}
              alt="Payment proof"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
