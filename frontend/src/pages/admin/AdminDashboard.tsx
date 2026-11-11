import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useSidebarStore } from '../../store/sidebarStore';
import { toast } from '../../store/toastStore';
import { GlassSidebar } from '../../components/common/GlassSidebar';
import { DashboardSkeleton } from '../../components/common/DashboardSkeleton';
import { SystemLogsTab } from '../../components/admin/SystemLogsTab';
import { ReminderNotificationHubTab } from '../../components/admin/ReminderNotificationHubTab';
import { ReviewsAndFeedbackTab } from '../../components/admin/ReviewsAndFeedbackTab';
import { haptics } from '../../utils/haptics';
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
  Bell,
  BellRing,
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
  Wallet,
  UserCheck,
  UserX,
  ShieldCheck,
  Video,
  AlertTriangle,
  XCircle,
  Info,
  Settings,
  DollarSign,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
  ArrowUpRight,
  Activity,
  UserPlus,
  FileText,
  ChevronRight,
  Zap,
  Target,
  PieChart,
  Shield,
  Terminal,
  LayoutGrid,
  Gift,
  MoreHorizontal,
} from 'lucide-react';

// Custom outline Home icon with inner circle door matching iOS pill island aesthetic
const HomeIslandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2.5 3 9.5v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-10l-9-7Z" />
    <circle cx="12" cy="14" r="2.2" />
  </svg>
);

