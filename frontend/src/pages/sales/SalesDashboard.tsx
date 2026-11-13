import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { paymentsApi, languagesApi, levelsApi } from '../../lib/enterpriseApi';
import { toast } from '../../store/toastStore';
import { Users, Wallet, Plus, Search, Image, CheckCircle, Clock } from 'lucide-react';

export const SalesDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'students' | 'payments' | 'new-payment'>('students');
  const [search, setSearch] = useState('');

  // Form state for creating student
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    nativeLanguageId: '',
    learningLanguageId: '',
    levelId: '',
  });

  // Form state for creating payment
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    packageId: '',
    notes: '',
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['sales-users', search],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'STUDENT', search } });
      return res.data?.users || [];
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data || [];
    },
  });

  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: languagesApi.list,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.list,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['sales-payments'],
    queryFn: () => paymentsApi.list(),
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: typeof studentForm) => {
      const res = await api.post('/users', {
        ...data,
        role: 'STUDENT',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-users'] });
      toast.success('Student account created successfully!');
      setIsCreatingStudent(false);
      setStudentForm({ firstName: '', lastName: '', email: '', password: '', nativeLanguageId: '', learningLanguageId: '', levelId: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create student'),
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!screenshotFile) throw new Error('Proof screenshot is required');
      const formData = new FormData();
      formData.append('studentId', paymentForm.studentId);
      formData.append('packageId', paymentForm.packageId);
      formData.append('notes', paymentForm.notes);
      formData.append('screenshot', screenshotFile);
      return paymentsApi.createWithScreenshot(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-payments'] });
      toast.success('Payment submitted with WebP proof! Awaiting admin review.');
      setActiveTab('payments');
      setPaymentForm({ studentId: '', packageId: '', notes: '' });
      setScreenshotFile(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message),
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            Sales Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            Student Management & Package Payments
          </h1>
          <p className="text-sm text-slate-500">
            Create students, register package payments with screenshot proofs, and monitor approval status.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-sm font-semibold">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'students' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Students Directory
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'payments' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            My Submissions ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('new-payment')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'new-payment' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            + Register Payment
          </button>
        </div>
      </div>

      {/* Tab 1: Students Directory */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsCreatingStudent(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Student Account
            </button>
          </div>

          {isCreatingStudent && (
            <div className="p-6 bg-blue-50/70 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Register New Student Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">First Name</label>
                  <input
                    type="text"
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Last Name</label>
                  <input
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Native Mother Tongue</label>
                  <select
                    value={studentForm.nativeLanguageId}
                    onChange={(e) => setStudentForm({ ...studentForm, nativeLanguageId: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">Select Language</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>{l.flagEmoji} {l.labelEn} ({l.labelNative})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Language To Learn</label>
                  <select
                    value={studentForm.learningLanguageId}
                    onChange={(e) => setStudentForm({ ...studentForm, learningLanguageId: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">Select Language</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>{l.flagEmoji} {l.labelEn} ({l.labelNative})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Initial Academic Level</label>
                  <select
                    value={studentForm.levelId}
                    onChange={(e) => setStudentForm({ ...studentForm, levelId: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">Select Level</option>
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>{lvl.labelEn} ({lvl.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCreatingStudent(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createStudentMutation.mutate(studentForm)}
                  disabled={!studentForm.email || !studentForm.firstName || !studentForm.password}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
                >
                  Create Student
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Languages</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Session Balances</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(usersData || []).map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div>Native: <span className="font-semibold">{u.nativeLanguage?.labelEn || 'English'}</span></div>
                      <div>Learning: <span className="font-semibold">{u.learningLanguage?.labelEn || 'Hebrew'}</span></div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {u.studentProfile?.levelModel?.labelEn || u.studentProfile?.level || 'Beginner'}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {u.studentProfile?.sessionBalances?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {u.studentProfile.sessionBalances.map((sb: any) => (
                            <span key={sb.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                              {sb.balance}x {sb.sessionType?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">0 sessions</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setPaymentForm({ ...paymentForm, studentId: u.id });
                          setActiveTab('new-payment');
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-bold"
                      >
                        + Add Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Register Payment Form */}
      {activeTab === 'new-payment' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Student Package Payment</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select student and session package. Upload screenshot proof (all standard formats supported; backend converts to WebP).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Student Profile</label>
              <select
                value={paymentForm.studentId}
                onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="">Select Student</option>
                {(usersData || []).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Session Package (Quotas)</label>
              <select
                value={paymentForm.packageId}
                onChange={(e) => setPaymentForm({ ...paymentForm, packageId: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="">Select Package</option>
                {packages.map((pkg: any) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.sessionItems?.map((si: any) => `${si.quantity}x ${si.sessionType?.name}`).join(', ') || `${pkg.totalLessons} Lessons`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Payment Proof Screenshot (All image types accepted)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Internal Notes</label>
              <textarea
                placeholder="Bank transfer reference number, client details..."
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('students')}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => createPaymentMutation.mutate()}
              disabled={!paymentForm.studentId || !paymentForm.packageId || !screenshotFile || createPaymentMutation.isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {createPaymentMutation.isPending ? 'Processing WebP Proof...' : 'Submit Payment Proof'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Payments List */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Package</th>
                <th className="p-4">Proof</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-4 font-medium">{p.student?.user?.firstName} {p.student?.user?.lastName}</td>
                  <td className="p-4">{p.package?.name}</td>
                  <td className="p-4">
                    <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                      View Screenshot
                    </a>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : p.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
