import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../lib/enterpriseApi';
import { PaymentModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Wallet, CheckCircle, XCircle, Image, ExternalLink, Clock, ShieldCheck } from 'lucide-react';

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
      toast.success('Payment approved and session quotas credited to student wallet!');
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" />
          Proof-of-Payment Reviews & Package Activation
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review payments submitted by Sales team. Every payment is backed by a WebP converted screenshot. Approval instantly adds session balance valid for 30 days.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Package</th>
                <th className="p-4">Submitted By</th>
                <th className="p-4">Proof Screenshot</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
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
