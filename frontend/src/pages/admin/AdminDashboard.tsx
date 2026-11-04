import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  formatSlotRange12Hour,
  formatIsraelDateTime,
  ISRAEL_TZ_LABEL,
} from '../../lib/timeUtils';
import {
  Users,
  Award,
  Calendar,
  Layers,
  BarChart2,
  Plus,
  ShieldAlert,
  CheckCircle,
  KeyRound,
  Trash2,
  Star,
  ExternalLink,
  Edit3,
  Sliders,
  Globe,
  Save,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  Filter,
  Check,
  RefreshCw,
  Eye,
  Menu,
  X,
  GraduationCap,
  MessageSquare,
  Coins,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'landing_cms' | 'users' | 'teachers' | 'packages' | 'bookings' | 'surveys'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('LearnHebrew@2026');
  const [newUserFirst, setNewUserFirst] = useState('');
  const [newUserLast, setNewUserLast] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [newUserLevel, setNewUserLevel] = useState('BEGINNER');

  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgNameHe, setPkgNameHe] = useState('');
  const [pkgLessons, setPkgLessons] = useState(10);
  const [pkgDays, setPkgDays] = useState(60);
  const [pkgPrice, setPkgPrice] = useState(250);

  const [isAssigningPkg, setIsAssigningPkg] = useState(false);
  const [assignPkgId, setAssignPkgId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignCustomCredits, setAssignCustomCredits] = useState('');

  // Superadmin Grant Credits State
  const [isGrantingCredits, setIsGrantingCredits] = useState(false);
  const [grantStudentId, setGrantStudentId] = useState('');
  const [grantCreditsAmount, setGrantCreditsAmount] = useState(5);
  const [grantReason, setGrantReason] = useState('Superadmin grant');

  const [isBookingLesson, setIsBookingLesson] = useState(false);
  const [bookStudentId, setBookStudentId] = useState('');
  const [bookTeacherId, setBookTeacherId] = useState('');
  const [bookDateTime, setBookDateTime] = useState('');
  const [bookDuration, setBookDuration] = useState<25 | 40 | 55>(25);

  // 1. Analytics Overview
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    },
  });

  // 2. Users List
  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.users;
    },
  });

  // 3. Packages List
  const { data: packagesData } = useQuery({
    queryKey: ['adminPackages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data.packages;
    },
  });

  // 4. Lessons List
  const { data: lessonsData } = useQuery({
    queryKey: ['adminLessons'],
    queryFn: async () => {
      const res = await api.get('/lessons');
      return res.data.lessons;
    },
  });

  // 5. Teachers List & Slots
  const { data: teachersData } = useQuery({
    queryKey: ['adminTeachers'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      return res.data.teachers;
    },
  });

  // 6. Surveys List
  const { data: surveysData } = useQuery({
    queryKey: ['adminSurveys'],
    queryFn: async () => {
      const res = await api.get('/feedback/surveys');
      return res.data.surveys;
    },
  });

  // 7. Landing Page CMS Settings
  const { data: cmsSettings, isLoading: cmsLoading } = useQuery({
    queryKey: ['landingSettingsAdmin'],
    queryFn: async () => {
      const res = await api.get('/settings/landing-page');
      return res.data?.config;
    },
  });

  // CMS Form Local State
  const [cmsForm, setCmsForm] = useState<any>(null);
  const [cmsSaveSuccess, setCmsSaveSuccess] = useState(false);

  // Initialize CMS form once loaded
  React.useEffect(() => {
    if (cmsSettings && !cmsForm) {
      setCmsForm(cmsSettings);
    }
  }, [cmsSettings, cmsForm]);

  // Mutations
  const updateCmsMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put('/settings/landing-page', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landingSettingsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['landingSettings'] });
      setCmsSaveSuccess(true);
      toast.success(
        language === 'he' ? 'הגדרות עמוד הבית נשמרו ועודכנו בהצלחה!' : 'Landing page settings updated successfully!'
      );
      setTimeout(() => setCmsSaveSuccess(false), 3500);
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error ||
          (language === 'he' ? 'שגיאה בעדכון הגדרות עמוד הבית' : 'Failed to update landing page settings')
      );
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setIsCreatingUser(false);
      setNewUserEmail('');
      setNewUserFirst('');
      setNewUserLast('');
      toast.success(
        language === 'he' ? 'המשתמש נוצר בהצלחה!' : 'User created successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה ביצירת משתמש' : 'Failed to create user')
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post(`/users/${userId}/reset-password`, { newPassword: 'LearnHebrew@2026' });
    },
    onSuccess: () => {
      toast.info(
        language === 'he'
          ? 'הסיסמה אופסה בהצלחה ל: LearnHebrew@2026'
          : 'Password reset to: LearnHebrew@2026'
      );
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      toast.info(language === 'he' ? 'המשתמש נמחק בהצלחה.' : 'User deleted.');
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/packages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
      setIsCreatingPackage(false);
      setPkgName('');
      setPkgNameHe('');
      toast.success(
        language === 'he' ? 'החבילה נוצרה בהצלחה!' : 'Package created successfully!'
      );
    },
  });

  const assignPackageMutation = useMutation({
    mutationFn: async ({
      pkgId,
      studentId,
      customCredits,
    }: {
      pkgId: string;
      studentId: string;
      customCredits?: number;
    }) => {
      return api.post(`/packages/${pkgId}/assign`, { studentId, customCredits });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsAssigningPkg(false);
      setAssignCustomCredits('');
      setAssignStudentId('');
      setAssignPkgId('');
      toast.success(
        language === 'he' ? 'החבילה הוקצתה לתלמיד בהצלחה!' : 'Package assigned successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה בהקצאת חבילה' : 'Failed to assign package')
      );
    },
  });

  const grantCreditsMutation = useMutation({
    mutationFn: async (data: { studentId: string; credits: number; reason?: string }) => {
      return api.post('/packages/grant-credits', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setIsGrantingCredits(false);
      setGrantCreditsAmount(5);
      setGrantReason('Superadmin grant');
      setGrantStudentId('');
      toast.success(
        language === 'he' ? 'נקודות השיעורים הוענקו לתלמיד בהצלחה!' : 'Session credits granted to student successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה בהענקת נקודות' : 'Failed to grant credits')
      );
    },
  });

  const bookLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/lessons', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setIsBookingLesson(false);
      setBookStudentId('');
      setBookTeacherId('');
      setBookDateTime('');
      toast.success(
        language === 'he' ? 'השיעור נקבע בהצלחה!' : 'Session booked successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה בקביעת שיעור' : 'Failed to book lesson')
      );
    },
  });

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm font-semibold text-slate-500 animate-pulse flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-teal-800" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const studentsList = usersData?.filter((u: any) => u.role === 'STUDENT') || [];
  const teachersList = usersData?.filter((u: any) => u.role === 'TEACHER') || [];

  const filteredUsers = (usersData || []).filter((u: any) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSearch =
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(userSearchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const navItems = [
    {
      id: 'overview',
      label: 'Overview & KPIs',
      labelHe: 'מבט כולל ומדדים',
      icon: BarChart2,
      badge: null,
    },
    {
      id: 'landing_cms',
      label: 'Landing Page CMS',
      labelHe: 'ניהול עמוד הבית',
      icon: Sliders,
      badge: 'Live',
    },
    {
      id: 'users',
      label: 'User Management',
      labelHe: 'ניהול משתמשים',
      icon: Users,
      badge: usersData?.length || 0,
    },
    {
      id: 'teachers',
      label: 'Teachers & 25m Slots',
      labelHe: 'מורים ומשבצות 25 דק׳',
      icon: GraduationCap,
      badge: teachersData?.length || 0,
    },
    {
      id: 'packages',
      label: 'Packages & Pricing',
      labelHe: 'חבילות ומחירים',
      icon: Layers,
      badge: packagesData?.length || 0,
    },
    {
      id: 'bookings',
      label: 'Bookings & Calendar',
      labelHe: 'שיעורים ויומן',
      icon: Calendar,
      badge: lessonsData?.length || 0,
    },
    {
      id: 'surveys',
      label: 'Surveys & Reviews',
      labelHe: 'משובים וסקרים',
      icon: MessageSquare,
      badge: surveysData?.length || 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-xs">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Engrew" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-brand-teal-900 text-sm">Engrew Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Apple-Style Glassy Left Sidebar */}
        <aside
          className={`lg:w-72 w-full lg:sticky lg:top-24 z-20 transition-all ${
            mobileMenuOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 dark:ring-white/5">
            {/* Subtle Apple gradient glow behind sidebar */}
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-brand-teal-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-brand-olive-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Sidebar Header */}
            <div className="flex items-center gap-3 px-3 py-3 mb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-brand-teal-800 text-white flex items-center justify-center font-black shadow-md shadow-brand-teal-900/20">
                <img src="/logo.png" alt="Engrew" className="w-6 h-6 object-contain brightness-0 invert" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">Engrew</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Super Admin Panel</p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const label = language === 'he' ? item.labelHe : item.label;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-brand-teal-800 text-white shadow-md shadow-brand-teal-900/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-brand-olive-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-teal-800 dark:group-hover:text-brand-teal-400'
                        }`}
                      />
                      <span>{label}</span>
                    </div>

                    {item.badge !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          isActive
                            ? 'bg-brand-teal-900 text-brand-olive-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Profile Pill */}
            <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-brand-olive-100 dark:bg-brand-olive-950/70 text-brand-olive-800 dark:text-brand-olive-300 font-bold flex items-center justify-center text-xs">
                  {currentUser?.firstName?.charAt(0) || 'A'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                ADMIN
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full space-y-8">
          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-brand-teal-900 via-brand-teal-800 to-brand-olive-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold mb-3 border border-white/15">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Control & Analytics Hub</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    {language === 'he' ? 'מרכז הבקרה של Engrew' : 'Engrew Management Overview'}
                  </h1>
                  <p className="text-brand-teal-100 text-sm mt-1 max-w-xl">
                    Real-time metrics, 25-minute lesson utilization, revenue reporting, and operational health.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setIsCreatingUser(true)}
                    className="px-4 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('admin.createUserBtn')}</span>
                  </button>
                  <button
                    onClick={() => setIsCreatingPackage(true)}
                    className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('admin.createPkgBtn')}</span>
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                      <BarChart2 className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      ${analytics?.kpis?.totalRevenue?.toLocaleString() || '1,420'}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-3 block">
                    +18.4% vs last month
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">25m Lessons</span>
                      <Clock className="w-5 h-5 text-brand-olive-600 dark:text-brand-olive-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.totalLessons || lessonsData?.length || '12'}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-3 block">
                    Completed & Scheduled
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Active Students</span>
                      <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.activeStudents || studentsList.length}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-3 block">
                    100% active retention
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Avg Teacher Score</span>
                      <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.avgSatisfaction || '4.95'} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-3 block">
                    Based on 28 student surveys
                  </span>
                </div>
              </div>

              {/* Recent 25-Min Bookings */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming 25-Minute Bookings</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Live feed of scheduled sessions across all teachers</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:text-brand-teal-900 dark:hover:text-brand-teal-300"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Teacher</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {(lessonsData || []).slice(0, 5).map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {l.student?.user?.firstName} {l.student?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {formatIsraelDateTime(l.scheduledAt, {
                              includeWeekday: true,
                              locale: language === 'he' ? 'he-IL' : 'en-US',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 font-bold text-[10px]">
                              25 Minutes
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                l.status === 'SCHEDULED'
                                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                                  : l.status === 'COMPLETED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANDING PAGE CMS / LIVE CUSTOMIZER */}
          {activeTab === 'landing_cms' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-olive-50 dark:bg-brand-olive-950/60 text-brand-olive-800 dark:text-brand-olive-300 text-xs font-bold mb-2 border border-brand-olive-200 dark:border-brand-olive-800">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Full Live Landing Page CMS</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    Customize Any Content on the Landing Page
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Direct real-time control over banners, hero headlines, badges, call-to-actions, and feature cards in both English and Hebrew.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {cmsSaveSuccess && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fade-in">
                      <Check className="w-4 h-4" /> Changes Published Live!
                    </span>
                  )}
                  <button
                    onClick={() => updateCmsMutation.mutate(cmsForm)}
                    disabled={updateCmsMutation.isPending || !cmsForm}
                    className="px-6 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4 text-brand-olive-300" />
                    <span>{updateCmsMutation.isPending ? 'Publishing...' : 'Save & Publish Live'}</span>
                  </button>
                </div>
              </div>

              {cmsForm && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column: Editor Forms */}
                  <div className="space-y-6">
                    {/* Announcement Banner */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                        Top Announcement Banner
                      </h2>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Announcement Text (English)
                        </label>
                        <input
                          type="text"
                          value={cmsForm.announcementEn || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, announcementEn: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Announcement Text (Hebrew / עברית)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={cmsForm.announcementHe || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, announcementHe: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Hero Badge & Titles */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                        Hero Section
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Pill Badge (EN)
                          </label>
                          <input
                            type="text"
                            value={cmsForm.badgeEn || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, badgeEn: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Pill Badge (HE)
                          </label>
                          <input
                            type="text"
                            dir="rtl"
                            value={cmsForm.badgeHe || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, badgeHe: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Hero Title (EN)
                        </label>
                        <input
                          type="text"
                          value={cmsForm.heroTitleEn || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, heroTitleEn: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Hero Title (HE)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={cmsForm.heroTitleHe || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, heroTitleHe: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Hero Subtitle (EN)
                        </label>
                        <textarea
                          rows={2}
                          value={cmsForm.heroSubtitleEn || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitleEn: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Hero Subtitle (HE)
                        </label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          value={cmsForm.heroSubtitleHe || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitleHe: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            CTA Button (EN)
                          </label>
                          <input
                            type="text"
                            value={cmsForm.ctaLoginEn || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, ctaLoginEn: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            CTA Button (HE)
                          </label>
                          <input
                            type="text"
                            dir="rtl"
                            value={cmsForm.ctaLoginHe || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, ctaLoginHe: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Features Customizer */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                        Feature Highlights (3 Cards)
                      </h2>

                      {(cmsForm.features || []).map((feat: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Feature Card #{idx + 1}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                              Icon: {feat.icon}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Title EN"
                              value={feat.titleEn || ''}
                              onChange={(e) => {
                                const updated = [...cmsForm.features];
                                updated[idx].titleEn = e.target.value;
                                setCmsForm({ ...cmsForm, features: updated });
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold"
                            />
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="Title HE"
                              value={feat.titleHe || ''}
                              onChange={(e) => {
                                const updated = [...cmsForm.features];
                                updated[idx].titleHe = e.target.value;
                                setCmsForm({ ...cmsForm, features: updated });
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <textarea
                              rows={2}
                              placeholder="Desc EN"
                              value={feat.descEn || ''}
                              onChange={(e) => {
                                const updated = [...cmsForm.features];
                                updated[idx].descEn = e.target.value;
                                setCmsForm({ ...cmsForm, features: updated });
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs"
                            />
                            <textarea
                              rows={2}
                              dir="rtl"
                              placeholder="Desc HE"
                              value={feat.descHe || ''}
                              onChange={(e) => {
                                const updated = [...cmsForm.features];
                                updated[idx].descHe = e.target.value;
                                setCmsForm({ ...cmsForm, features: updated });
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Live Apple-Style Preview */}
                  <div className="space-y-4 lg:sticky lg:top-24">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                        Live Landing Page Preview
                      </span>
                      <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline flex items-center gap-1"
                      >
                        Open Real Page <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800/80 rounded-3xl p-4 border border-slate-300/80 dark:border-slate-700 shadow-inner">
                      {/* Announcement Preview */}
                      {cmsForm.announcementEn && (
                        <div className="bg-gradient-to-r from-brand-teal-800 to-brand-olive-600 text-white py-1.5 px-3 rounded-t-xl text-[11px] font-semibold text-center mb-3 truncate">
                          {cmsForm.announcementEn}
                        </div>
                      )}

                      {/* Mock Landing Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center shadow-xs space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 text-brand-teal-800 dark:text-brand-teal-300 text-[11px] font-semibold">
                          <Sparkles className="w-3 h-3 text-brand-olive-500" />
                          <span>{cmsForm.badgeEn || 'Bilingual Hebrew Platform'}</span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {cmsForm.heroTitleEn || 'Speak Modern Hebrew with Confidence'}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                          {cmsForm.heroSubtitleEn ||
                            'Live 1-on-1 private video lessons (25-min focused slots) with native certified teachers.'}
                        </p>

                        <div className="flex items-center justify-center gap-2 pt-2">
                          <span className="px-4 py-2 rounded-xl bg-brand-teal-800 text-white font-bold text-xs shadow-xs">
                            {cmsForm.ctaLoginEn || 'Start Learning Now'}
                          </span>
                          <span className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                            View Packages
                          </span>
                        </div>

                        {/* Feature Preview Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                          {(cmsForm.features || []).map((feat: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                              <p className="font-bold text-[11px] text-slate-900 dark:text-white line-clamp-1">{feat.titleEn}</p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{feat.descEn}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    User Accounts & Roles
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage students, certified teachers, and administrative privileges.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingUser(true)}
                  className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-brand-olive-300" />
                  <span>{t('admin.createUserBtn')}</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter:</span>
                  {['ALL', 'STUDENT', 'TEACHER', 'SUPER_ADMIN'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setUserRoleFilter(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        userRoleFilter === role
                          ? 'bg-brand-teal-800 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Hebrew Level</th>
                        <th className="py-3 px-4">Session Credits</th>
                        <th className="py-3 px-4">Language</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredUsers.map((u: any) => {
                        const activePkgs = u.studentProfile?.packages || [];
                        const totalRemaining = activePkgs.reduce(
                          (sum: number, p: any) => sum + Math.max(0, p.lessonsTotal - p.lessonsUsed),
                          0
                        );

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 font-bold flex items-center justify-center text-xs">
                                  {u.firstName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                  u.role === 'SUPER_ADMIN'
                                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                                    : u.role === 'TEACHER'
                                    ? 'bg-brand-olive-100 dark:bg-brand-olive-950/60 text-brand-olive-900 dark:text-brand-olive-300'
                                    : 'bg-brand-teal-100 dark:bg-brand-teal-950/60 text-brand-teal-900 dark:text-brand-teal-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {u.studentProfile?.level || (u.role === 'TEACHER' ? 'Native Instructor' : '—')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {u.role === 'STUDENT' ? (
                                u.studentProfile ? (
                                  <div>
                                    <span className="font-extrabold text-brand-teal-800 dark:text-brand-teal-300 block">
                                      {totalRemaining} {language === 'he' ? 'נק׳ שיעור' : 'credits'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {activePkgs[0]?.package?.nameEn || (language === 'he' ? 'חבילה פעילה' : 'Active')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">No profile</span>
                                )
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 uppercase text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {u.languagePref}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                {u.studentProfile && (
                                  <button
                                    onClick={() => {
                                      setGrantStudentId(u.studentProfile.id);
                                      setIsGrantingCredits(true);
                                    }}
                                    title="Grant Session Credits"
                                    className="p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                                  >
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span className="hidden sm:inline">+ Credit</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => resetPasswordMutation.mutate(u.id)}
                                  title="Reset Password"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteUserMutation.mutate(u.id)}
                                  title="Delete User"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEACHERS & 25-MIN SLOTS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      Certified Teachers & 25-Minute Slot Schedules
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Each teacher offers strictly 25-minute lesson blocks configured into the PostgreSQL database.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-brand-olive-100 dark:bg-brand-olive-950/60 text-brand-olive-900 dark:text-brand-olive-300 font-bold text-xs border border-brand-olive-200 dark:border-brand-olive-800">
                    25-Min Interval Engine Active
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {(teachersData || []).map((t: any) => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  return (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-brand-teal-300 dark:hover:border-brand-teal-600 transition-all space-y-5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.user?.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                            alt={t.user?.firstName}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                              {t.user?.firstName} {t.user?.lastName}
                            </h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{t.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{t.ratingAvg || '5.0'}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">({t.ratingCount || 0})</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {t.bio || 'Native Hebrew instructor specializing in immersion and grammar.'}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                          Configured 25-Minute Availability Slots:
                        </span>

                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                          {(t.timeSlots || []).map((slot: any) => (
                            <span
                              key={slot.id}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/60 dark:border-slate-700"
                            >
                              {days[slot.dayOfWeek]}: {formatSlotRange12Hour(slot.startTime, slot.endTime)} (IST)
                            </span>
                          ))}
                          {(t.timeSlots || []).length === 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">No slots configured yet.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: PACKAGES & PRICING */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    Lesson Packages & Student Allocations
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Packages govern student credits for 25-minute private sessions.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAssigningPkg(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Assign to Student
                  </button>
                  <button
                    onClick={() => setIsCreatingPackage(true)}
                    className="px-4 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-brand-olive-300" />
                    <span>Create Package</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(packagesData || []).map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand-olive-300 dark:hover:border-brand-olive-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 uppercase tracking-wider">
                          {pkg.lessonsCount} x 25-Min Lessons
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">${pkg.priceUsd}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.nameEn}</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-hebrew mt-0.5">{pkg.nameHe}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">{pkg.descriptionEn}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Valid for {pkg.durationDays} days</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: BOOKINGS & LESSONS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    All Scheduled Lessons (25 / 40 / 55 Min)
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Book, reschedule, or review recordings and notes for private sessions. All times shown in <strong>{ISRAEL_TZ_LABEL} (12-Hour AM/PM)</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setIsBookingLesson(true)}
                  className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-brand-olive-300" />
                  <span>Book Live Session</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Teacher</th>
                        <th className="py-3 px-4">Scheduled Time</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Meeting / Recording</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {(lessonsData || []).map((l: any) => {
                        const dur = l.durationMinutes || 25;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {l.student?.user?.firstName} {l.student?.user?.lastName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                              {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {formatIsraelDateTime(l.scheduledAt, {
                                includeWeekday: true,
                                locale: language === 'he' ? 'he-IL' : 'en-US',
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  dur === 55
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                    : dur === 40
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {dur} min
                              </span>
                            </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                l.status === 'SCHEDULED'
                                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                                  : l.status === 'COMPLETED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {l.zoomLink ? (
                              <a
                                href={l.zoomLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                              >
                                Join Zoom <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SURVEYS & REVIEWS */}
          {activeTab === 'surveys' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Student Lesson Reviews & Teacher Feedback
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Ratings on lesson quality, difficulty calibration, and teacher reviews.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {(surveysData || []).map((s: any) => (
                  <div key={s.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          {s.lesson?.student?.user?.firstName} {s.lesson?.student?.user?.lastName} &rarr;{' '}
                          {s.teacher?.user?.firstName} {s.teacher?.user?.lastName}
                        </h2>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800/60">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{s.qualityRating || 5}/5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl italic border border-transparent dark:border-slate-700">
                      "{s.comments || 'Great lesson! Teacher spoke at the right pace and explained the roots clearly.'}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE USER MODAL */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-transparent dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Account</h2>
              <button onClick={() => setIsCreatingUser(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                  <input
                    type="text"
                    value={newUserFirst}
                    onChange={(e) => setNewUserFirst(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    value={newUserLast}
                    onChange={(e) => setNewUserLast(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Temporary Password</label>
                <input
                  type="text"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hebrew Level</label>
                  <select
                    value={newUserLevel}
                    onChange={(e) => setNewUserLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  >
                    <option value="BEGINNER">Beginner (Alef)</option>
                    <option value="INTERMEDIATE">Intermediate (Bet)</option>
                    <option value="ADVANCED">Advanced (Gimel)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCreatingUser(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newUserEmail || !newUserFirst || !newUserLast) {
                    toast.warning(language === 'he' ? 'אנא מלא את כל השדות הנדרשים' : 'Please fill out all fields.');
                    return;
                  }
                  createUserMutation.mutate({
                    email: newUserEmail,
                    password: newUserPass,
                    firstName: newUserFirst,
                    lastName: newUserLast,
                    role: newUserRole,
                    level: newUserLevel,
                  });
                }}
                disabled={createUserMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 text-white text-xs font-bold hover:bg-brand-teal-900 shadow-sm"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {isCreatingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-transparent dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Lesson Package</h2>
              <button onClick={() => setIsCreatingPackage(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Package Name (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Immersion Intensive"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Package Name (Hebrew / עברית)</label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="e.g. מסלול אינטנסיבי"
                  value={pkgNameHe}
                  onChange={(e) => setPkgNameHe(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">25m Lessons</label>
                  <input
                    type="number"
                    value={pkgLessons}
                    onChange={(e) => setPkgLessons(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Valid Days</label>
                  <input
                    type="number"
                    value={pkgDays}
                    onChange={(e) => setPkgDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Price ($)</label>
                  <input
                    type="number"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCreatingPackage(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pkgName) {
                    toast.warning(language === 'he' ? 'שם החבילה הוא שדה חובה' : 'Package name is required');
                    return;
                  }
                  createPackageMutation.mutate({
                    nameEn: pkgName,
                    nameHe: pkgNameHe || pkgName,
                    lessonsCount: pkgLessons,
                    durationDays: pkgDays,
                    priceUsd: pkgPrice,
                    descriptionEn: `${pkgLessons} focused 25-minute live private lessons with native teachers.`,
                    descriptionHe: `${pkgLessons} שיעורים פרטיים ממוקדים של 25 דקות.`,
                  });
                }}
                disabled={createPackageMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 text-white text-xs font-bold hover:bg-brand-teal-900 shadow-sm"
              >
                {createPackageMutation.isPending ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN PACKAGE MODAL */}
      {isAssigningPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-transparent dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'he' ? 'הקצאת חבילת שיעורים לתלמיד' : 'Assign Package to Student'}
              </h2>
              <button onClick={() => setIsAssigningPkg(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'בחר חבילה' : 'Select Package'}
                </label>
                <select
                  value={assignPkgId}
                  onChange={(e) => setAssignPkgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  <option value="">-- {language === 'he' ? 'בחר חבילה' : 'Choose a Package'} --</option>
                  {(packagesData || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {language === 'he' ? p.nameHe : p.nameEn} ({p.lessonsCount} lessons - ${p.priceUsd})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'בחר תלמיד' : 'Select Student'}
                </label>
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  <option value="">-- {language === 'he' ? 'בחר תלמיד' : 'Choose a Student'} --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'התאמת מספר נקודות אישית (אופציונלי)' : 'Custom Credits Override (Optional)'}
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder={language === 'he' ? 'ברירת מחדל לפי הגדרת החבילה' : 'Default from package count'}
                  value={assignCustomCredits}
                  onChange={(e) => setAssignCustomCredits(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAssigningPkg(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!assignPkgId || !assignStudentId) {
                    toast.warning(language === 'he' ? 'אנא בחר גם חבילה וגם תלמיד' : 'Please select both package and student');
                    return;
                  }
                  assignPackageMutation.mutate({
                    pkgId: assignPkgId,
                    studentId: assignStudentId,
                    customCredits: assignCustomCredits ? Number(assignCustomCredits) : undefined,
                  });
                }}
                disabled={assignPackageMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 text-white text-xs font-bold hover:bg-brand-teal-900 shadow-sm"
              >
                {assignPackageMutation.isPending ? 'Assigning...' : language === 'he' ? 'הקצאת חבילה' : 'Assign Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERADMIN DIRECT GRANT CREDITS MODAL */}
      {isGrantingCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-transparent dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'he' ? 'הענקת נקודות שיעור לתלמיד' : 'Grant Student Session Credits'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsGrantingCredits(false);
                  setGrantStudentId('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'בחר תלמיד' : 'Select Student'}
                </label>
                <select
                  value={grantStudentId}
                  onChange={(e) => setGrantStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  <option value="">-- {language === 'he' ? 'בחר תלמיד' : 'Choose a Student'} --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'כמות נקודות שיעור להענקה' : 'Number of Credits to Grant'}
                </label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 5, 10, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGrantCreditsAmount(amt)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                        grantCreditsAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={grantCreditsAmount}
                  onChange={(e) => setGrantCreditsAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'סיבת ההענקה / הערות' : 'Reason / Note'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Superadmin allocation, package purchase, promotional bonus"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsGrantingCredits(false);
                  setGrantStudentId('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!grantStudentId) {
                    toast.warning(language === 'he' ? 'אנא בחר תלמיד' : 'Please select a student');
                    return;
                  }
                  grantCreditsMutation.mutate({
                    studentId: grantStudentId,
                    credits: grantCreditsAmount,
                    reason: grantReason,
                  });
                }}
                disabled={grantCreditsMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-600 shadow-sm"
              >
                {grantCreditsMutation.isPending
                  ? (language === 'he' ? 'מעניק...' : 'Granting...')
                  : (language === 'he' ? `הענק +${grantCreditsAmount} נקודות` : `Grant +${grantCreditsAmount} Credits`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE LESSON MODAL (Supports 25, 40, or 55 min) */}
      {isBookingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-transparent dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'he' ? 'תיאום שיעור חי' : 'Schedule Live Session'}
                </h2>
              </div>
              <button onClick={() => setIsBookingLesson(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Duration Switcher */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'משך השיעור' : 'Session Duration'}
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[25, 40, 55].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBookDuration(d as 25 | 40 | 55)}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        bookDuration === d
                          ? d === 55
                            ? 'bg-purple-600 text-white border-purple-600'
                            : d === 40
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d} {language === 'he' ? 'דקות' : 'Min'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'תלמיד' : 'Student'}
                </label>
                <select
                  value={bookStudentId}
                  onChange={(e) => setBookStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  <option value="">-- {language === 'he' ? 'בחר תלמיד' : 'Choose Student'} --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'מורה' : 'Teacher'}
                </label>
                <select
                  value={bookTeacherId}
                  onChange={(e) => setBookTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  <option value="">-- {language === 'he' ? 'בחר מורה' : 'Choose Teacher'} --</option>
                  {(teachersData || []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'תאריך ושעה (שעון ישראל)' : 'Scheduled Date & Time (Israel Time)'}
                </label>
                <input
                  type="datetime-local"
                  value={bookDateTime}
                  onChange={(e) => setBookDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsBookingLesson(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!bookStudentId || !bookTeacherId || !bookDateTime) {
                    toast.warning(language === 'he' ? 'אנא מלא את כל פרטי השיעור' : 'Please fill in all booking fields');
                    return;
                  }
                  bookLessonMutation.mutate({
                    studentId: bookStudentId,
                    teacherId: bookTeacherId,
                    scheduledAt: new Date(bookDateTime).toISOString(),
                    lessonType: 'REGULAR',
                    durationMinutes: bookDuration,
                    zoomLink: 'https://zoom.us/j/engrew-live',
                  });
                }}
                disabled={bookLessonMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 text-white text-xs font-bold hover:bg-brand-teal-900 shadow-sm"
              >
                {bookLessonMutation.isPending
                  ? (language === 'he' ? 'מתאם...' : 'Scheduling...')
                  : (language === 'he' ? `אישור (${bookDuration} דק׳)` : `Confirm ${bookDuration}m Session`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
