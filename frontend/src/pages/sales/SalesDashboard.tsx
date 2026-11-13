import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { paymentsApi, languagesApi, levelsApi } from '../../lib/enterpriseApi';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useSidebarStore } from '../../store/sidebarStore';
import { toast } from '../../store/toastStore';
import { haptics } from '../../utils/haptics';
import { GlassSidebar } from '../../components/common/GlassSidebar';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { PageHeaderBanner } from '../../components/common/PageHeaderBanner';
import {
  BarChart2,
  Users,
  Wallet,
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  X,
  ExternalLink,
  Filter,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
  Award,
  ArrowRight,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const SalesDashboard: React.FC = () => {
  const { language, t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { isCollapsed } = useSidebarStore();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'payments' | 'packages'>('overview');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Preview Proof Modal
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

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

  // Form state for creating payment proof
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    packageId: '',
    notes: '',
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Queries
  const { data: usersData = [], isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['sales-users', searchTerm],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'STUDENT', search: searchTerm } });
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.users || raw?.data || []);
    },
  });

  const { data: packages = [], isLoading: isPackagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.packages || raw?.data || []);
    },
  });

  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const res = await languagesApi.list();
      return Array.isArray(res) ? res : ((res as any)?.languages || []);
    },
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const res = await levelsApi.list();
      return Array.isArray(res) ? res : ((res as any)?.levels || []);
    },
  });

  const { data: payments = [], isLoading: isPaymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['sales-payments'],
    queryFn: async () => {
      const res = await paymentsApi.list();
      return Array.isArray(res) ? res : ((res as any)?.payments || []);
    },
  });

  // Safe arrays for guaranteed crash-free rendering
  const safeUsers = Array.isArray(usersData) ? usersData : ((usersData as any)?.users || []);
  const safePackages = Array.isArray(packages) ? packages : ((packages as any)?.packages || []);
  const safeLanguages = Array.isArray(languages) ? languages : [];
  const safeLevels = Array.isArray(levels) ? levels : [];
  const safePayments = Array.isArray(payments) ? payments : ((payments as any)?.payments || []);

  // Image preview helper
  const handleScreenshotChange = (file: File | null) => {
    setScreenshotFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
    } else {
      setScreenshotPreview(null);
    }
  };

  // Mutations
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
      toast.success(
        language === 'he' ? 'חשבון התלמיד נוצר בהצלחה!' : 'Student account created successfully!',
        language === 'he' ? 'נוצר בהצלחה' : 'Success'
      );
      setIsCreatingStudent(false);
      setStudentForm({ firstName: '', lastName: '', email: '', password: '', nativeLanguageId: '', learningLanguageId: '', levelId: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create student');
    },
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
      toast.success(
        language === 'he' ? 'התשלום ואסמכתת ה-WebP נשלחו לאישור המנהל!' : 'Payment & WebP proof submitted for admin review!',
        language === 'he' ? 'הועבר לבדיקה' : 'Submitted'
      );
      setIsRegisteringPayment(false);
      setPaymentForm({ studentId: '', packageId: '', notes: '' });
      setScreenshotFile(null);
      setScreenshotPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit payment');
    },
  });

  // Filtered payments
  const filteredPayments = safePayments.filter((p: any) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  // KPIs
  const totalStudents = safeUsers.length;
  const totalPayments = safePayments.length;
  const pendingPayments = safePayments.filter((p: any) => p.status === 'PENDING').length;
  const approvedPayments = safePayments.filter((p: any) => p.status === 'APPROVED').length;

  // Sidebar Nav Items
  const navItems = [
    {
      id: 'overview',
      label: 'Overview & Pipeline',
      labelHe: 'מדדים ומבט כולל',
      icon: BarChart2,
      badge: null,
    },
    {
      id: 'students',
      label: 'Students Directory',
      labelHe: 'מאגר תלמידים',
      icon: Users,
      badge: totalStudents > 0 ? String(totalStudents) : null,
    },
    {
      id: 'payments',
      label: 'Payment Submissions',
      labelHe: 'תשלומים ואסמכתאות',
      icon: Wallet,
      badge: pendingPayments > 0 ? String(pendingPayments) : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'packages',
      label: 'Packages Catalog',
      labelHe: 'חבילות ומחירון',
      icon: Layers,
      badge: safePackages.length > 0 ? String(safePackages.length) : null,
    },
  ];

  return (
    <div className="min-h-screen w-full relative">
      {/* Background ambient Apple-style glow */}
      <div className="absolute top-0 start-64 w-96 h-96 bg-brand-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 end-12 w-96 h-96 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full">
        {/* Apple-Style Glassy Left Sidebar */}
        <GlassSidebar
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            haptics.tap();
            setActiveTab(tabId as any);
            setIsMobileMoreOpen(false);
          }}
          user={{
            firstName: currentUser?.firstName,
            lastName: currentUser?.lastName,
            email: currentUser?.email,
            avatarUrl: currentUser?.avatarUrl,
            role: language === 'he' ? 'נציג מכירות' : 'Sales Representative',
          }}
          panelSubtitle={language === 'he' ? 'פורטל נציג מכירות' : 'Sales Operations'}
          isOpenMobile={false}
          onCloseMobile={() => setIsMobileMoreOpen(false)}
        />

        {/* Main Content Area on the right */}
        <main
          className={`w-full transition-all duration-300 ${
            isCollapsed
              ? 'lg:ps-[calc(5rem+1.5rem)]'
              : 'lg:ps-[calc(18rem+1.75rem)] xl:ps-[calc(20rem+2.25rem)]'
          } p-4 sm:p-6 lg:pe-7 xl:pe-9 lg:pt-8 xl:pt-8 min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] space-y-8 pb-32 lg:pb-12`}
        >
          {/* TAB 1: OVERVIEW & PIPELINE */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Executive Top Banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/10">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold mb-3 border border-white/15">
                      <Sparkles className="w-4 h-4 text-brand-olive-400" />
                      <span>{language === 'he' ? 'פורטל ניהול מכירות וחבילות' : 'Sales & Session Quotas Hub'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-white/70">{language === 'he' ? 'פעיל' : 'Active'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                      {language === 'he' ? 'ניהול תלמידים, תשלומים וחבילות' : 'Student Enrollment & Package Sales'}
                    </h1>
                    <p className="text-brand-teal-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                      {language === 'he'
                        ? 'רישום תלמידים חדשים, העלאת אסמכתאות תשלום בפורמט WebP מותאם, ומעקב אחר חבילות ומכסות שיעורים תקפות ל-30 יום.'
                        : 'Onboard new students, register package payments with auto-optimized WebP proof, and manage 30-day session packages.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreatingStudent(true)}
                      className="px-4 py-2.5 rounded-xl bg-white text-brand-teal-950 hover:bg-brand-olive-300 transition-all font-black text-xs shadow-md flex items-center gap-2 active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-brand-teal-900" />
                      <span>{language === 'he' ? 'רישום תלמיד חדש' : 'New Student'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegisteringPayment(true)}
                      className="px-4 py-2.5 rounded-xl bg-brand-olive-400/20 hover:bg-brand-olive-400/30 border border-brand-olive-300/40 text-brand-olive-200 transition-all font-black text-xs shadow-xs flex items-center gap-2 active:scale-95"
                    >
                      <UploadCloud className="w-4 h-4 text-brand-olive-300" />
                      <span>{language === 'he' ? 'הגשת אסמכתת תשלום' : 'Submit Payment Proof'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-Card KPI Stat Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'he' ? 'סך תלמידים' : 'Total Students'}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {totalStudents}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'he' ? 'רשומים במערכת' : 'Active student profiles'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'he' ? 'תשלומים שאושרו' : 'Approved Payments'}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {approvedPayments}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'he' ? 'יתרות הועברו לתלמידים' : 'Credited session quotas'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'he' ? 'ממתינים לאישור' : 'Pending Review'}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                      {pendingPayments}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'he' ? 'בבדיקת מנהל מערכת' : 'Awaiting admin verification'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'he' ? 'חבילות פעילות' : 'Active Packages'}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                      {packages.length}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'he' ? 'תוקף מרבי 30 יום לחבילה' : '30-day package validity'}
                    </p>
                  </div>
                </div>
              </div>
              {/* Quick Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {language === 'he' ? 'רישום מהיר של תלמיד חדש' : 'Fast Student Onboarding'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {language === 'he'
                          ? 'קבע שפת אם, שפת יעד ורמת לימוד התחלתית להקצאת שיעורים מותאמים.'
                          : 'Set native language, learning language, and starting level for personalized curriculum.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreatingStudent(true)}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'he' ? 'פתח טופס רישום תלמיד' : 'Open Registration Form'}</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {language === 'he' ? 'העלאת אסמכתת תשלום (WebP)' : 'Submit Proof Screenshot'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {language === 'he'
                          ? 'תמיכה בכל סוגי התמונות. השרת מבצע אופטימיזציה אוטומטית ל-WebP לביצועים מרביים.'
                          : 'Accepts all image formats. Backend auto-optimizes to WebP for 70% storage savings.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRegisteringPayment(true)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{language === 'he' ? 'צרף אסמכתה לחבילת שיעורים' : 'Attach Proof to Package'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Payment Submissions Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-teal-600" />
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === 'he' ? 'אסמכתאות אחרונות שהוגשו' : 'Recent Payment Submissions'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="text-xs font-bold text-brand-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>{language === 'he' ? 'צפה בהכל' : 'View All'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'חבילה' : 'Package'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'אסמכתה' : 'Proof'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'תאריך' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {safePayments.slice(0, 5).map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {p.student?.user?.firstName} {p.student?.user?.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400">{p.student?.user?.email}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {p.package?.name}
                          </td>
                          <td className="py-3 px-4">
                            {p.screenshotUrl ? (
                              <button
                                onClick={() => setSelectedProofUrl(p.screenshotUrl)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{language === 'he' ? 'צפה ב-WebP' : 'View Proof'}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">No image</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                p.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : p.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            {language === 'he' ? 'טרם נרשמו תשלומי חבילות' : 'No payment submissions found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS DIRECTORY */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Users}
                badgeText={language === 'he' ? 'מאגר תלמידים ומכירות' : 'Student Lead & Account Directory'}
                statusText="Live"
                title={language === 'he' ? 'רישום תלמידים וניהול לקוחות' : 'Student Directory & Accounts'}
                description={
                  language === 'he'
                    ? 'רישום תלמידים חדשים, הגדרת שפת אם ושפת לימוד, מעקב רמות, וצפייה במכסות השיעורים הפעילות.'
                    : 'Onboard new students, configure language preferences, track Hebrew proficiency levels, and inspect active session quotas.'
                }
                action={
                  <button
                    onClick={() => setIsCreatingStudent(true)}
                    className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{language === 'he' ? 'תלמיד חדש' : 'Add Student'}</span>
                  </button>
                }
              />

              {/* Filter and Search Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'he' ? 'חיפוש תלמיד לפי שם או אימייל...' : 'Search students by name or email...'}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 dark:focus:ring-brand-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    {usersData.length} {language === 'he' ? 'תלמידים' : 'Students'}
                  </span>
                  <button
                    onClick={() => setIsCreatingStudent(true)}
                    className="px-4 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'תלמיד חדש' : 'Add Student'}</span>
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'שפות' : 'Languages'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'רמה' : 'Level'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'מכסות שיעורים' : 'Session Quotas'}</th>
                        <th className="py-3.5 px-5 text-end font-bold">{language === 'he' ? 'פעולות' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {safeUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                                {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white block">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-[11px]">
                            <div className="flex flex-col gap-0.5">
                              <span>
                                <span className="text-slate-400">{language === 'he' ? 'אם: ' : 'Native: '}</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {language === 'he' ? (u.nativeLanguage?.labelHe || u.nativeLanguage?.labelEn || 'אנגלית') : (u.nativeLanguage?.labelEn || 'English')}
                                </span>
                              </span>
                              <span>
                                <span className="text-slate-400">{language === 'he' ? 'לומד: ' : 'Learning: '}</span>
                                <span className="font-bold text-brand-teal-700 dark:text-brand-teal-300">
                                  {language === 'he' ? (u.learningLanguage?.labelHe || u.learningLanguage?.labelEn || 'עברית') : (u.learningLanguage?.labelEn || 'Hebrew')}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                              <Award className="w-3 h-3 shrink-0" />
                              <bdi>{language === 'he' ? (u.studentProfile?.levelModel?.labelHe || (u.studentProfile?.level ? t(`levels.${u.studentProfile.level}`) : 'מתחיל (רמה א׳)')) : (u.studentProfile?.levelModel?.labelEn || u.studentProfile?.level || 'Beginner')}</bdi>
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            {u.studentProfile?.sessionBalances?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {u.studentProfile.sessionBalances.map((sb: any) => (
                                  <span
                                    key={sb.id}
                                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold text-slate-800 dark:text-slate-200"
                                  >
                                    {sb.balance}x {language === 'he' ? `${sb.sessionType?.durationMinutes || 25} דק׳` : (sb.sessionType?.name || `${sb.sessionType?.durationMinutes || 25}m`)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                {language === 'he' ? 'אין יתרה פעילה' : '0 sessions'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-end">
                            <button
                              onClick={() => {
                                setPaymentForm({ ...paymentForm, studentId: u.id });
                                setIsRegisteringPayment(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-bold text-xs transition-colors"
                            >
                              + {language === 'he' ? 'תשלום' : 'Payment'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {usersData.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            {language === 'he' ? 'לא נמצאו תלמידים תואמים' : 'No students found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS SUBMISSIONS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Wallet}
                badgeText={language === 'he' ? 'מעקב ואישור תשלומים' : 'Package Payment Pipeline'}
                statusText="Active"
                title={language === 'he' ? 'תשלומים ואסמכתאות WebP' : 'Payment Submissions & Receipts'}
                description={
                  language === 'he'
                    ? 'העלאת אסמכתאות תשלום המומרות אוטומטית ל-WebP, מעקב סטטוס אישור המנהל, והפעלת חבילות ל-30 יום.'
                    : 'Submit proof screenshots automatically converted to WebP for audit, track admin approvals, and credit 30-day session packages.'
                }
                action={
                  <button
                    onClick={() => setIsRegisteringPayment(true)}
                    className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{language === 'he' ? 'צרף תשלום חדש' : 'Submit New Payment'}</span>
                  </button>
                }
              />

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        statusFilter === st
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsRegisteringPayment(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'he' ? 'צרף תשלום חדש' : 'Submit New Payment'}</span>
                </button>
              </div>

              {/* Payments Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'חבילה' : 'Package'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'אסמכתת תשלום' : 'Payment Proof'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'הערות' : 'Notes'}</th>
                        <th className="py-3.5 px-5 text-end font-bold">{language === 'he' ? 'תאריך' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPayments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-4 px-5">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {p.student?.user?.firstName} {p.student?.user?.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{p.student?.user?.email}</span>
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">
                            {p.package?.name}
                          </td>
                          <td className="py-4 px-5">
                            {p.screenshotUrl ? (
                              <button
                                onClick={() => setSelectedProofUrl(p.screenshotUrl)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold hover:underline"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{language === 'he' ? 'הצג תמונה (WebP)' : 'View WebP'}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">No image</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                p.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : p.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-slate-500 max-w-xs truncate">
                            {p.notes || '-'}
                          </td>
                          <td className="py-4 px-5 text-end text-slate-400 font-mono">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            {language === 'he' ? 'לא נמצאו תשלומים בסטטוס זה' : 'No payments found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PACKAGES CATALOG */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Layers}
                badgeText={language === 'he' ? 'מחירון וחבילות תקפות ל-30 יום' : '30-Day Session Quota Packages'}
                statusText="Live"
                title={language === 'he' ? 'קטלוג חבילות ומחירון מכירות' : 'Session Packages & Pricing Catalog'}
                description={
                  language === 'he'
                    ? 'חבילות שיעורים מותאמות (25, 40 ו-55 דק׳). מחירים במטבעות USD ו-ILS עם מבצעים והנחות מובלטות.'
                    : 'Curated session quota packages (25, 40, and 55m). Multi-currency rates (USD & ILS) with clear strikethrough sale prices.'
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safePackages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-brand-teal-500 transition-all space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-brand-teal-50 text-brand-teal-800 dark:bg-brand-teal-950/60 dark:text-brand-teal-300">
                          {pkg.sessionItems?.map((si: any) => `${si.quantity}x ${si.sessionType?.name}`).join(' + ') || `${pkg.totalLessons} Lessons`}
                        </span>
                        <PriceDisplay
                          price={pkg.price}
                          originalPrice={pkg.originalPrice}
                          currency={pkg.currency || 'USD'}
                          onSale={pkg.onSale}
                        />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pkg.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{language === 'he' ? 'תוקף: 30 יום בלבד' : 'Valid: 30 days max'}</span>
                      </span>
                      <button
                        onClick={() => {
                          setPaymentForm({ ...paymentForm, packageId: pkg.id });
                          setIsRegisteringPayment(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-xs"
                      >
                        {language === 'he' ? 'בחר למכירה' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Register Student Profile - MODERNIZED */}
      {isCreatingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Executive Gradient Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white p-6 sm:p-7">
              <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-brand-olive-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-olive-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                      <Sparkles className="w-3 h-3 text-brand-olive-400" />
                      <span>{language === 'he' ? 'קליטת תלמיד חדש' : 'Student Onboarding'}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {language === 'he' ? 'רישום תלמיד חדש' : 'Register New Student Profile'}
                    </h3>
                    <p className="text-xs text-brand-teal-100/80 font-medium mt-0.5">
                      {language === 'he'
                        ? 'הזן פרטים אישיים, שפת אם, שפת יעד ורמת לימוד'
                        : 'Enter personal details, native & target languages, and initial level'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingStudent(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'שם פרטי' : 'First Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                    placeholder="e.g. David"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'שם משפחה' : 'Last Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                    placeholder="e.g. Cohen"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'כתובת אימייל' : 'Email Address'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  placeholder="student@example.com"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span>{language === 'he' ? 'סיסמה ראשונית' : 'Initial Password'} <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400">Min 6 characters</span>
                </label>
                <input
                  type="password"
                  required
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'שפת אם' : 'Native Mother Tongue'}
                  </label>
                  <select
                    value={studentForm.nativeLanguageId}
                    onChange={(e) => setStudentForm({ ...studentForm, nativeLanguageId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  >
                    <option value="">-- Choose Language --</option>
                    {safeLanguages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.flagEmoji} {l.labelEn} ({l.labelNative})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'שפת יעד ללמידה' : 'Target Language'}
                  </label>
                  <select
                    value={studentForm.learningLanguageId}
                    onChange={(e) => setStudentForm({ ...studentForm, learningLanguageId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  >
                    <option value="">-- Choose Language --</option>
                    {safeLanguages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.flagEmoji} {l.labelEn} ({l.labelNative})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'רמת לימוד התחלתית' : 'Starting Hebrew Level'}
                </label>
                <select
                  value={studentForm.levelId}
                  onChange={(e) => setStudentForm({ ...studentForm, levelId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                >
                  <option value="">-- Choose Level --</option>
                  {safeLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.labelEn} ({lvl.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingStudent(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => createStudentMutation.mutate(studentForm)}
                disabled={!studentForm.email || !studentForm.firstName || !studentForm.password || createStudentMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Users className="w-4 h-4 text-slate-950" />
                <span>
                  {createStudentMutation.isPending
                    ? (language === 'he' ? 'יוצר תלמיד...' : 'Creating...')
                    : (language === 'he' ? 'צור חשבון תלמיד' : 'Register Student')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Submit Payment Proof (WebP) - MODERNIZED */}
      {isRegisteringPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Executive Gradient Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white p-6 sm:p-7">
              <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-brand-olive-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-olive-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                      <UploadCloud className="w-3 h-3 text-brand-olive-400" />
                      <span>{language === 'he' ? 'קליטת תשלום' : 'Payment Pipeline'}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {language === 'he' ? 'הגשת אסמכתת תשלום' : 'Submit Package Payment Proof'}
                    </h3>
                    <p className="text-xs text-brand-teal-100/80 font-medium mt-0.5">
                      {language === 'he'
                        ? 'העלאת אישור תשלום עם אופטימיזציה אוטומטית לפורמט WebP'
                        : 'Upload receipt with automatic client-side WebP optimization'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteringPayment(false);
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'בחר תלמיד' : 'Select Student'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentForm.studentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                >
                  <option value="">-- {language === 'he' ? 'בחר תלמיד מהרשימה' : 'Choose Student'} --</option>
                  {safeUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'בחר חבילת שיעורים' : 'Select Session Package'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentForm.packageId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, packageId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                >
                  <option value="">-- {language === 'he' ? 'בחר חבילה' : 'Choose Package'} --</option>
                  {safePackages.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — {pkg.currency === 'ILS' ? '₪' : '$'}{pkg.price} (30 days validity)
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Proof Area */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'אסמכתת תשלום / צילום מסך (מומר אוטומטית ל-WebP)' : 'Payment Screenshot Proof (Auto-WebP)'} <span className="text-rose-500">*</span>
                </label>
                
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/60 hover:border-brand-teal-400 transition-colors text-center space-y-3">
                  <input
                    type="file"
                    id="payment-proof-upload"
                    accept="image/*"
                    onChange={(e) => handleScreenshotChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  
                  {screenshotPreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block max-h-48 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
                        <img src={screenshotPreview} alt="Payment Proof Preview" className="max-h-44 object-contain mx-auto" />
                        <span className="absolute bottom-2 start-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] shadow-xs">
                          WebP Ready
                        </span>
                      </div>
                      <div>
                        <label
                          htmlFor="payment-proof-upload"
                          className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer hover:bg-slate-300 transition-colors"
                        >
                          {language === 'he' ? 'החלף קובץ' : 'Replace Image'}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="payment-proof-upload" className="cursor-pointer block space-y-2 py-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center mx-auto shadow-2xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        {language === 'he' ? 'לחץ להעלאת צילום מסך או העברה בנקאית' : 'Click to select receipt screenshot or transfer proof'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        PNG, JPG, WEBP &bull; Max 10MB &bull; Auto-optimized to WebP
                      </p>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'הערות נוספות ומספר אסמכתה' : 'Internal Notes / Reference #'}
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Bank transfer ref #98234, cash receipt..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRegisteringPayment(false);
                  setScreenshotFile(null);
                  setScreenshotPreview(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => createPaymentMutation.mutate()}
                disabled={!paymentForm.studentId || !paymentForm.packageId || !screenshotFile || createPaymentMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4 text-slate-950" />
                <span>
                  {createPaymentMutation.isPending
                    ? (language === 'he' ? 'מעבד אסמכתה (WebP)...' : 'Processing...')
                    : (language === 'he' ? 'שלח אסמכתה לבדיקה' : 'Submit Proof')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX: Proof Screenshot Viewer */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>WebP Proof Screenshot</span>
              </span>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedProofUrl}
              alt="Payment Proof"
              className="max-h-[70vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Floating Capsule Island Bottom Navigation Bar (Mobile View) */}
      <nav
        aria-label="Mobile Navigation"
        className={`lg:hidden fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 transition-all duration-300 ${
          isMobileMoreOpen ? 'opacity-0 pointer-events-none translate-y-8' : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
        style={{ bottom: 'max(calc(env(safe-area-inset-bottom, 0px) - 30px), 4px)' }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-gradient-to-r from-brand-teal-500/20 via-teal-400/25 to-brand-olive-500/20 blur-xl pointer-events-none -z-10" />

        <div className="relative rounded-full py-2 px-3 floating-capsule-shell grid grid-cols-4 items-center justify-around gap-1">
          {[
            { id: 'overview', label: language === 'he' ? 'מדדים' : 'Overview', icon: BarChart2 },
            { id: 'students', label: language === 'he' ? 'תלמידים' : 'Students', icon: Users, badge: totalStudents > 0 ? String(totalStudents) : null },
            { id: 'payments', label: language === 'he' ? 'תשלומים' : 'Payments', icon: Wallet, badge: pendingPayments > 0 ? String(pendingPayments) : null },
            { id: 'packages', label: language === 'he' ? 'חבילות' : 'Packages', icon: Layers },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptics.tap();
                  setActiveTab(item.id as any);
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative py-1.5 px-2 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'text-brand-teal-800 dark:text-brand-teal-200'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-brand-teal-500/15 dark:bg-white/10 rounded-full blur-[1px]" />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -end-1 px-1 min-w-[14px] h-[14px] rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight mt-0.5 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
export default SalesDashboard;