export const AdminDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { isCollapsed } = useSidebarStore();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'landing_cms' | 'reminders_hub' | 'users' | 'teachers' | 'packages' | 'bookings' | 'surveys' | 'system_logs'
  >(() => {
    const searchTab = new URLSearchParams(window.location.search).get('tab');
    if (searchTab && ['overview', 'landing_cms', 'reminders_hub', 'users', 'teachers', 'packages', 'bookings', 'surveys', 'system_logs'].includes(searchTab)) {
      return searchTab as any;
    }
    return 'overview';
  });

  useEffect(() => {
    const handleNavEvent = (e: any) => {
      if (e.detail?.tab && ['overview', 'landing_cms', 'reminders_hub', 'users', 'teachers', 'packages', 'bookings', 'surveys', 'system_logs'].includes(e.detail.tab)) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('engrew:navigate-tab', handleNavEvent);
    return () => window.removeEventListener('engrew:navigate-tab', handleNavEvent);
  }, []);

  useEffect(() => {
    const searchTab = new URLSearchParams(location.search).get('tab');
    if (searchTab && ['overview', 'landing_cms', 'reminders_hub', 'users', 'teachers', 'packages', 'bookings', 'surveys', 'system_logs'].includes(searchTab)) {
      setActiveTab(searchTab as any);
    }
  }, [location.search]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
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

  // Detailed User Accounts & Roles Management State
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN'>('STUDENT');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLanguagePref, setEditLanguagePref] = useState<'en' | 'he'>('en');
  const [editLevel, setEditLevel] = useState<string>('BEGINNER');
  const [editNotes, setEditNotes] = useState('');
  const [editTotalPoints, setEditTotalPoints] = useState(0);
  const [editBio, setEditBio] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');

  // Scheduled Lessons Filters
  const [lessonSearchTerm, setLessonSearchTerm] = useState('');
  const [lessonStatusFilter, setLessonStatusFilter] = useState('ALL');
  const [lessonDurationFilter, setLessonDurationFilter] = useState('ALL');

  const [isBookingLesson, setIsBookingLesson] = useState(false);
  const [bookStudentId, setBookStudentId] = useState('');
  const [bookTeacherId, setBookTeacherId] = useState('');
  const [bookDateTime, setBookDateTime] = useState('');
  const [bookDuration, setBookDuration] = useState<25 | 40 | 55>(25);
  const [bookZoomLink, setBookZoomLink] = useState('https://zoom.us/j/engrew-live');

  // Session Pricing Management State (25, 40, 55 min)
  const { data: sessionPricing } = useQuery({
    queryKey: ['adminSessionPricing'],
    queryFn: async () => {
      const res = await api.get('/settings/session-pricing');
      return res.data?.pricing;
    },
  });

  const [pricing25, setPricing25] = useState<number | string>(25);
  const [pricing40, setPricing40] = useState<number | string>(40);
  const [pricing55, setPricing55] = useState<number | string>(55);
  const [pricingCurrency, setPricingCurrency] = useState('USD');

  React.useEffect(() => {
    if (sessionPricing) {
      setPricing25(sessionPricing['25'] ?? 25);
      setPricing40(sessionPricing['40'] ?? 40);
      setPricing55(sessionPricing['55'] ?? 55);
      setPricingCurrency(sessionPricing.currency || 'USD');
    }
  }, [sessionPricing]);

  const savePricingMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.put('/settings/session-pricing', { pricing: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSessionPricing'] });
      queryClient.invalidateQueries({ queryKey: ['sessionPricing'] });
      toast.success(
        language === 'he' ? 'מחירי השיעורים עודכנו בהצלחה!' : 'Session booking rates updated successfully!',
        language === 'he' ? 'עודכן' : 'Saved'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update session rates');
    },
  });

  // Student Balance Management State
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [adjustStudent, setAdjustStudent] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number | string>(50);
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState('Top-up by Admin');

  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ studentId, amount, mode, reason }: any) => {
      return api.post(`/users/${studentId}/balance`, { amount, mode, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setIsAdjustingBalance(false);
      setAdjustStudent(null);
      toast.success(
        language === 'he' ? 'יתרת התלמיד עודכנה בהצלחה!' : 'Student balance updated successfully!',
        language === 'he' ? 'עודכן' : 'Success'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update balance');
    },
  });

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

  // Notification Configuration Query & State
  const { data: notifConfigData } = useQuery({
    queryKey: ['notificationConfigAdmin'],
    queryFn: async () => {
      const res = await api.get('/settings/notification-config');
      return res.data?.config;
    },
  });

  const [reminderLeadMinutes, setReminderLeadMinutes] = useState<number>(30);
  React.useEffect(() => {
    if (notifConfigData?.lessonReminderMinutes) {
      setReminderLeadMinutes(Number(notifConfigData.lessonReminderMinutes));
    }
  }, [notifConfigData]);

  const updateNotifConfigMutation = useMutation({
    mutationFn: async (minutes: number) => {
      return api.put('/settings/notification-config', {
        lessonReminderMinutes: minutes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationConfigAdmin'] });
      toast.success(
        language === 'he' ? 'זמן תזכורת השיעור עודכן בהצלחה!' : 'Lesson reminder timing updated successfully!'
      );
    },
    onError: () => {
      toast.error(
        language === 'he' ? 'שגיאה בעדכון הגדרות תזכורת' : 'Failed to update reminder timing'
      );
    },
  });

  // Broadcast Notification State
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');
  const [broadcastTitleEn, setBroadcastTitleEn] = useState('');
  const [broadcastTitleHe, setBroadcastTitleHe] = useState('');
  const [broadcastBodyEn, setBroadcastBodyEn] = useState('');
  const [broadcastBodyHe, setBroadcastBodyHe] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('');

  const sendBroadcastMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/notifications/broadcast', payload);
    },
    onSuccess: (res: any) => {
      toast.success(
        language === 'he'
          ? `הודעת שידור נשלחה בהצלחה ל-${res.data?.totalSent || 0} משתמשים!`
          : `Broadcast notification dispatched to ${res.data?.totalSent || 0} users!`
      );
      setBroadcastTitleEn('');
      setBroadcastTitleHe('');
      setBroadcastBodyEn('');
      setBroadcastBodyHe('');
      setBroadcastUrl('');
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || (language === 'he' ? 'שגיאה בשליחת שידור' : 'Failed to send broadcast')
      );
    },
  });

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
    }: {
      pkgId: string;
      studentId: string;
    }) => {
      return api.post(`/packages/${pkgId}/assign`, { studentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsAssigningPkg(false);
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

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.patch(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setIsEditingUser(false);
      setSelectedUserForEdit(null);
      toast.success(
        language === 'he' ? 'פרטי המשתמש עודכנו בהצלחה!' : 'User account updated successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה בעדכון פרטי המשתמש' : 'Failed to update user')
      );
    },
  });

  const cancelLessonMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return api.delete(`/lessons/${id}`, { data: { reason: reason || 'Cancelled by Admin' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.info(
        language === 'he'
          ? 'השיעור בוטל והתשלום הוחזר במלואו ליתרת התלמיד.'
          : 'Lesson cancelled successfully and full session fee refunded to student balance.'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה בביטול השיעור' : 'Failed to cancel lesson')
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

  const handleOpenEditUser = (u: any) => {
    setSelectedUserForEdit(u);
    setEditFirstName(u.firstName || '');
    setEditLastName(u.lastName || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'STUDENT');
    setEditIsActive(u.isActive !== false);
    setEditLanguagePref(u.languagePref || 'en');
    setEditLevel(u.studentProfile?.level || 'BEGINNER');
    setEditNotes(u.studentProfile?.notes || '');
    setEditTotalPoints(u.studentProfile?.totalPoints || 0);
    setEditBio(u.teacherProfile?.bio || '');
    setEditSpecialties((u.teacherProfile?.specialties || []).join(', '));
    setIsEditingUser(true);
  };

  const handleSaveEditUser = () => {
    if (!selectedUserForEdit) return;
    const specialtiesArray = editSpecialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateUserMutation.mutate({
      id: selectedUserForEdit.id,
      data: {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        role: editRole,
        isActive: editIsActive,
        languagePref: editLanguagePref,
        ...(editRole === 'STUDENT' && {
          level: editLevel,
          notes: editNotes,
          totalPoints: Number(editTotalPoints) || 0,
        }),
        ...(editRole === 'TEACHER' && {
          bio: editBio,
          specialties: specialtiesArray,
        }),
      },
    });
  };

  if (analyticsLoading) {
    return <DashboardSkeleton />;
  }

  const studentsList = usersData?.filter((u: any) => u.role === 'STUDENT') || [];
  const teachersList = usersData?.filter((u: any) => u.role === 'TEACHER') || [];

  const filteredUsers = (usersData || []).filter((u: any) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'ALL' ||
      (userStatusFilter === 'ACTIVE' && u.isActive !== false) ||
      (userStatusFilter === 'INACTIVE' && u.isActive === false);
    const matchesSearch =
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.id && u.id.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalPlatformBalance = (usersData || [])
    .filter((u: any) => u.role === 'STUDENT' && u.studentProfile)
    .reduce((sum: number, u: any) => sum + Number(u.studentProfile?.balance || 0), 0);
  const activeStudentsCount = (usersData || []).filter((u: any) => u.role === 'STUDENT' && u.isActive !== false).length;
  const certifiedTeachersCount = (usersData || []).filter((u: any) => u.role === 'TEACHER').length;
  const platformOwnersCount = (usersData || []).filter((u: any) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length;
  const lowBalanceStudentsList = (usersData || []).filter(
    (u: any) => u.role === 'STUDENT' && Number(u.studentProfile?.balance || 0) < 25
  );

  const handleOpenBalanceModal = (student?: any) => {
    if (student) {
      setAdjustStudent(student);
    } else if (studentsList.length > 0) {
      setAdjustStudent(studentsList[0]);
    } else {
      setAdjustStudent(null);
    }
    setAdjustAmount(50);
    setAdjustMode('add');
    setAdjustReason('Balance top-up by Platform Owner');
    setIsAdjustingBalance(true);
  };

  const filteredLessons = (lessonsData || []).filter((l: any) => {
    const matchesStatus = lessonStatusFilter === 'ALL' || l.status === lessonStatusFilter;
    const dur = l.durationMinutes || 25;
    const matchesDuration = lessonDurationFilter === 'ALL' || String(dur) === lessonDurationFilter;
    const searchLower = lessonSearchTerm.toLowerCase();
    const studentName = `${l.student?.user?.firstName || ''} ${l.student?.user?.lastName || ''} ${l.student?.user?.email || ''}`.toLowerCase();
    const teacherName = `${l.teacher?.user?.firstName || ''} ${l.teacher?.user?.lastName || ''} ${l.teacher?.user?.email || ''}`.toLowerCase();
    const matchesSearch = !lessonSearchTerm || studentName.includes(searchLower) || teacherName.includes(searchLower);
    return matchesStatus && matchesDuration && matchesSearch;
  });

  const totalLessonsCount = (lessonsData || []).length;
  const scheduledLessonsCount = (lessonsData || []).filter((l: any) => l.status === 'SCHEDULED').length;
  const completedLessonsCount = (lessonsData || []).filter((l: any) => l.status === 'COMPLETED').length;
  const cancelledLessonsCount = (lessonsData || []).filter((l: any) => l.status === 'CANCELLED').length;
  const totalMinutesDelivered = (lessonsData || [])
    .filter((l: any) => l.status === 'COMPLETED')
    .reduce((sum: number, l: any) => sum + (l.durationMinutes || 25), 0);

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
    {
      id: 'reminders_hub',
      label: 'Reminder Engine & Hub',
      labelHe: 'מנוע תזכורות והתראות',
      icon: BellRing,
      badge: 'Live',
      badgeColor: 'bg-emerald-500 text-white',
    },
    ...(currentUser?.role === 'SUPER_ADMIN'
      ? [
          {
            id: 'system_logs',
            label: 'System Logs',
            labelHe: 'יומן מערכת ובקרה',
            icon: Terminal,
            badge: 'Live',
            badgeColor: 'bg-rose-500 text-white',
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen w-full relative">
      <div className="w-full">
        {/* Apple-Style Glassy Left Sidebar */}
        <GlassSidebar
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId as any);
            setIsMobileMoreOpen(false);
          }}
          user={{
            firstName: currentUser?.firstName,
            lastName: currentUser?.lastName,
            email: currentUser?.email,
            avatarUrl: currentUser?.avatarUrl,
            role: currentUser?.role === 'SUPER_ADMIN'
              ? (language === 'he' ? 'בעלים ומנהל ראשי' : 'Platform Owner')
              : (currentUser?.role || (language === 'he' ? 'בעלים ומנהל ראשי' : 'Platform Owner')),
          }}
          panelSubtitle={language === 'he' ? 'מרכז בעל הפלטפורמה' : 'Platform Owner Hub'}
          isOpenMobile={false}
          onCloseMobile={() => setIsMobileMoreOpen(false)}
        />

        {/* Main Content Area on the right */}
        <main className={`w-full transition-all duration-300 ${
          isCollapsed
            ? 'lg:ps-[calc(5rem+1.5rem)]'
            : 'lg:ps-[calc(18rem+1.75rem)] xl:ps-[calc(20rem+2.25rem)]'
        } p-4 sm:p-6 lg:pe-7 xl:pe-9 lg:pt-8 xl:pt-8 min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] space-y-8`}>
          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* 1. Executive Top Banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/10">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold mb-3 border border-white/15">
                      <Sparkles className="w-4 h-4 text-brand-olive-400" />
                      <span>{language === 'he' ? 'מרכז שליטה ואנליטיקה מתקדמת' : 'Executive Control & Analytics Hub'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-white/70">{language === 'he' ? 'פעיל' : 'Live'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                      {language === 'he' ? 'סקירת ניהול Engrew' : 'Engrew Management Overview'}
                    </h1>
                    <p className="text-brand-teal-100/90 text-xs sm:text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
                      {language === 'he'
                        ? 'מדדי ביצוע בזמן אמת, יתרות חשבונות תלמידים, שיעורי 25 דקות, נתוני הכנסות ופעולות מהירות למנהל המערכת.'
                        : 'Real-time financial telemetry, student wallet reserves, 25-minute lesson utilization, revenue reporting, and one-click administrator actions.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Interactive Administrator Quick Actions Command Center */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {language === 'he' ? 'מרכז פעולות מהירות למנהל' : 'Administrator Quick Actions'}
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'he' ? 'פעולות ישירות בלחיצה אחת לניהול שוטף' : 'One-click shortcuts to update balances, schedule lessons, and govern users'}
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    <span>{language === 'he' ? 'מרכז שליטה חי' : 'Live Command Hub'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Action 1: Add Balance */}
                  <button
                    onClick={() => handleOpenBalanceModal()}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/70 dark:border-emerald-800/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'טעינת יתרה' : 'Top Up Balance'}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {language === 'he' ? '+ הוסף לתלמיד' : '+ Credit Student'}
                      </span>
                    </div>
                  </button>

                  {/* Action 2: Book Lesson */}
                  <button
                    onClick={() => setIsBookingLesson(true)}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-teal-50/80 to-white dark:from-teal-950/20 dark:to-slate-900 border border-teal-200/70 dark:border-teal-800/50 hover:border-brand-teal-500 dark:hover:border-brand-teal-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'קביעת שיעור' : 'Book Session'}
                      </span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                        {language === 'he' ? '25 / 40 / 55 דק׳' : '25 / 40 / 55 Min'}
                      </span>
                    </div>
                  </button>

                  {/* Action 3: Create User */}
                  <button
                    onClick={() => setIsCreatingUser(true)}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-800/50 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'משתמש חדש' : 'Create User'}
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold">
                        {language === 'he' ? 'תלמיד או מורה' : 'Student / Teacher'}
                      </span>
                    </div>
                  </button>

                  {/* Action 4: Create Package */}
                  <button
                    onClick={() => setIsCreatingPackage(true)}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/20 dark:to-slate-900 border border-amber-200/70 dark:border-amber-800/50 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'חבילה חדשה' : 'New Package'}
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                        {language === 'he' ? 'תוכנית לימודים' : 'Pricing & Lessons'}
                      </span>
                    </div>
                  </button>

                  {/* Action 5: User Accounts & Roles */}
                  <button
                    onClick={() => setActiveTab('users')}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-sky-50/80 to-white dark:from-sky-950/20 dark:to-slate-900 border border-sky-200/70 dark:border-sky-800/50 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'הרשאות ומשתמשים' : 'Roles & Access'}
                      </span>
                      <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                        {language === 'he' ? 'ניהול מלא' : 'Full Governance'}
                      </span>
                    </div>
                  </button>

                  {/* Action 6: Scheduled Sessions */}
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-purple-50/80 to-white dark:from-purple-950/20 dark:to-slate-900 border border-purple-200/70 dark:border-purple-800/50 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'כל השיעורים' : 'All Lessons'}
                      </span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">
                        {language === 'he' ? 'לוח בקרה חי' : 'Live Schedule'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Deep Analysis KPI Stat Cards Grid (6 High-Density Telemetry Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
                {/* KPI 1: Gross Platform Revenue */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'הכנסות הפלטפורמה' : 'Platform Revenue'}
                      </span>
                      <BarChart2 className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      ${analytics?.kpis?.totalRevenue?.toLocaleString() || '1,420'}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +{analytics?.kpis?.revenueGrowth || '18.4'}%
                    </span>
                    <span className="text-slate-400">
                      {language === 'he' ? `מתחילת החודש: $${analytics?.kpis?.revenueMTD || '540'}` : `MTD: $${analytics?.kpis?.revenueMTD || '540'}`}
                    </span>
                  </div>
                </div>

                {/* KPI 2: Outstanding Student Balances */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'ארנקי יתרות תלמידים' : 'Student Wallet Pool'}
                      </span>
                      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ${(analytics?.kpis?.totalStudentBalance !== undefined ? analytics.kpis.totalStudentBalance : totalPlatformBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'ממוצע:' : 'Avg:'} ${(studentsList.length > 0 ? ((analytics?.kpis?.totalStudentBalance || totalPlatformBalance) / studentsList.length) : 0).toFixed(2)}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'he' ? 'עתודה פעילה' : 'Active Reserve'}
                    </span>
                  </div>
                </div>

                {/* KPI 3: Lessons Delivered & Distribution */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'סה״כ שיעורים' : 'Total Lessons'}
                      </span>
                      <Clock className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.totalLessons || totalLessonsCount || 12}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-brand-teal-700 dark:text-brand-teal-300">
                      {language === 'he' ? 'ליבת 25 דק׳: 85%' : '25m Core: 85%'}
                    </span>
                    <span className="text-slate-400">
                      {language === 'he' ? `${completedLessonsCount} הושלמו` : `${completedLessonsCount} done`}
                    </span>
                  </div>
                </div>

                {/* KPI 4: Slot Utilization Rate */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'ניצול משבצות הוראה' : 'Slot Utilization'}
                      </span>
                      <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.lessonUtilization || 82}%
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'שיא 16:00-21:00' : 'Peak 16:00-21:00'}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {language === 'he' ? 'תפוסה גבוהה' : 'High Capacity'}
                    </span>
                  </div>
                </div>

                {/* KPI 5: Active Enrolled Students */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'תלמידים פעילים' : 'Active Students'}
                      </span>
                      <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.activeStudents || studentsList.length}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'he' ? '100% שימור' : '100% Retention'}
                    </span>
                    <span className="text-slate-400">
                      {language === 'he' ? `ש״ב: ${analytics?.kpis?.homeworkCompletionRate || 92}%` : `HW: ${analytics?.kpis?.homeworkCompletionRate || 92}%`}
                    </span>
                  </div>
                </div>

                {/* KPI 6: Teacher Excellence Score */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'ציון איכות מורים' : 'Teacher Score'}
                      </span>
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {analytics?.kpis?.avgSatisfaction || '4.95'} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {language === 'he' ? 'סקרים מאומתים' : 'Verified Surveys'}
                    </span>
                    <span className="text-slate-400">
                      {language === 'he' ? `${certifiedTeachersCount} מורים` : `${certifiedTeachersCount} Teachers`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Dual Operational Desk: Students Needing Balance Top-Up & System Health */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: Students Needing Balance Top-Up (< $25) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-900 dark:text-white">
                            {language === 'he' ? 'תלמידים הזקוקים לטעינת יתרה (< $25)' : 'Students Needing Balance Top-Up (< $25)'}
                          </h2>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'he'
                              ? 'יתרה שאינה מספיקה להזמנת שיעור 25 דקות ($25). לחץ לטעינה מיידית.'
                              : 'Balance insufficient to book a 25-min session ($25). One-click credit action available.'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">
                        {lowBalanceStudentsList.length} {language === 'he' ? 'תלמידים' : 'Students'}
                      </span>
                    </div>

                    {lowBalanceStudentsList.length > 0 ? (
                      <div className="space-y-2.5">
                        {lowBalanceStudentsList.slice(0, 5).map((s: any) => (
                          <div
                            key={s.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-amber-400 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                                {s.firstName?.[0] || 'S'}{s.lastName?.[0] || ''}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {s.firstName} {s.lastName}
                                </h4>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                                  {s.email}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  {language === 'he' ? 'יתרה' : 'Balance'}
                                </span>
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                                  ${Number(s.studentProfile?.balance || 0).toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleOpenBalanceModal(s)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{language === 'he' ? 'הוסף יתרה' : 'Top Up'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                        <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          {language === 'he' ? 'כל התלמידים עם יתרה מספקת' : 'All Student Wallets Well Funded'}
                        </h4>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 max-w-sm mx-auto">
                          {language === 'he'
                            ? 'כל התלמידים מחזיקים ביתרה של $25 ומעלה המאפשרת קביעת שיעורים חופשית.'
                            : 'Every active student has at least $25 balance for seamless 25-minute lesson booking.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'עלות מינימלית לשיעור 25 דק׳:' : 'Minimum 25-min booking cost:'} <strong className="text-slate-800 dark:text-slate-200">$25.00</strong>
                    </span>
                    <button
                      onClick={() => handleOpenBalanceModal()}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'טעינה לתלמיד אחר' : 'Credit Any Student'}</span>
                    </button>
                  </div>
                </div>

                {/* Right: Operational Health & Live System Alerts */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center font-bold">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-900 dark:text-white">
                            {language === 'he' ? 'התראות תפעוליות והמלצות מערכת' : 'Operational Alerts & Platform Health'}
                          </h2>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'he' ? 'עדכונים אוטומטיים על סיום חבילות, בדיקות מורים ופעילות' : 'Automated notifications for package expirations and teaching quality'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        {(analytics?.alerts || []).length || 3} {language === 'he' ? 'פעילות' : 'Active'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(analytics?.alerts && analytics.alerts.length > 0 ? analytics.alerts : [
                        {
                          type: 'info',
                          title: language === 'he' ? 'מתכונת 25 דקות לשימור גבוה פעילה' : '25-Minute High Retention Format Active',
                          desc: language === 'he' ? 'כל השיעורים המתוכננים פועלים במתכונת 25 דקות פדגוגית עם משוב מיידי מהמורה.' : 'All scheduled sessions follow the pedagogical 25-minute focus block with immediate teacher feedback.'
                        },
                        {
                          type: 'warning',
                          title: language === 'he' ? 'החזר כספי אוטומטי בביטול מופעל' : 'Auto-Refund on Cancellation Enabled',
                          desc: language === 'he' ? 'תלמידים ומנהלים מקבלים החזר כספי מלא ומיידי ליתרת החשבון בעת ביטול שיעור מראש.' : 'Admins and students receive instant dollar-for-dollar wallet refunds when sessions are cancelled ahead of time.'
                        },
                        {
                          type: 'info',
                          title: language === 'he' ? 'סנכרון מלא לשעון ישראל (ירושלים)' : 'Israeli Timezone Synchronized (Asia/Jerusalem)',
                          desc: language === 'he' ? 'כל המשבצות ויומני השיעורים מתואמים במדויק לפי שעון ירושלים.' : 'All booking slots and lesson calendars strictly adhere to Jerusalem standard & daylight time.'
                        }
                      ]).slice(0, 4).map((alert: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                            alert.type === 'critical'
                              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                              : alert.type === 'warning'
                              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                              : 'bg-teal-50/60 dark:bg-brand-teal-950/20 border-teal-200/80 dark:border-brand-teal-900/60 text-teal-950 dark:text-brand-teal-200'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {alert.type === 'critical' ? (
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            ) : alert.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs mb-0.5">{alert.title}</h4>
                            <p className="text-[11px] opacity-90 leading-relaxed">{alert.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'סטטוס מערכת:' : 'System Status:'} <strong className="text-emerald-600 dark:text-emerald-400">{language === 'he' ? '100% תקין ופעיל' : '100% Operational'}</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline flex items-center gap-1"
                    >
                      <span>{language === 'he' ? 'צפה בכל השיעורים' : 'View Schedule Hub'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Deep Analytics Visual Breakdown: Monthly Trajectory & 25-Min Lesson Adoption */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Monthly Revenue & Lesson Trajectory */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {language === 'he' ? 'מגמות ביצוע חצי שנתיות (יוני - נובמבר)' : '6-Month Growth & Trajectory'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {language === 'he' ? 'השוואת מחזורי הכנסה ($) ומספר שיעורים חודשיים' : 'Monthly revenue expansion and 25-minute lesson delivery volume'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-brand-teal-800 dark:text-brand-teal-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-700 dark:bg-brand-teal-400" /> {language === 'he' ? 'הכנסות ($)' : 'Revenue ($)'}
                      </span>
                      <span className="flex items-center gap-1.5 text-brand-olive-600 dark:text-brand-olive-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-olive-500" /> {language === 'he' ? 'שיעורים' : 'Lessons'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar Graph */}
                  <div className="grid grid-cols-6 gap-3 items-end h-52 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                    {(analytics?.monthlyTrends || [
                      { month: 'Jun', revenue: 450, lessons: 12 },
                      { month: 'Jul', revenue: 660, lessons: 17 },
                      { month: 'Aug', revenue: 870, lessons: 22 },
                      { month: 'Sep', revenue: 1080, lessons: 27 },
                      { month: 'Oct', revenue: 1290, lessons: 32 },
                      { month: 'Nov', revenue: 1500, lessons: 37 },
                    ]).map((m: any, idx: number) => {
                      const maxRev = 1600;
                      const revPct = Math.min(100, Math.round((m.revenue / maxRev) * 100));
                      const lesPct = Math.min(100, Math.round((m.lessons / 40) * 100));
                      const monthMapHe: Record<string, string> = {
                        Jun: 'יונ׳',
                        Jul: 'יול׳',
                        Aug: 'אוג׳',
                        Sep: 'ספט׳',
                        Oct: 'אוק׳',
                        Nov: 'נוב׳',
                      };
                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group">
                          <div className="text-[10px] font-black text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            ${m.revenue}
                          </div>
                          <div className="w-full flex items-end justify-center gap-1.5 h-36">
                            <div
                              style={{ height: `${revPct}%` }}
                              className="w-3.5 sm:w-5 bg-gradient-to-t from-brand-teal-900 to-brand-teal-600 rounded-t-lg transition-all group-hover:brightness-110 shadow-xs"
                            />
                            <div
                              style={{ height: `${lesPct}%` }}
                              className="w-3.5 sm:w-5 bg-gradient-to-t from-brand-olive-600 to-brand-olive-400 rounded-t-lg transition-all group-hover:brightness-110 shadow-xs"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                            {language === 'he' ? (monthMapHe[m.month] || m.month) : m.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 text-center">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {language === 'he' ? 'צמיחה חודשית ממוצעת' : 'Avg Monthly Growth'}
                      </span>
                      <h5 className="text-base font-black text-emerald-600 dark:text-emerald-400">+22.5%</h5>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {language === 'he' ? 'צפי רבעון 4' : 'Projected Q4'}
                      </span>
                      <h5 className="text-base font-black text-slate-900 dark:text-white">$4,800+</h5>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {language === 'he' ? 'שיעור השלמת שיעורים' : 'Completion Rate'}
                      </span>
                      <h5 className="text-base font-black text-brand-teal-700 dark:text-brand-teal-300">98.2%</h5>
                    </div>
                  </div>
                </div>

                {/* Session Format Breakdown: 25 Min Focus Block */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                      {language === 'he' ? 'התפלגות פורמט השיעורים' : 'Session Format Distribution'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      {language === 'he'
                        ? 'מודל 25 הדקות המוכח של Engrew לשימור קוגניטיבי מול משבצות מוארכות'
                        : "Engrew's proven 25-minute cognitive retention model vs extended slots"}
                    </p>

                    <div className="space-y-4">
                      {/* 25-Min Format */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span className="flex items-center gap-1.5 text-brand-teal-800 dark:text-brand-teal-300">
                            <Clock className="w-3.5 h-3.5" /> {language === 'he' ? 'בלוק מיקוד 25 דקות (ליבה)' : '25-Minute Focus Block (Core)'}
                          </span>
                          <span className="text-slate-900 dark:text-white font-black">
                            {analytics?.durationBreakdown?.[25] || 10} {language === 'he' ? 'שיעורים (85%)' : 'sessions (85%)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-brand-teal-700 h-full rounded-full w-[85%]" />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {language === 'he'
                            ? 'שימור אופטימלי, ללא עייפות קוגניטיבית, תעריף $25 לשיעור'
                            : 'Optimal retention, zero cognitive fatigue, $25 session rate'}
                        </span>
                      </div>

                      {/* 40-Min Format */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span className="flex items-center gap-1.5 text-brand-olive-700 dark:text-brand-olive-400">
                            <Clock className="w-3.5 h-3.5" /> {language === 'he' ? 'משבצת מורחבת 40 דקות' : '40-Minute Extended'}
                          </span>
                          <span className="text-slate-900 dark:text-white font-black">
                            {analytics?.durationBreakdown?.[40] || 2} {language === 'he' ? 'שיעורים (10%)' : 'sessions (10%)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-brand-olive-500 h-full rounded-full w-[10%]" />
                        </div>
                      </div>

                      {/* 55-Min Format */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                            <Clock className="w-3.5 h-3.5" /> {language === 'he' ? 'משבצת אינטנסיבית 55 דקות' : '55-Minute Intensive'}
                          </span>
                          <span className="text-slate-900 dark:text-white font-black">
                            {analytics?.durationBreakdown?.[55] || 1} {language === 'he' ? 'שיעורים (5%)' : 'sessions (5%)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full w-[5%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-2xl bg-brand-teal-50/70 dark:bg-brand-teal-950/40 border border-brand-teal-200/80 dark:border-brand-teal-800 text-xs">
                    <span className="font-black text-brand-teal-900 dark:text-brand-teal-200 block mb-1">
                      {language === 'he' ? '💡 תובנה פדגוגית:' : '💡 Pedagogical Insight:'}
                    </span>
                    <p className="text-[11px] text-brand-teal-800 dark:text-brand-teal-300 leading-relaxed">
                      {language === 'he'
                        ? 'שיעורי 25 דקות מניבים תדירות שבועית גבוהה פי 2.4 ומעל 94% שימור ידע בהשוואה לשיעורים סטנדרטיים של 60 דקות.'
                        : '25-minute lessons yield 2.4x higher weekly lesson frequency and over 94% retention compared to standard 60-minute blocks.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Live Balance & Deposit Audit Trail */}
              {analytics?.recentBalanceTransactions && analytics.recentBalanceTransactions.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {language === 'he' ? 'יומן תנועות יתרה וטעינות אחרונות' : 'Recent Balance Ledger & Deposit Activity'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {language === 'he' ? 'רישום חי של הפקדות כספיות, חיובים וזיכויים' : 'Live audit trail of student wallet credits, booking deductions, and refunds'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenBalanceModal()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'הוסף יתרה' : 'Top Up Student'}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                          <th className="py-3 px-4">{language === 'he' ? 'סוג פעולה' : 'Type'}</th>
                          <th className="py-3 px-4">{language === 'he' ? 'סכום' : 'Amount'}</th>
                          <th className="py-3 px-4">{language === 'he' ? 'יתרה לאחר פעולה' : 'Balance After'}</th>
                          <th className="py-3 px-4">{language === 'he' ? 'תיאור / הערה' : 'Description / Note'}</th>
                          <th className="py-3 px-4">{language === 'he' ? 'תאריך' : 'Date'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {analytics.recentBalanceTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {tx.studentName}
                              <span className="text-[10px] text-slate-400 font-normal block">{tx.studentEmail}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                                tx.type === 'ADMIN_ADJUSTMENT'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                  : tx.type === 'SESSION_REFUND'
                                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}>
                                {tx.type === 'ADMIN_ADJUSTMENT'
                                  ? (language === 'he' ? 'טעינת מנהל' : 'Admin Credit')
                                  : tx.type === 'SESSION_REFUND'
                                  ? (language === 'he' ? 'החזר כספי' : 'Refund')
                                  : tx.type === 'SESSION_BOOKING'
                                  ? (language === 'he' ? 'הזמנת שיעור' : 'Booking')
                                  : (tx.type?.replace('_', ' ') || 'Adjustment')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-black">
                              <span className={tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {tx.amount >= 0 ? `+$${Number(tx.amount).toFixed(2)}` : `-$${Math.abs(Number(tx.amount)).toFixed(2)}`}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              ${Number(tx.balanceAfter).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {tx.description || (language === 'he' ? 'עדכון יתרה במערכת' : 'System balance update')}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {formatIsraelDateTime(tx.createdAt, {
                                includeDate: true,
                                locale: language === 'he' ? 'he-IL' : 'en-US',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. Upcoming 25-Minute Bookings Live Feed */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? 'שיעורי 25 דקות קרובים' : 'Upcoming 25-Minute Bookings'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'לוח מעקב חי אחר מפגשי לימוד מתואמים' : 'Live feed of scheduled sessions across all teachers with direct launcher'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:text-brand-teal-900 dark:hover:text-brand-teal-300 flex items-center gap-1"
                  >
                    <span>{language === 'he' ? 'צפה בכל השיעורים' : 'View All'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3 px-4">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3 px-4">{language === 'he' ? 'תאריך ושעה (ישראל)' : 'Date & Time (Israel)'}</th>
                        <th className="py-3 px-4">{language === 'he' ? 'משך' : 'Duration'}</th>
                        <th className="py-3 px-4">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3 px-4 text-right">{language === 'he' ? 'פעולה מהירה' : 'Quick Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {(lessonsData || []).slice(0, 6).map((l: any) => (
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
                            <span className="px-2.5 py-0.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 font-bold text-[10px]">
                              {language === 'he' ? `${l.durationMinutes || 25} דקות` : `${l.durationMinutes || 25} Minutes`}
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
                              {l.status === 'SCHEDULED'
                                ? (language === 'he' ? 'מתוכנן' : 'SCHEDULED')
                                : l.status === 'COMPLETED'
                                ? (language === 'he' ? 'הושלם' : 'COMPLETED')
                                : (language === 'he' ? 'בוטל' : l.status)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {l.zoomLink ? (
                              <a
                                href={l.zoomLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-[10px] shadow-xs"
                              >
                                <Video className="w-3 h-3" />
                                <span>{language === 'he' ? 'כניסה לזום' : 'Join'}</span>
                              </a>
                            ) : (
                              <button
                                onClick={() => setActiveTab('bookings')}
                                className="text-slate-400 hover:text-brand-teal-700 text-[11px] font-bold"
                              >
                                {language === 'he' ? 'ניהול' : 'Manage'}
                              </button>
                            )}
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

              {/* Notification & Pre-Lesson Reminder Hub Quick Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 rounded-3xl p-6 border border-amber-200/80 dark:border-amber-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'he' ? 'מנוע תזכורות שיעורים ומרכז התראות שודרג ללשונית נפרדת' : 'Dedicated Reminder Engine & Notification Hub'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'he'
                        ? 'כל הגדרות התזמון, תבניות ההודעות, שידורים חיים ויומן התראות מלא עברו ללשונית ייעודית.'
                        : 'Custom countdown intervals, audio chimes, live broadcast studio, and audit logs now live in a dedicated tab.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reminders_hub')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <BellRing className="w-4 h-4" />
                  <span>{language === 'he' ? 'פתח מרכז תזכורות והתראות' : 'Open Reminders Hub'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 text-xs font-bold text-brand-teal-900 dark:text-brand-teal-300 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-olive-500" />
                    <span>{language === 'he' ? 'ניהול משתמשים והרשאות' : 'Master User & Role Governance'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {language === 'he' ? 'חשבונות משתמשים והרשאות מערכת' : 'User Accounts & Roles'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'ניהול מלא של תלמידים, מורים מוסמכים והרשאות פלטפורמה, יתרות כספיות, הגדרות רמה ואיפוס סיסמאות.'
                      : 'Comprehensive access control to inspect, edit, adjust balances, configure Hebrew levels, and manage all accounts.'}
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

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'סה״כ חשבונות' : 'Total Accounts'}
                    </span>
                    <Users className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {usersData?.length || 0}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'תלמידים פעילים' : 'Active Students'}
                    </span>
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {activeStudentsCount}
                    </p>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      (${totalPlatformBalance.toFixed(2)} {language === 'he' ? 'ביתרות' : 'funds'})
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'מורים מוסמכים' : 'Certified Teachers'}
                    </span>
                    <GraduationCap className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {certifiedTeachersCount}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'בעלי פלטפורמה / מנהלים' : 'Platform Owners / Admins'}
                    </span>
                    <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {platformOwnersCount}
                  </p>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={language === 'he' ? 'חיפוש לפי שם, אימייל או מזהה...' : 'Search by name, email, or user ID...'}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal-800"
                  />
                  {userSearchTerm && (
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                    {[
                      { id: 'ALL', labelEn: 'All Roles', labelHe: 'כל התפקידים' },
                      { id: 'STUDENT', labelEn: 'Students', labelHe: 'תלמידים' },
                      { id: 'TEACHER', labelEn: 'Teachers', labelHe: 'מורים' },
                      { id: 'SUPER_ADMIN', labelEn: 'Platform Owner', labelHe: 'בעל פלטפורמה' },
                    ].map((rf) => (
                      <button
                        key={rf.id}
                        onClick={() => setUserRoleFilter(rf.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          userRoleFilter === rf.id
                            ? 'bg-brand-teal-800 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        {language === 'he' ? rf.labelHe : rf.labelEn}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                    {[
                      { id: 'ALL', labelEn: 'All Status', labelHe: 'הכל' },
                      { id: 'ACTIVE', labelEn: 'Active', labelHe: 'פעיל' },
                      { id: 'INACTIVE', labelEn: 'Suspended', labelHe: 'מושעה' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setUserStatusFilter(st.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          userStatusFilter === st.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {language === 'he' ? st.labelHe : st.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700 text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">{language === 'he' ? 'משתמש' : 'User'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'תפקיד' : 'Role'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'רמה / התמחות' : 'Hebrew Level / Specialty'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'יתרת חשבון' : 'Account Balance'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'הישגים ופעילות' : 'Gamification / Stats'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'שפה' : 'Lang'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3.5 px-4 text-right">{language === 'he' ? 'פעולות ניהול' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="font-bold">{language === 'he' ? 'לא נמצאו משתמשים התואמים לחיפוש' : 'No users match your filters'}</p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u: any) => {
                          const isStudent = u.role === 'STUDENT';
                          const isTeacher = u.role === 'TEACHER';
                          const isOwner = u.role === 'SUPER_ADMIN';

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                              {/* User Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal-100 to-brand-olive-100 dark:from-brand-teal-950 dark:to-brand-olive-950 text-brand-teal-900 dark:text-brand-teal-200 font-extrabold flex items-center justify-center text-xs shrink-0 border border-brand-teal-200/50 dark:border-brand-teal-800 shadow-2xs">
                                    {u.firstName?.charAt(0) || 'U'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">
                                      {u.firstName} {u.lastName}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={u.email}>
                                      {u.email}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Role */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${
                                    isOwner
                                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                      : isTeacher
                                      ? 'bg-brand-olive-100 dark:bg-brand-olive-950/70 text-brand-olive-900 dark:text-brand-olive-300 border border-brand-olive-200 dark:border-brand-olive-800'
                                      : u.role === 'ADMIN'
                                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                      : 'bg-brand-teal-100 dark:bg-brand-teal-950/70 text-brand-teal-900 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800'
                                  }`}
                                >
                                  {isOwner && <Award className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                                  {isOwner ? (language === 'he' ? 'בעל פלטפורמה' : 'Platform Owner') : u.role}
                                </span>
                              </td>

                              {/* Level / Specialty */}
                              <td className="py-3.5 px-4">
                                {isStudent ? (
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {u.studentProfile?.level ? t(`levels.${u.studentProfile.level}`) : 'BEGINNER'}
                                  </span>
                                ) : isTeacher ? (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                      {language === 'he' ? 'מורה מוסמך' : 'Native Instructor'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[150px]">
                                      {(u.teacherProfile?.specialties || []).slice(0, 2).join(', ') || 'Modern Hebrew'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                                )}
                              </td>

                              {/* Account Balance */}
                              <td className="py-3.5 px-4">
                                {isStudent && u.studentProfile ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                                      ${Number(u.studentProfile.balance || 0).toFixed(2)}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setAdjustStudent(u);
                                        setAdjustAmount(50);
                                        setAdjustMode('add');
                                        setAdjustReason('Admin balance adjustment');
                                        setIsAdjustingBalance(true);
                                      }}
                                      title={language === 'he' ? 'התאם יתרה' : 'Quick Adjust Balance'}
                                      className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                                    >
                                      <Wallet className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                                )}
                              </td>

                              {/* Gamification / Activity */}
                              <td className="py-3.5 px-4">
                                {isStudent && u.studentProfile ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-brand-teal-800 dark:text-brand-teal-300">
                                    <Award className="w-3.5 h-3.5 text-brand-olive-500" />
                                    {u.studentProfile.totalPoints || 0} pts
                                  </span>
                                ) : isTeacher && u.teacherProfile ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    {u.teacherProfile.ratingAvg ? Number(u.teacherProfile.ratingAvg).toFixed(1) : '5.0'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                                )}
                              </td>

                              {/* Language */}
                              <td className="py-3.5 px-4 uppercase text-[11px] font-black text-slate-600 dark:text-slate-400">
                                {u.languagePref || 'en'}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4">
                                {u.isActive !== false ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {language === 'he' ? 'פעיל' : 'Active'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {language === 'he' ? 'מושעה' : 'Suspended'}
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {/* Deep User Management Button */}
                                  <button
                                    onClick={() => handleOpenEditUser(u)}
                                    title={language === 'he' ? 'ניהול מלא ועריכת משתמש' : 'Full User Governance & Edit'}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700"
                                  >
                                    <Sliders className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                                    <span className="hidden sm:inline">{language === 'he' ? 'ניהול' : 'Manage'}</span>
                                  </button>

                                  {/* Quick Reset Password */}
                                  <button
                                    onClick={() => resetPasswordMutation.mutate(u.id)}
                                    title={language === 'he' ? 'איפוס סיסמה' : 'Reset Password'}
                                    className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors border border-slate-200/50 dark:border-slate-800"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Deactivate / Delete */}
                                  <button
                                    onClick={() => {
                                      if (window.confirm(language === 'he' ? `האם למחוק את ${u.firstName} ${u.lastName}?` : `Permanently delete ${u.firstName} ${u.lastName}?`)) {
                                        deleteUserMutation.mutate(u.id);
                                      }
                                    }}
                                    title={language === 'he' ? 'מחיקת משתמש' : 'Delete User'}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-slate-200/50 dark:border-slate-800"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
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
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs ring-1 ring-teal-400/30">
                            {`${t.user?.firstName?.charAt(0) || ''}${t.user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'T'}
                          </div>
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
                    {language === 'he' ? 'חבילות שיעורים ותוכניות לימוד' : 'Lesson Packages & Student Allocations'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'חבילות לימוד ומסלולים מובנים להוראת עברית בהתאמה אישית.'
                      : 'Curriculum bundles and lesson packages for structured Hebrew learning paths.'}
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

              {/* Session Booking Rates by Duration (25m / 40m / 55m) */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {language === 'he' ? 'תמחור שיעורים לפי משך מפגש' : 'Session Booking Rates by Duration'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {language === 'he'
                          ? 'קבע את התעריף שינוכה אוטומטית מיתרת התלמיד בעת תיאום שיעור'
                          : 'Set the automatic balance deduction amount when students book each session duration'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'מטבע:' : 'Currency:'}
                    </span>
                    <select
                      value={pricingCurrency}
                      onChange={(e) => setPricingCurrency(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ILS">ILS (₪)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        25 {language === 'he' ? 'דקות' : 'Minutes'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        {language === 'he' ? 'רגיל' : 'Standard'}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {pricingCurrency === 'ILS' ? '₪' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pricing25}
                        onChange={(e) => setPricing25(e.target.value)}
                        className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        placeholder="25"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'he' ? 'עלות למפגש 25 דק׳' : 'Cost per 25m private session'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        40 {language === 'he' ? 'דקות' : 'Minutes'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
                        {language === 'he' ? 'מורחב' : 'Extended'}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {pricingCurrency === 'ILS' ? '₪' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pricing40}
                        onChange={(e) => setPricing40(e.target.value)}
                        className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        placeholder="40"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'he' ? 'עלות למפגש 40 דק׳' : 'Cost per 40m intensive session'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        55 {language === 'he' ? 'דקות' : 'Minutes'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                        {language === 'he' ? 'מלא' : 'Full Hour'}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {pricingCurrency === 'ILS' ? '₪' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pricing55}
                        onChange={(e) => setPricing55(e.target.value)}
                        className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-extrabold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        placeholder="55"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'he' ? 'עלות למפגש 55 דק׳' : 'Cost per 55m comprehensive session'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      savePricingMutation.mutate({
                        '25': Number(pricing25) || 25,
                        '40': Number(pricing40) || 40,
                        '55': Number(pricing55) || 55,
                        currency: pricingCurrency,
                      });
                    }}
                    disabled={savePricingMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-brand-olive-300" />
                    <span>
                      {savePricingMutation.isPending
                        ? (language === 'he' ? 'שומר תמחור...' : 'Saving Rates...')
                        : (language === 'he' ? 'שמור תמחור שיעורים' : 'Save Session Rates')}
                    </span>
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
              {/* Header Banner */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 text-xs font-bold text-brand-teal-900 dark:text-brand-teal-300 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-brand-olive-500" />
                    <span>{language === 'he' ? 'יומן שיעורים אינטראקטיבי' : 'Multi-Duration Live Session Command Center'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {language === 'he' ? 'כל השיעורים המתוזמנים (25 / 40 / 55 דק׳)' : 'All Scheduled Lessons (25 / 40 / 55 Min)'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'ניהול, מעקב וביטול שיעורים עם החזר כספי אוטומטי ליתרת התלמיד. כל הזמנים מוצגים לפי שעון ישראל (פורמט 12 שעות AM/PM).'
                      : 'Live schedule monitoring, Zoom classroom links, and instant cancellations with automated student balance refunds. All times formatted in Israel Time (12-Hour AM/PM).'}
                  </p>
                </div>
                <button
                  onClick={() => setIsBookingLesson(true)}
                  className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 text-brand-olive-300" />
                  <span>{language === 'he' ? 'קביעת שיעור חי' : 'Book Live Session'}</span>
                </button>
              </div>

              {/* KPI Metrics Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {language === 'he' ? 'סה״כ מפגשים' : 'Total Sessions'}
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {totalLessonsCount}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    {language === 'he' ? 'מתוזמנים / קרובים' : 'Confirmed / Upcoming'}
                  </span>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                    {scheduledLessonsCount}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {language === 'he' ? 'הושלמו בהצלחה' : 'Completed'}
                  </span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {completedLessonsCount}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {language === 'he' ? 'בוטלו / הוחזרו' : 'Cancelled / Refunded'}
                  </span>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                    {cancelledLessonsCount}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-300 block">
                    {language === 'he' ? 'דקות לימוד שהועברו' : 'Class Minutes Delivered'}
                  </span>
                  <p className="text-2xl font-black text-brand-teal-900 dark:text-brand-teal-200 mt-1">
                    {totalMinutesDelivered} min
                  </p>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={language === 'he' ? 'חיפוש לפי שם תלמיד, מורה או אימייל...' : 'Search by student name, teacher, or email...'}
                    value={lessonSearchTerm}
                    onChange={(e) => setLessonSearchTerm(e.target.value)}
                    className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal-800"
                  />
                  {lessonSearchTerm && (
                    <button
                      onClick={() => setLessonSearchTerm('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Duration Filter */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                    {[
                      { id: 'ALL', labelEn: 'All Durations', labelHe: 'כל האורכים' },
                      { id: '25', labelEn: '25 Min ($25)', labelHe: '25 דק׳ ($25)' },
                      { id: '40', labelEn: '40 Min ($40)', labelHe: '40 דק׳ ($40)' },
                      { id: '55', labelEn: '55 Min ($55)', labelHe: '55 דק׳ ($55)' },
                    ].map((df) => (
                      <button
                        key={df.id}
                        onClick={() => setLessonDurationFilter(df.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          lessonDurationFilter === df.id
                            ? 'bg-brand-teal-800 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        {language === 'he' ? df.labelHe : df.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                    {[
                      { id: 'ALL', labelEn: 'All Status', labelHe: 'כל הסטטוסים' },
                      { id: 'SCHEDULED', labelEn: 'Scheduled', labelHe: 'מתוזמן' },
                      { id: 'COMPLETED', labelEn: 'Completed', labelHe: 'הושלם' },
                      { id: 'CANCELLED', labelEn: 'Cancelled', labelHe: 'בוטל' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setLessonStatusFilter(st.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          lessonStatusFilter === st.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {language === 'he' ? st.labelHe : st.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modern Lessons Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700 text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'מועד השיעור (שעון ישראל)' : 'Israel Time & Date'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'משך ותעריף' : 'Duration & Rate'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3.5 px-4">{language === 'he' ? 'כיתת Zoom / הקלטה' : 'Classroom & Video'}</th>
                        <th className="py-3.5 px-4 text-right">{language === 'he' ? 'פעולות' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredLessons.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="font-bold">{language === 'he' ? 'לא נמצאו שיעורים התואמים את הסינון' : 'No scheduled lessons found matching your filters'}</p>
                          </td>
                        </tr>
                      ) : (
                        filteredLessons.map((l: any) => {
                          const dur = l.durationMinutes || 25;
                          const rate = sessionPricing?.[String(dur)] ?? (dur === 55 ? 55 : dur === 40 ? 40 : 25);
                          const isScheduled = l.status === 'SCHEDULED';
                          const isCompleted = l.status === 'COMPLETED';
                          const isCancelled = l.status === 'CANCELLED';

                          const scheduledDate = new Date(l.scheduledAt);
                          const isPast = scheduledDate.getTime() < Date.now();

                          return (
                            <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                              {/* Student Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal-700 to-brand-teal-900 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                    {l.student?.user?.firstName?.charAt(0) || 'S'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">
                                      {l.student?.user?.firstName} {l.student?.user?.lastName}
                                    </p>
                                    <span className="text-[10px] font-semibold text-brand-olive-700 dark:text-brand-olive-300 block truncate">
                                      {l.student?.level ? t(`levels.${l.student.level}`) : 'Beginner'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Teacher Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-brand-olive-100 dark:bg-brand-olive-950/70 text-brand-olive-900 dark:text-brand-olive-300 font-extrabold flex items-center justify-center text-xs shrink-0 border border-brand-olive-200 dark:border-brand-olive-800">
                                    {l.teacher?.user?.firstName?.charAt(0) || 'T'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                      {l.teacher?.user?.email}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Scheduled Time */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                                    <span>
                                      {formatIsraelDateTime(l.scheduledAt, {
                                        includeWeekday: true,
                                        locale: language === 'he' ? 'he-IL' : 'en-US',
                                      })}
                                    </span>
                                  </p>
                                  <span
                                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isCancelled
                                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                        : isPast
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    }`}
                                  >
                                    {isCancelled
                                      ? (language === 'he' ? 'בוטל' : 'Cancelled')
                                      : isPast
                                      ? (language === 'he' ? 'עבר' : 'Past Session')
                                      : (language === 'he' ? 'מפגש עתידי' : 'Upcoming Session')}
                                  </span>
                                </div>
                              </td>

                              {/* Duration & Price Badge */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2.5 py-1 rounded-full font-black text-xs inline-flex items-center gap-1 shadow-2xs ${
                                      dur === 55
                                        ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                        : dur === 40
                                        ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    }`}
                                  >
                                    <span>{dur} min</span>
                                    <span className="opacity-60">•</span>
                                    <span>${rate}</span>
                                  </span>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center gap-1.5 ${
                                    isScheduled
                                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                      : isCompleted
                                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  }`}
                                >
                                  {isScheduled && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                  {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                  {isCancelled && <XCircle className="w-3 h-3 text-rose-500" />}
                                  <span>{l.status}</span>
                                </span>
                              </td>

                              {/* Meeting & Recording Link */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  {l.zoomLink ? (
                                    <a
                                      href={l.zoomLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors border border-blue-200/80 dark:border-blue-800"
                                    >
                                      <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      <span>Launch Zoom</span>
                                      <ExternalLink className="w-3 h-3 opacity-70" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">No Zoom Link</span>
                                  )}

                                  {l.recordedSession?.driveLink && (
                                    <a
                                      href={l.recordedSession.driveLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:underline block"
                                    >
                                      <PlayCircle className="w-3 h-3" />
                                      <span>Watch Recording</span>
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Management Actions */}
                              <td className="py-3.5 px-4 text-right">
                                {isScheduled ? (
                                  <button
                                    onClick={() => {
                                      const confirmMsg =
                                        language === 'he'
                                          ? `האם לבטל שיעור זה? תעריף המפגש ($${rate}) יוחזר אוטומטית ליתרת התלמיד.`
                                          : `Cancel this scheduled lesson? The full session fee ($${rate}) will be refunded immediately to the student balance.`;
                                      if (window.confirm(confirmMsg)) {
                                        cancelLessonMutation.mutate({
                                          id: l.id,
                                          reason: 'Admin cancelled session via command center',
                                        });
                                      }
                                    }}
                                    disabled={cancelLessonMutation.isPending}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{language === 'he' ? 'ביטול והחזר' : 'Cancel & Refund'}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                                    {isCompleted ? 'Finished' : 'Archived'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SURVEYS & REVIEWS */}
          {activeTab === 'surveys' && (
            <ReviewsAndFeedbackTab />
          )}

          {/* TAB 8: SYSTEM OBSERVABILITY & ERROR TRACKING (PLATFORM OWNER ONLY) */}
          {activeTab === 'system_logs' && (
            <SystemLogsTab />
          )}

          {/* TAB 9: PRE-LESSON REMINDER ENGINE & NOTIFICATION HUB */}
          {activeTab === 'reminders_hub' && (
            <ReminderNotificationHubTab currentUserRole={currentUser?.role} />
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

      {/* COMPREHENSIVE USER ACCOUNTS & ROLES GOVERNANCE MODAL */}
      {isEditingUser && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-brand-olive-700 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {editFirstName?.[0] || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{editFirstName} {editLastName}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                      {editRole === 'SUPER_ADMIN' ? (language === 'he' ? 'בעלים ומנהל ראשי' : 'Platform Owner') : editRole === 'TEACHER' ? (language === 'he' ? 'מורה מוסמך' : 'Teacher') : editRole === 'STUDENT' ? (language === 'he' ? 'תלמיד' : 'Student') : editRole}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {language === 'he' ? 'מזהה משתמש:' : 'User ID:'} {selectedUserForEdit.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditingUser(false);
                  setSelectedUserForEdit(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Sections */}
            <div className="space-y-5 text-xs">
              {/* SECTION 1: Identity & Credentials */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
                  <span>{language === 'he' ? 'פרטי חשבון והרשאה' : 'Account Identity & Authority'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'שם פרטי' : 'First Name'}
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'שם משפחה' : 'Last Name'}
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'כתובת אימייל' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'העדפת שפה' : 'Language Preference'}
                    </label>
                    <select
                      value={editLanguagePref}
                      onChange={(e) => setEditLanguagePref(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="en">English (en)</option>
                      <option value="he">Hebrew / עברית (he)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'תפקיד במערכת' : 'System Role'}
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                    >
                      <option value="STUDENT">{language === 'he' ? 'תלמיד (לומד עברית)' : 'Student (Hebrew Learner)'}</option>
                      <option value="TEACHER">{language === 'he' ? 'מורה (מורה מוסמך)' : 'Teacher (Certified Native Instructor)'}</option>
                      <option value="ADMIN">{language === 'he' ? 'מנהל (מנהל צוות)' : 'Admin (Staff Administrator)'}</option>
                      <option value="SUPER_ADMIN">{language === 'he' ? 'בעלים ומנהל ראשי (שליטה מלאה)' : 'Platform Owner (Full Superadmin Governance)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'סטטוס החשבון' : 'Account Status'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditIsActive(true)}
                        className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                          editIsActive
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {language === 'he' ? 'פעיל' : 'Active'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditIsActive(false)}
                        className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                          !editIsActive
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {language === 'he' ? 'מושעה' : 'Suspended'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Role-Specific Configurations */}
              {editRole === 'STUDENT' && (
                <div className="space-y-3 p-4 rounded-2xl bg-brand-teal-50/50 dark:bg-brand-teal-950/30 border border-brand-teal-200/70 dark:border-brand-teal-900/60">
                  <h3 className="font-extrabold text-sm text-brand-teal-900 dark:text-brand-teal-200 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-300" />
                    <span>{language === 'he' ? 'פרופיל תלמיד ויתרה כספית' : 'Student Academic Profile & Balance'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'he' ? 'רמת עברית' : 'Hebrew Proficiency Level'}
                      </label>
                      <select
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="BEGINNER">Beginner (מתחילים - רמה א׳)</option>
                        <option value="ELEMENTARY">Elementary (בסיסי)</option>
                        <option value="INTERMEDIATE">Intermediate (בינוני - רמה ב׳)</option>
                        <option value="UPPER_INTERMEDIATE">Upper Intermediate (מתקדם קל)</option>
                        <option value="ADVANCED">Advanced (מתקדם - רמה ג׳)</option>
                        <option value="FLUENT">Fluent (שוטף)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'he' ? 'יתרת חשבון נוכחית' : 'Current Account Balance'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                          ${Number(selectedUserForEdit.studentProfile?.balance || 0).toFixed(2)} USD
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustStudent(selectedUserForEdit);
                            setAdjustAmount(50);
                            setAdjustMode('add');
                            setAdjustReason('Admin balance adjustment');
                            setIsAdjustingBalance(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{language === 'he' ? 'התאם יתרה' : 'Top Up / Adjust'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'סה״כ נקודות (XP)' : 'Total Points (XP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalPoints}
                      onChange={(e) => setEditTotalPoints(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'הערות מנהל פנימיות על התלמיד' : 'Private Admin Notes & Observations'}
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder={language === 'he' ? 'רשום הערות פדגוגיות או התאמות אישיות...' : 'Enter pedagogical or administrative notes...'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {editRole === 'TEACHER' && (
                <div className="space-y-3 p-4 rounded-2xl bg-brand-olive-50/50 dark:bg-brand-olive-950/30 border border-brand-olive-200/70 dark:border-brand-olive-900/60">
                  <h3 className="font-extrabold text-sm text-brand-olive-950 dark:text-brand-olive-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                    <span>{language === 'he' ? 'פרופיל מורה והתמחויות' : 'Instructor Profile & Teaching Specialties'}</span>
                  </h3>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'תחומי התמחות (מופרדים בפסיקים)' : 'Specialties (Comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={editSpecialties}
                      onChange={(e) => setEditSpecialties(e.target.value)}
                      placeholder="Modern Hebrew, Biblical Hebrew, Conversation, Grammar"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'תיאור ביוגרפי' : 'Instructor Bio'}
                    </label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Native Hebrew educator with 8+ years experience..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 3: Quick Security & Danger Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resetPasswordMutation.mutate(selectedUserForEdit.id)}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'איפוס סיסמה ל-LearnHebrew@2026' : 'Reset Password to Default'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(language === 'he' ? 'האם למחוק משתמש זה לצמיתות?' : 'Permanently delete this user account?')) {
                      deleteUserMutation.mutate(selectedUserForEdit.id);
                      setIsEditingUser(false);
                      setSelectedUserForEdit(null);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{language === 'he' ? 'מחק משתמש' : 'Delete Account'}</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsEditingUser(false);
                  setSelectedUserForEdit(null);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEditUser}
                disabled={updateUserMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-brand-olive-300" />
                <span>
                  {updateUserMutation.isPending
                    ? (language === 'he' ? 'שומר שינויים...' : 'Saving Changes...')
                    : (language === 'he' ? 'שמור שינויים בחשבון' : 'Save User Account')}
                </span>
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

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'קישור לפגישת זום' : 'Zoom Meeting Link'}
                </label>
                <input
                  type="url"
                  value={bookZoomLink}
                  onChange={(e) => setBookZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/1234567890"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1 font-mono text-xs"
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
                    zoomLink: bookZoomLink.trim() || undefined,
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
      {/* ADJUST STUDENT BALANCE MODAL */}
      {isAdjustingBalance && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {language === 'he' ? 'עדכון יתרת חשבון תלמיד' : 'Adjust Student Account Balance'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {adjustStudent
                      ? `${adjustStudent.firstName} ${adjustStudent.lastName} (${adjustStudent.email})`
                      : (language === 'he' ? 'בחר תלמיד לטעינת יתרה' : 'Select a student to credit balance')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdjustingBalance(false);
                  setAdjustStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Picker: Allows selecting or switching students freely */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                {language === 'he' ? 'בחר תלמיד' : 'Select Student to Credit'}
              </label>
              <select
                value={adjustStudent?.id || ''}
                onChange={(e) => {
                  const targetUser = studentsList.find((s: any) => s.id === e.target.value);
                  if (targetUser) setAdjustStudent(targetUser);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">{language === 'he' ? '-- בחר תלמיד --' : '-- Choose a student --'}</option>
                {studentsList.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.email}) — Balance: ${Number(s.studentProfile?.balance || 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {adjustStudent ? (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                      {language === 'he' ? 'יתרה נוכחית:' : 'Current Balance:'}
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(adjustStudent.studentProfile?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                      {language === 'he' ? 'יתרה משוערת לאחר עדכון:' : 'Projected Balance:'}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      ${(
                        adjustMode === 'add'
                          ? Number(adjustStudent.studentProfile?.balance || 0) + (Number(adjustAmount) || 0)
                          : Number(adjustAmount) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'אופן העדכון' : 'Adjustment Mode'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustMode('add')}
                        className={`py-2 rounded-xl font-extrabold text-xs border transition-all ${
                          adjustMode === 'add'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        + {language === 'he' ? 'הוסף ליתרה' : 'Add to Balance'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustMode('set')}
                        className={`py-2 rounded-xl font-extrabold text-xs border transition-all ${
                          adjustMode === 'set'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {language === 'he' ? 'קבע יתרה מדויקת' : 'Set Exact Balance'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        {language === 'he' ? 'סכום ($ USD)' : 'Amount ($ USD)'}
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        $25 = 1 Lesson (25 Min)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        { amt: 25, label: '+$25 (1x)' },
                        { amt: 50, label: '+$50 (2x)' },
                        { amt: 100, label: '+$100 (4x)' },
                        { amt: 150, label: '+$150' },
                        { amt: 250, label: '+$250' },
                      ].map(({ amt, label }) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAdjustAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            Number(adjustAmount) === amt
                              ? 'bg-brand-teal-800 text-white border-brand-teal-800 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm"
                      placeholder="50.00"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'סיבת העדכון / הערה' : 'Reason / Note'}
                    </label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Manual balance top-up by admin"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                {language === 'he'
                  ? 'אנא בחר תלמיד מהתפריט למעלה כדי להמשיך'
                  : 'Please select a student from the dropdown above to adjust their balance.'}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsAdjustingBalance(false);
                  setAdjustStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!adjustStudent) return;
                  adjustBalanceMutation.mutate({
                    studentId: adjustStudent.studentProfile?.id || adjustStudent.id,
                    amount: Number(adjustAmount),
                    mode: adjustMode,
                    reason: adjustReason,
                  });
                }}
                disabled={adjustBalanceMutation.isPending || !adjustAmount || !adjustStudent}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {adjustBalanceMutation.isPending
                    ? (language === 'he' ? 'מעדכן יתרה...' : 'Updating Balance...')
                    : (language === 'he' ? 'אישור עדכון יתרה' : 'Confirm Balance')}
                </span>
              </button>
            </div>
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

        <div className="relative rounded-full py-2 px-3 floating-capsule-shell grid grid-cols-5 items-center justify-around gap-1">
          <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/20 to-transparent pointer-events-none rounded-full" />

          {[
            { id: 'overview', label: language === 'he' ? 'מדדים' : 'Overview', icon: BarChart2, badge: null },
            { id: 'users', label: language === 'he' ? 'משתמשים' : 'Users', icon: Users, badge: usersData?.length ? String(usersData.length) : null },
            { id: 'bookings', label: language === 'he' ? 'שיעורים' : 'Bookings', icon: Calendar, badge: scheduledLessonsCount > 0 ? String(scheduledLessonsCount) : null },
            { id: 'packages', label: language === 'he' ? 'חבילות' : 'Packages', icon: Layers, badge: null },
            { id: 'more', label: language === 'he' ? 'עוד' : 'More', icon: Sliders, badge: null },
          ].map((item) => {
            const Icon = item.icon;
            const isHubSecondaryActive =
              activeTab === 'teachers' ||
              activeTab === 'landing_cms' ||
              activeTab === 'surveys' ||
              activeTab === 'reminders_hub' ||
              activeTab === 'system_logs';
            const isActive =
              (item.id === 'more' && (isMobileMoreOpen || isHubSecondaryActive)) ||
              (item.id !== 'more' && activeTab === item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptics.tap();
                  if (item.id === 'more') {
                    setIsMobileMoreOpen(true);
                  } else {
                    setActiveTab(item.id as any);
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`relative py-1.5 px-2 rounded-full flex flex-col items-center justify-center transition-all duration-300 group ${
                  isActive
                    ? 'floating-capsule-active active:scale-95'
                    : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 active:scale-95'
                }`}
              >
                {/* Notification Badge Dot */}
                {item.badge && (
                  <span className="absolute top-1 end-2 flex h-2 w-2 items-center justify-center pointer-events-none">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                  </span>
                )}

                <Icon
                  className={`w-6 h-6 shrink-0 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#0c4a60] dark:text-[#2dd4bf] stroke-[2.2] scale-105 drop-shadow-[0_1px_4px_rgba(12,74,96,0.25)]'
                      : 'text-slate-900 dark:text-slate-100 stroke-[1.8] group-hover:scale-105'
                  }`}
                />
                <span
                  className={`text-[11px] tracking-tight mt-0.5 leading-tight truncate max-w-full transition-colors ${
                    isActive
                      ? 'text-[#0c4a60] dark:text-[#2dd4bf] font-bold'
                      : 'text-slate-800 dark:text-slate-200 font-semibold group-hover:text-slate-950 dark:group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* iOS Liquid Glass Mobile "More" Sheet (Admin Tools) */}
      {isMobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-x border-slate-200/90 dark:border-slate-800/90 rounded-t-3xl p-5 pb-32 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  {language === 'he' ? 'כלי ניהול נוספים' : 'Platform Owner Tools'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'he' ? 'עמוד בית, מורים, משובים, תזכורות ובקרת מערכת' : 'CMS, teachers, surveys, reminders & system audit'}
                </p>
              </div>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Card 1: Landing Page CMS */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('landing_cms');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'landing_cms'
                    ? 'border-brand-teal-500 dark:border-cyan-400 ring-2 ring-brand-teal-500/20 dark:ring-cyan-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal-700 dark:text-teal-300 border border-brand-teal-200/60 dark:border-teal-800/40">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-teal-900/80 text-brand-teal-900 dark:text-teal-200 border border-brand-teal-300/60 dark:border-teal-700/50">
                    Live
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'ניהול עמוד הבית' : 'Landing Page CMS'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'עריכת טקסטים, באנרים ותכנים' : 'Headlines, banners & content'}
                  </p>
                </div>
              </button>

              {/* Card 2: Teachers & 25m Slots */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('teachers');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'teachers'
                    ? 'border-brand-olive-500 dark:border-lime-400 ring-2 ring-brand-olive-500/20 dark:ring-lime-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-brand-olive-50 dark:bg-brand-olive-950/60 text-brand-olive-700 dark:text-brand-olive-300 border border-brand-olive-200/60 dark:border-brand-olive-800/40">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-olive-100 dark:bg-brand-olive-950/70 text-brand-olive-900 dark:text-brand-olive-200 border border-brand-olive-300/70 dark:border-brand-olive-700/50">
                    {teachersData?.length || 0}
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'מורים ומשבצות' : 'Teachers & Slots'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'פרופיל מורים ומשבצות 25 דק׳' : 'Teacher rosters & slot capacity'}
                  </p>
                </div>
              </button>

              {/* Card 3: Surveys & Reviews */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('surveys');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'surveys'
                    ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 dark:ring-purple-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border border-purple-300/70 dark:border-purple-700/50">
                    {surveysData?.length || 0}
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'משובים וסקרים' : 'Surveys & Reviews'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'דירוגי שיעורים ומשוב מורים' : 'Student ratings & lesson reviews'}
                  </p>
                </div>
              </button>

              {/* Card 4: Reminder Engine & Hub */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reminders_hub');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'reminders_hub'
                    ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-700/50">
                    Live
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'מנוע תזכורות' : 'Reminder Engine'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'התראות וואטסאפ ואימייל' : 'WhatsApp & Email hub'}
                  </p>
                </div>
              </button>

              {/* Card 5: System Logs (SUPER_ADMIN) */}
              {currentUser?.role === 'SUPER_ADMIN' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('system_logs');
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`col-span-2 p-3.5 rounded-2xl text-start transition-all flex items-center justify-between gap-4 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                    activeTab === 'system_logs'
                      ? 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-500/20 dark:ring-rose-400/20'
                      : 'border-slate-200/90 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 shrink-0">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {language === 'he' ? 'יומן מערכת ובקרה' : 'System Logs & Audit'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === 'he' ? 'תיעוד שגיאות, אבטחה ופעילות שרת' : 'Error tracing, security & activity logs'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-rose-600 dark:bg-rose-500/20 text-white dark:text-rose-200 border border-rose-600 dark:border-rose-400/40 shrink-0">
                    Live
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
