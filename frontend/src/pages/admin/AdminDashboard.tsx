import React, { useState, useEffect, useMemo } from 'react';
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
import { PackagesManagementTab } from '../../components/admin/PackagesManagementTab';
import { EnterpriseTabsContainer } from '../../components/admin/EnterpriseTabsContainer';
import { LevelsTab } from '../../components/admin/LevelsTab';
import { SessionTypesTab } from '../../components/admin/SessionTypesTab';
import { RolesPermissionsTab } from '../../components/admin/RolesPermissionsTab';
import { PaymentsReviewTab } from '../../components/admin/PaymentsReviewTab';
import { LevelExamsTab } from '../../components/admin/LevelExamsTab';
import { ReviewLinksTab } from '../../components/admin/ReviewLinksTab';
import { PointRulesTab } from '../../components/admin/PointRulesTab';
import { LanguagesTab } from '../../components/admin/LanguagesTab';
import { PlatformSettingsNavModal } from '../../components/admin/PlatformSettingsNavModal';
import { confirmDialog } from '../../store/confirmDialogStore';
import { PageHeaderBanner } from '../../components/common/PageHeaderBanner';
import { sessionTypesApi, levelsApi } from '../../lib/enterpriseApi';
import { PriceDisplay } from '../../components/common/PriceDisplay';
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
  Package,
  Receipt,
  UserCheck,
  UserX,
  Link2,
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
  Minus,
  Tag,
  Edit2,
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
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'landing_cms'
    | 'enterprise'
    | 'levels'
    | 'session_types'
    | 'roles'
    | 'payments'
    | 'exams'
    | 'review_links'
    | 'point_rules'
    | 'languages'
    | 'reminders_hub'
    | 'users'
    | 'teachers'
    | 'packages'
    | 'bookings'
    | 'surveys'
    | 'system_logs'
  >(() => {
    const searchTab = new URLSearchParams(window.location.search).get('tab');
    if (
      searchTab &&
      [
        'overview',
        'landing_cms',
        'enterprise',
        'levels',
        'session_types',
        'roles',
        'payments',
        'exams',
        'review_links',
        'point_rules',
        'languages',
        'reminders_hub',
        'users',
        'teachers',
        'packages',
        'bookings',
        'surveys',
        'system_logs',
      ].includes(searchTab)
    ) {
      return searchTab as any;
    }
    return 'overview';
  });

  useEffect(() => {
    const handleNavEvent = (e: any) => {
      if (
        e.detail?.tab &&
        [
          'overview',
          'landing_cms',
          'enterprise',
          'levels',
          'session_types',
          'roles',
          'payments',
          'exams',
          'review_links',
          'point_rules',
          'languages',
          'reminders_hub',
          'users',
          'teachers',
          'packages',
          'bookings',
          'surveys',
          'system_logs',
        ].includes(e.detail.tab)
      ) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('engrew:navigate-tab', handleNavEvent);
    return () => window.removeEventListener('engrew:navigate-tab', handleNavEvent);
  }, []);

  useEffect(() => {
    const searchTab = new URLSearchParams(location.search).get('tab');
    if (
      searchTab &&
      [
        'overview',
        'landing_cms',
        'enterprise',
        'levels',
        'session_types',
        'roles',
        'payments',
        'exams',
        'review_links',
        'point_rules',
        'languages',
        'reminders_hub',
        'users',
        'teachers',
        'packages',
        'bookings',
        'surveys',
        'system_logs',
      ].includes(searchTab)
    ) {
      setActiveTab(searchTab as any);
    }
  }, [location.search]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isPlatformSettingsModalOpen, setIsPlatformSettingsModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('LearnHebrew@2026');
  const [newUserFirst, setNewUserFirst] = useState('');
  const [newUserLast, setNewUserLast] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [newUserLevelId, setNewUserLevelId] = useState('');

  // Modern Package Management State
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: '',
    nameHe: '',
    description: '',
    descriptionHe: '',
    price: 150,
    originalPrice: '' as string | number,
    onSale: false,
    isPopular: false,
    currency: 'USD',
    validityDays: 30,
    sessionItems: [] as Array<{ sessionTypeId: string; quantity: number }>,
  });

  const [isAssigningPkg, setIsAssigningPkg] = useState(false);
  const [assignPkgId, setAssignPkgId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');

  // Dynamic Session Types for Automatic Package Allocation
  const { data: sessionTypes = [] } = useQuery({
    queryKey: ['session-types'],
    queryFn: sessionTypesApi.list,
  });

  const handleOpenCreatePackage = () => {
    setEditingPkg(null);
    setPkgForm({
      name: '',
      nameHe: '',
      description: '',
      descriptionHe: '',
      price: 150,
      originalPrice: '',
      onSale: false,
      isPopular: false,
      currency: 'USD',
      validityDays: 30,
      sessionItems: sessionTypes.map((st) => ({
        sessionTypeId: st.id,
        quantity: st.durationMinutes === 25 ? 10 : 0,
      })),
    });
    setIsCreatingPackage(true);
  };

  const handleOpenEditPackage = (pkg: any) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name || pkg.nameEn || '',
      nameHe: pkg.nameHe || '',
      description: pkg.description || pkg.descriptionEn || '',
      descriptionHe: pkg.descriptionHe || '',
      price: Number(pkg.price ?? pkg.priceUsd ?? 0),
      originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : '',
      onSale: Boolean(pkg.onSale),
      isPopular: Boolean(pkg.isPopular),
      currency: pkg.currency || 'USD',
      validityDays: Math.min(Number(pkg.validityDays ?? pkg.durationDays ?? 30), 30),
      sessionItems: sessionTypes.map((st) => {
        const found = pkg.sessionItems?.find((si: any) => si.sessionTypeId === st.id);
        return {
          sessionTypeId: st.id,
          quantity: found
            ? Number(found.quantity)
            : (pkg.lessonsCount && st.durationMinutes === 25 ? Number(pkg.lessonsCount) : 0),
        };
      }),
    });
    setIsCreatingPackage(true);
  };

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
  const [editLevelId, setEditLevelId] = useState<string>('');
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

  // 6.5. Hebrew Proficiency Levels List
  const { data: levelsData = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const res = await levelsApi.list();
      return Array.isArray(res) ? res : ((res as any)?.levels || []);
    },
  });

  const safeLevels = useMemo(() => {
    return Array.isArray(levelsData) ? levelsData.filter((l: any) => l.isActive !== false) : [];
  }, [levelsData]);

  useEffect(() => {
    if (safeLevels.length > 0 && !newUserLevelId) {
      setNewUserLevelId(safeLevels[0].id);
    }
  }, [safeLevels, newUserLevelId]);

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

  const savePackageMutation = useMutation({
    mutationFn: async () => {
      const activeSessionItems = pkgForm.sessionItems.filter((si) => Number(si.quantity) > 0);
      const totalLessons = activeSessionItems.reduce((acc, curr) => acc + Number(curr.quantity), 0);
      const payload = {
        name: pkgForm.name.trim(),
        nameEn: pkgForm.name.trim(),
        nameHe: (pkgForm.nameHe || pkgForm.name).trim(),
        description: pkgForm.description?.trim() || undefined,
        descriptionEn: pkgForm.description?.trim() || undefined,
        descriptionHe: pkgForm.descriptionHe?.trim() || undefined,
        price: Number(pkgForm.price) || 0,
        originalPrice: pkgForm.originalPrice ? Number(pkgForm.originalPrice) : null,
        onSale: Boolean(pkgForm.onSale),
        isPopular: Boolean(pkgForm.isPopular),
        currency: pkgForm.currency || 'USD',
        validityDays: Math.min(Number(pkgForm.validityDays) || 30, 30),
        sessionItems: activeSessionItems.map((si) => ({
          sessionTypeId: si.sessionTypeId,
          quantity: Number(si.quantity),
        })),
        totalLessons,
      };

      if (editingPkg) {
        return api.patch(`/packages/${editingPkg.id}`, payload);
      } else {
        return api.post('/packages', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setIsCreatingPackage(false);
      setEditingPkg(null);
      toast.success(
        editingPkg
          ? (language === 'he' ? 'החבילה עודכנה בהצלחה!' : 'Package updated successfully!')
          : (language === 'he' ? 'החבילה נוצרה בהצלחה!' : 'Package created successfully!')
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || err.response?.data?.error || (language === 'he' ? 'שגיאה בשמירת החבילה' : 'Failed to save package')
      );
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['landingPackages'] });
      toast.success(language === 'he' ? 'החבילה נמחקה בהצלחה' : 'Package deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה במחיקת החבילה' : 'Failed to delete package'));
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      const refetched = await queryClient.fetchQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
          const res = await api.get('/users');
          return res.data.users;
        },
      });
      queryClient.invalidateQueries({ queryKey: ['packages'] });

      // Keep user edit modal in sync with the new package assignment
      if (selectedUserForEdit) {
        const updated = (refetched || []).find((u: any) => u.id === selectedUserForEdit.id);
        if (updated) {
          setSelectedUserForEdit(updated);
        }
      }

      setIsAssigningPkg(false);
      setAssignStudentId('');
      setAssignPkgId('');
      toast.success(
        language === 'he' ? 'החבילה הוקצתה לתלמיד בהצלחה!' : 'Package assigned successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || err.response?.data?.message || (language === 'he' ? 'שגיאה בהקצאת חבילה' : 'Failed to assign package')
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
          ? 'השיעור בוטל בהצלחה והמפגש הוחזר למכסת השיעורים של התלמיד.'
          : 'Lesson cancelled successfully and session returned to student package balance.'
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
    setEditLevelId(u.studentProfile?.levelId || u.studentProfile?.levelModel?.id || '');
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
          levelId: editLevelId || undefined,
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

  const totalActivePackageSessions = (usersData || [])
    .filter((u: any) => u.role === 'STUDENT' && u.studentProfile?.sessionBalances)
    .reduce((sum: number, u: any) => {
      const sbs = u.studentProfile?.sessionBalances || [];
      return sum + sbs.reduce((bSum: number, sb: any) => bSum + Number(sb.balance || 0), 0);
    }, 0);
  const activeStudentsCount = (usersData || []).filter((u: any) => u.role === 'STUDENT' && u.isActive !== false).length;
  const certifiedTeachersCount = (usersData || []).filter((u: any) => u.role === 'TEACHER').length;
  const platformOwnersCount = (usersData || []).filter((u: any) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length;
  const lowQuotaStudentsList = (usersData || [])
    .filter((u: any) => {
      if (u.role !== 'STUDENT' || !u.studentProfile) return false;
      const sbs = u.studentProfile?.sessionBalances || [];
      const totalSessions = sbs.reduce((bSum: number, sb: any) => bSum + Number(sb.balance || 0), 0);
      return totalSessions <= 1;
    });

  const handleOpenAssignPackage = (student?: any) => {
    if (student?.studentProfile?.id) {
      setAssignStudentId(student.studentProfile.id);
    } else if (studentsList.length > 0 && studentsList[0].studentProfile?.id) {
      setAssignStudentId(studentsList[0].studentProfile.id);
    }
    setIsAssigningPkg(true);
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
    {
      id: 'enterprise',
      label: 'Platform Settings',
      labelHe: 'הגדרות פלטפורמה',
      icon: Settings,
      badge: '8',
      badgeColor: 'bg-brand-teal-600 text-white',
      defaultExpanded: true,
      children: [
        {
          id: 'levels',
          label: 'Levels & Curriculum',
          labelHe: 'רמות לימוד ומסלולים',
          icon: Layers,
        },
        {
          id: 'session_types',
          label: 'Session Types (25/40/55m)',
          labelHe: 'סוגי מפגשים ותמחור',
          icon: Clock,
        },
        {
          id: 'roles',
          label: 'Roles & RBAC Matrix',
          labelHe: 'תפקידים והרשאות (RBAC)',
          icon: ShieldCheck,
        },
        {
          id: 'payments',
          label: 'Payments Review',
          labelHe: 'בדיקת תשלומי חבילות',
          icon: Receipt,
        },
        {
          id: 'exams',
          label: 'Level Transition Exams',
          labelHe: 'מבחני מעבר רמה',
          icon: Award,
        },
        {
          id: 'review_links',
          label: 'Secret Review Links',
          labelHe: 'קישורי משוב חד-פעמיים',
          icon: Link2,
        },
        {
          id: 'point_rules',
          label: 'Game Point Rules',
          labelHe: 'חוקי נקודות משחקים',
          icon: Coins,
        },
        {
          id: 'languages',
          label: 'Languages Setup',
          labelHe: 'ניהול שפות אם ויעד',
          icon: Globe,
        },
      ],
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
            setMobileOpen(false);
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
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
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
                        ? 'מדדי ביצוע בזמן אמת, מכסות שיעורים וחבילות פעילות, שיעורי 25 דקות, נתוני פעילות ופעולות מהירות למנהל המערכת.'
                        : 'Real-time pedagogical telemetry, student package sessions, 25-minute lesson utilization, activity reporting, and one-click administrator actions.'}
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
                        {language === 'he' ? 'פעולות ישירות בלחיצה אחת לניהול שוטף' : 'One-click shortcuts to assign packages, schedule lessons, and govern users'}
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    <span>{language === 'he' ? 'מרכז שליטה חי' : 'Live Command Hub'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Action 1: Assign Package */}
                  <button
                    onClick={() => handleOpenAssignPackage()}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/70 dark:border-emerald-800/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'הקצאת חבילה' : 'Assign Package'}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {language === 'he' ? '+ הקצה לתלמיד' : '+ Assign to Student'}
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

                  {/* Action 5: Role & Permission Action Matrix */}
                  <button
                    onClick={() => {
                      haptics.tap();
                      setActiveTab('roles');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group p-3.5 rounded-2xl bg-gradient-to-b from-sky-50/80 to-white dark:from-sky-950/20 dark:to-slate-900 border border-sky-200/70 dark:border-sky-800/50 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition-all text-start flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {language === 'he' ? 'הרשאות ותפקידים' : 'Roles & Access'}
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
                      ${(analytics?.kpis?.totalRevenue ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +{analytics?.kpis?.revenueGrowth ?? 0}%
                    </span>
                    <span className="text-slate-400">
                      {language === 'he'
                        ? `מתחילת החודש: $${(analytics?.kpis?.revenueMTD ?? 0).toLocaleString()}`
                        : `MTD: $${(analytics?.kpis?.revenueMTD ?? 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* KPI 2: Active Student Session Units */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {language === 'he' ? 'יתרות שיעורים פעילות' : 'Active Package Sessions'}
                      </span>
                      <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {totalActivePackageSessions || analytics?.kpis?.totalStudentSessions || 0}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'בכל החבילות' : 'Across All Packages'}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'he' ? 'מכסות בתוקף' : '30-Day Quotas'}
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
                      {analytics?.kpis?.totalLessons ?? totalLessonsCount ?? 0}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-brand-teal-700 dark:text-brand-teal-300">
                      {(() => {
                        const total = analytics?.kpis?.totalLessons || totalLessonsCount || 0;
                        const core25 = analytics?.durationBreakdown?.[25] ?? 0;
                        const pct = total > 0 ? Math.round((core25 / total) * 100) : 0;
                        return language === 'he' ? `ליבת 25 דק׳: ${pct}%` : `25m Core: ${pct}%`;
                      })()}
                    </span>
                    <span className="text-slate-400">
                      {language === 'he'
                        ? `${analytics?.kpis?.completedLessons ?? completedLessonsCount ?? 0} הושלמו`
                        : `${analytics?.kpis?.completedLessons ?? completedLessonsCount ?? 0} done`}
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
                      {analytics?.kpis?.lessonUtilization ?? 0}%
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {analytics?.kpis?.totalTimeSlots
                        ? (language === 'he' ? `${analytics.kpis.totalTimeSlots} משבצות זמינות` : `${analytics.kpis.totalTimeSlots} Active Slots`)
                        : (language === 'he' ? 'משבצות יומן' : 'Schedule Slots')}
                    </span>
                    <span className={`font-bold ${
                      (analytics?.kpis?.lessonUtilization ?? 0) >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : (analytics?.kpis?.lessonUtilization ?? 0) >= 30
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {(() => {
                        const u = analytics?.kpis?.lessonUtilization ?? 0;
                        if (u >= 75) return language === 'he' ? 'תפוסה גבוהה' : 'High Capacity';
                        if (u >= 40) return language === 'he' ? 'תפוסה מתונה' : 'Moderate Capacity';
                        if (u > 0) return language === 'he' ? 'תפוסה חלקית' : 'Available Capacity';
                        return language === 'he' ? 'זמינות מלאה' : 'Open Capacity';
                      })()}
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
                      {analytics?.kpis?.activeStudents ?? studentsList.length}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(() => {
                        const total = analytics?.kpis?.totalStudents ?? studentsList.length ?? 0;
                        const active = analytics?.kpis?.activeStudents ?? (total > 0 ? 1 : 0);
                        const rate = total > 0 ? Math.round((active / total) * 100) : 0;
                        return language === 'he' ? `${rate}% שימור` : `${rate}% Active`;
                      })()}
                    </span>
                    <span className="text-slate-400">
                      {analytics?.kpis?.totalHomework && analytics.kpis.totalHomework > 0
                        ? (language === 'he'
                            ? `ש״ב: ${analytics.kpis.homeworkCompletionRate}%`
                            : `HW: ${analytics.kpis.homeworkCompletionRate}%`)
                        : (language === 'he' ? 'אין ש״ב' : 'No HW')}
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
                      {analytics?.kpis?.avgSatisfaction ?? '4.92'} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {analytics?.kpis?.totalVerifiedReviews
                        ? (language === 'he' ? `${analytics.kpis.totalVerifiedReviews} משובים מאומתים` : `${analytics.kpis.totalVerifiedReviews} Verified Reviews`)
                        : (language === 'he' ? 'סקרים מאומתים' : 'Verified Reviews')}
                    </span>
                    <span className="text-slate-400">
                      {language === 'he'
                        ? `${analytics?.kpis?.totalTeachers ?? certifiedTeachersCount ?? 0} מורים`
                        : `${analytics?.kpis?.totalTeachers ?? certifiedTeachersCount ?? 0} Teachers`}
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
                            {language === 'he' ? 'תלמידים עם מכסת שיעורים נמוכה (≤ 1)' : 'Students with Low Session Quotas (≤ 1 remaining)'}
                          </h2>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'he'
                              ? 'למדו וסיימו את מכסת החבילה שלהם. לחץ להקצאת חבילה חדשה.'
                              : 'Session balance low or exhausted. One-click package assignment available.'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">
                        {lowQuotaStudentsList.length} {language === 'he' ? 'תלמידים' : 'Students'}
                      </span>
                    </div>

                    {lowQuotaStudentsList.length > 0 ? (
                      <div className="space-y-2.5">
                        {lowQuotaStudentsList.slice(0, 5).map((s: any) => {
                          const sbs = s.studentProfile?.sessionBalances || [];
                          const totalS = sbs.reduce((sum: number, sb: any) => sum + Number(sb.balance || 0), 0);
                          return (
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
                                    {language === 'he' ? 'שיעורים' : 'Sessions'}
                                  </span>
                                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                                    {totalS} {language === 'he' ? 'נותרו' : 'left'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleOpenAssignPackage(s)}
                                  className="px-3 py-1.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-black text-[11px] shadow-xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5 text-brand-olive-300" />
                                  <span>{language === 'he' ? 'הקצה חבילה' : 'Assign Pkg'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                        <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          {language === 'he' ? 'כל התלמידים עם מכסות שיעורים פעילות' : 'All Students Have Active Session Packages'}
                        </h4>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 max-w-sm mx-auto">
                          {language === 'he'
                            ? 'לכל התלמידים הפעילים יש שיעורים זמינים בחבילה לקביעת מפגשים חופשית.'
                            : 'Every active student has session credits available in their 30-day package.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'תוקף חבילות שיעורים:' : 'Package validity period:'} <strong className="text-slate-800 dark:text-slate-200">{language === 'he' ? 'עד 30 יום' : 'Up to 30 days'}</strong>
                    </span>
                    <button
                      onClick={() => handleOpenAssignPackage()}
                      className="font-bold text-brand-teal-700 dark:text-brand-teal-300 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'הקצה חבילה לתלמיד' : 'Assign Package to Student'}</span>
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
                          title: language === 'he' ? 'החזרת מכסה אוטומטית בביטול מופעלת' : 'Auto-Quota Restoral on Cancellation Enabled',
                          desc: language === 'he' ? 'תלמידים ומנהלים מקבלים החזרה מלאה ומיידית של מכסת השיעורים לחבילה הפעילה בעת ביטול שיעור מראש.' : 'Admins and students receive instant quota restoral back to their active session package when lessons are cancelled ahead of time.'
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

                    {(() => {
                      const count25 = analytics?.durationBreakdown?.[25] ?? 0;
                      const count40 = analytics?.durationBreakdown?.[40] ?? 0;
                      const count55 = analytics?.durationBreakdown?.[55] ?? 0;
                      const totalDur = count25 + count40 + count55;
                      const pct25 = totalDur > 0 ? Math.round((count25 / totalDur) * 100) : (count25 > 0 ? 100 : 0);
                      const pct40 = totalDur > 0 ? Math.round((count40 / totalDur) * 100) : 0;
                      const pct55 = totalDur > 0 ? Math.round((count55 / totalDur) * 100) : 0;

                      return (
                        <div className="space-y-4">
                          {/* 25-Min Format */}
                          <div>
                            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                              <span className="flex items-center gap-1.5 text-brand-teal-800 dark:text-brand-teal-300">
                                <Clock className="w-3.5 h-3.5" /> {language === 'he' ? 'בלוק מיקוד 25 דקות (ליבה)' : '25-Minute Focus Block (Core)'}
                              </span>
                              <span className="text-slate-900 dark:text-white font-black">
                                {count25} {language === 'he' ? `שיעורים (${pct25}%)` : `sessions (${pct25}%)`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-brand-teal-700 h-full rounded-full transition-all duration-300" style={{ width: `${pct25}%` }} />
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
                                {count40} {language === 'he' ? `שיעורים (${pct40}%)` : `sessions (${pct40}%)`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-brand-olive-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct40}%` }} />
                            </div>
                          </div>

                          {/* 55-Min Format */}
                          <div>
                            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                              <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                                <Clock className="w-3.5 h-3.5" /> {language === 'he' ? 'משבצת אינטנסיבית 55 דקות' : '55-Minute Intensive'}
                              </span>
                              <span className="text-slate-900 dark:text-white font-black">
                                {count55} {language === 'he' ? `שיעורים (${pct55}%)` : `sessions (${pct55}%)`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct55}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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

              {/* 6. Live Package Sessions & Quota Audit Trail */}
              {analytics?.recentBalanceTransactions && analytics.recentBalanceTransactions.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {language === 'he' ? 'יומן הקצאות ושימוש במכסות שיעורים' : 'Recent Package Allocations & Quota Activity'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {language === 'he' ? 'רישום חי של הקצאות חבילות, שימוש בשיעורים והחזרות מכסה' : 'Live audit trail of package assignments, session deductions, and quota restorals'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenAssignPackage()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'הקצה חבילה' : 'Assign Package'}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 text-start">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                          <th className="py-3 px-4 text-start">{language === 'he' ? 'סוג פעולה' : 'Type'}</th>
                          <th className="py-3 px-4 text-start">{language === 'he' ? 'סכום' : 'Amount'}</th>
                          <th className="py-3 px-4 text-start">{language === 'he' ? 'מכסה לאחר פעולה' : 'Quota After'}</th>
                          <th className="py-3 px-4 text-start">{language === 'he' ? 'תיאור / הערה' : 'Description / Note'}</th>
                          <th className="py-3 px-4 text-end">{language === 'he' ? 'תאריך' : 'Date'}</th>
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
                                {tx.amount >= 0 ? `+${Number(tx.amount)}` : `${Number(tx.amount)}`} {language === 'he' ? 'שיעורים' : 'units'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {Number(tx.balanceAfter)} {language === 'he' ? 'שיעורים' : 'units'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {tx.description || (language === 'he' ? 'עדכון מכסת חבילה' : 'Package session update')}
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
                  <table className="w-full text-start text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4 text-start">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3 px-4 text-start">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3 px-4 text-start">{language === 'he' ? 'תאריך ושעה (ישראל)' : 'Date & Time (Israel)'}</th>
                        <th className="py-3 px-4 text-start">{language === 'he' ? 'משך' : 'Duration'}</th>
                        <th className="py-3 px-4 text-start">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3 px-4 text-end">{language === 'he' ? 'פעולה מהירה' : 'Quick Action'}</th>
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
                          <td className="py-3.5 px-4 text-end">
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
              <PageHeaderBanner
                badgeIcon={Sliders}
                badgeText="Full Live Landing Page CMS"
                statusText="Live"
                title={language === 'he' ? 'ניהול תוכן עמוד הבית בזמן אמת' : 'Customize Any Content on the Landing Page'}
                description={
                  language === 'he'
                    ? 'שליטה ישירה בבאנרים, כותרות ראשיות, תגיות, כפתורי קריאה לפעולה וכרטיסי תוכן בעברית ובאנגלית.'
                    : 'Direct real-time control over banners, hero headlines, badges, call-to-actions, and feature cards in both English and Hebrew.'
                }
                action={
                  <div className="flex items-center gap-3">
                    {cmsSaveSuccess && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-400/30 animate-fade-in">
                        <Check className="w-4 h-4 text-emerald-400" /> Changes Published Live!
                      </span>
                    )}
                    <button
                      onClick={() => updateCmsMutation.mutate(cmsForm)}
                      disabled={updateCmsMutation.isPending || !cmsForm}
                      className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{updateCmsMutation.isPending ? 'Publishing...' : 'Save & Publish Live'}</span>
                    </button>
                  </div>
                }
              />

              {cmsForm && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column: Editor Forms */}
                  <div className="space-y-6">
                    {/* Announcement Banner */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                        {language === 'he' ? 'באנר הודעות עליון' : 'Top Announcement Banner'}
                      </h2>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {language === 'he' ? 'טקסט הודעה (אנגלית)' : 'Announcement Text (English)'}
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
                          {language === 'he' ? 'טקסט הודעה (עברית)' : 'Announcement Text (Hebrew / עברית)'}
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
                        {language === 'he' ? 'אזור פתיח ראשי (Hero)' : 'Hero Section'}
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            {language === 'he' ? 'תגית ראשית (אנגלית)' : 'Pill Badge (EN)'}
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
                            {language === 'he' ? 'תגית ראשית (עברית)' : 'Pill Badge (HE)'}
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
              <PageHeaderBanner
                badgeIcon={ShieldCheck}
                badgeText={language === 'he' ? 'ניהול משתמשים והרשאות' : 'Master User & Role Governance'}
                statusText={language === 'he' ? 'פעיל' : 'Active'}
                title={language === 'he' ? 'חשבונות משתמשים והרשאות מערכת' : 'User Accounts & Roles'}
                description={
                  language === 'he'
                    ? 'ניהול מלא של תלמידים, מורים מוסמכים והרשאות פלטפורמה, חבילות שיעורים, הגדרות רמה ואיפוס סיסמאות.'
                    : 'Comprehensive access control to inspect, edit, assign packages, configure Hebrew levels, and manage all accounts.'
                }
                action={
                  <button
                    onClick={() => setIsCreatingUser(true)}
                    className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{t('admin.createUserBtn')}</span>
                  </button>
                }
              />

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
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {activeStudentsCount}
                    </p>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      ({totalActivePackageSessions} {language === 'he' ? 'שיעורים בחבילות' : 'package sessions'})
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
                  <table className="w-full text-start text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700 text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'משתמש' : 'User'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'תפקיד' : 'Role'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'רמה / התמחות' : 'Hebrew Level / Specialty'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'חבילות ומפגשים' : 'Session Packages'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'הישגים ופעילות' : 'Gamification / Stats'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'שפה' : 'Lang'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3.5 px-4 text-end">{language === 'he' ? 'פעולות ניהול' : 'Actions'}</th>
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
                              <td className="py-3.5 px-4 text-start">
                                {isStudent ? (
                                  <bdi className="font-bold text-slate-700 dark:text-slate-300 inline-block">
                                    {u.studentProfile?.levelModel ? (
                                      language === 'he' ? u.studentProfile.levelModel.labelHe : u.studentProfile.levelModel.labelEn
                                    ) : u.studentProfile?.level ? (
                                      t(`levels.${u.studentProfile.level}`)
                                    ) : (
                                      language === 'he' ? 'רמה א׳' : 'Beginner'
                                    )}
                                  </bdi>
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

                              {/* Session Packages & Units */}
                              <td className="py-3.5 px-4 text-start">
                                {isStudent && u.studentProfile ? (
                                  <div className="flex flex-col gap-1">
                                    {(u.studentProfile?.sessionBalances || []).length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {u.studentProfile.sessionBalances.map((sb: any) => (
                                          <span
                                            key={sb.id}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                              sb.balance > 0
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                            }`}
                                          >
                                            {sb.balance}x {language === 'he' ? `${sb.sessionType?.durationMinutes || 25} דק׳` : (sb.sessionType?.name || `${sb.sessionType?.durationMinutes || 25}m`)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {language === 'he' ? 'אין חבילה פעילה' : 'No active package'}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => {
                                        setAssignStudentId(u.studentProfile.id);
                                        setIsAssigningPkg(true);
                                      }}
                                      className="text-[10px] text-brand-teal-700 dark:text-brand-teal-400 hover:underline font-bold text-start inline-flex items-center gap-1"
                                    >
                                      <span>+</span>
                                      <span>{language === 'he' ? 'הקצה חבילה' : 'Assign Package'}</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                                )}
                              </td>

                              {/* Gamification / Activity */}
                              <td className="py-3.5 px-4 text-start">
                                {isStudent && u.studentProfile ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-brand-teal-800 dark:text-brand-teal-300">
                                    <Award className="w-3.5 h-3.5 text-brand-olive-500 shrink-0" />
                                    <bdi>{language === 'he' ? `${u.studentProfile.totalPoints || 0} נק׳` : `${u.studentProfile.totalPoints || 0} pts`}</bdi>
                                  </span>
                                ) : isTeacher && u.teacherProfile ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                    <bdi>{u.teacherProfile.ratingAvg ? Number(u.teacherProfile.ratingAvg).toFixed(1) : '5.0'}</bdi>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic">—</span>
                                )}
                              </td>

                              {/* Language */}
                              <td className="py-3.5 px-4 text-start uppercase text-[11px] font-black text-slate-600 dark:text-slate-400">
                                {u.languagePref || 'en'}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4 text-start">
                                {u.isActive !== false ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    <span>{language === 'he' ? 'פעיל' : 'Active'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                    <span>{language === 'he' ? 'מושעה' : 'Suspended'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-end">
                                <div className="inline-flex items-center gap-1.5 justify-end">
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
                                    onClick={async () => {
                                      const confirmed = await confirmDialog({
                                        title: 'Delete User Account',
                                        titleHe: 'מחיקת חשבון משתמש',
                                        message: `Are you sure you want to permanently delete ${u.firstName} ${u.lastName} (${u.email})?`,
                                        messageHe: `האם למחוק לצמיתות את המשתמש ${u.firstName} ${u.lastName} (${u.email})?`,
                                        confirmText: 'Delete Account',
                                        confirmTextHe: 'מחק משתמש',
                                        variant: 'danger',
                                      });
                                      if (confirmed) {
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
              <PageHeaderBanner
                badgeIcon={GraduationCap}
                badgeText="25-Min Interval Engine Active"
                statusText="Active"
                title={language === 'he' ? 'מורים מוסמכים ויומן משבצות 25 דקות' : 'Certified Teachers & 25-Minute Slot Schedules'}
                description={
                  language === 'he'
                    ? 'כל מורה פותח משבצות זמן זמינות למשך עד 45 יום קדימה, והתלמידים קובעים שיעורים מתוך מכסת החבילה הפעילה שלהם.'
                    : 'Each teacher offers open availability blocks up to 45 days in advance. Students book sessions using their active package quotas.'
                }
              />

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
              <PageHeaderBanner
                badgeIcon={Layers}
                badgeText={language === 'he' ? 'חבילות שיעורים ומכסות' : 'Session Quotas & Packages'}
                statusText="Active"
                title={language === 'he' ? 'חבילות שיעורים ותוכניות לימוד' : 'Lesson Packages & Student Allocations'}
                description={
                  language === 'he'
                    ? 'חבילות לימוד ומסלולים מובנים להוראת עברית בהתאמה אישית, חלוקת מכסות שיעורים לפי משך, מבצעים ותוקף ל-30 יום.'
                    : 'Curriculum bundles and lesson packages for structured Hebrew learning paths with multi-duration session quotas and 30-day validity.'
                }
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsAssigningPkg(true)}
                      className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4 text-brand-olive-300" />
                      <span>{language === 'he' ? 'הקצה חבילה לתלמיד' : 'Assign to Student'}</span>
                    </button>
                    <button
                      onClick={handleOpenCreatePackage}
                      className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>{language === 'he' ? 'צור חבילה חדשה' : 'Create Package'}</span>
                    </button>
                  </div>
                }
              />

              {/* Modern Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(packagesData || []).map((pkg: any) => {
                  const items = pkg.sessionItems || [];
                  const sessionSummary = items.length > 0
                    ? items.map((si: any) => `${si.quantity}x ${si.sessionType?.name || (language === 'he' ? si.sessionType?.labelHe : si.sessionType?.labelEn) || `${si.sessionType?.durationMinutes || 25}m`}`).join(', ')
                    : `${pkg.totalLessons ?? pkg.lessonsCount ?? 0} ${language === 'he' ? 'שיעורים' : 'Lessons'}`;

                  return (
                    <div
                      key={pkg.id}
                      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${
                        pkg.isPopular
                          ? 'border-amber-400 dark:border-amber-500/80 ring-2 ring-amber-400/30 shadow-md'
                          : pkg.onSale
                          ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {/* Most Popular Badge */}
                      {pkg.isPopular && (
                        <div className="absolute top-0 start-0 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-ee-2xl shadow-sm flex items-center gap-1.5 z-10">
                          <Sparkles className="w-3 h-3 text-white fill-white shrink-0" />
                          <span>{language === 'he' ? 'הבחירה הפופולרית ביותר' : 'Most Popular Choice'}</span>
                        </div>
                      )}

                      {/* On Sale Badge */}
                      {pkg.onSale && (
                        <span className="absolute top-0 end-0 bg-gradient-to-l from-rose-600 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-es-2xl shadow-xs z-10">
                          {language === 'he' ? 'מבצע מיוחד' : 'Sale Offer'}
                        </span>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-300 text-xs font-black border border-brand-teal-100 dark:border-brand-teal-800/60">
                            <Clock className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                            <span>{sessionSummary}</span>
                          </span>

                          <PriceDisplay
                            price={pkg.price ?? pkg.priceUsd ?? 0}
                            originalPrice={pkg.originalPrice}
                            onSale={pkg.onSale}
                            currency={pkg.currency || 'USD'}
                            size="md"
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors">
                            {language === 'he' ? (pkg.nameHe || pkg.name) : (pkg.name || pkg.nameEn)}
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5" dir="rtl">
                            {pkg.nameHe}
                          </p>
                          {(pkg.description || pkg.descriptionEn) && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                              {language === 'he' && pkg.descriptionHe ? pkg.descriptionHe : (pkg.description || pkg.descriptionEn)}
                            </p>
                          )}
                        </div>

                        {/* Breakdown badge chips */}
                        {items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {items.map((si: any) => (
                              <span
                                key={si.id || si.sessionTypeId}
                                className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60"
                              >
                                {si.quantity} &times; {si.sessionType?.durationMinutes ?? 25} {language === 'he' ? 'דק׳' : 'min'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs">
                        <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            {language === 'he' ? `תוקף ל-${pkg.validityDays ?? pkg.durationDays ?? 30} יום` : `Valid ${pkg.validityDays ?? pkg.durationDays ?? 30} days`}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setAssignPkgId(pkg.id);
                              setIsAssigningPkg(true);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition-colors"
                            title={language === 'he' ? 'הקצה לתלמיד' : 'Assign to student'}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="p-2 rounded-xl text-slate-500 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition-colors"
                            title={language === 'he' ? 'ערוך חבילה' : 'Edit package'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Delete Package',
                                titleHe: 'מחיקת חבילת שיעורים',
                                message: `Are you sure you want to permanently delete package "${pkg.name}"? It will be removed from all catalogs and the landing page.`,
                                messageHe: `האם למחוק לצמיתות את חבילת השיעורים "${pkg.nameHe || pkg.name}"? היא תוסר מכל הקטלוגים ומדף הנחיתה.`,
                                confirmText: 'Delete Package',
                                confirmTextHe: 'מחק חבילה',
                                variant: 'danger',
                              });
                              if (confirmed) {
                                deletePackageMutation.mutate(pkg.id);
                              }
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={language === 'he' ? 'מחק חבילה' : 'Delete package'}
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5B: ENTERPRISE LEVELS, ROLES & PLATFORM HUB */}
          {(activeTab === 'enterprise' ||
            activeTab === 'levels' ||
            activeTab === 'session_types' ||
            activeTab === 'roles' ||
            activeTab === 'payments' ||
            activeTab === 'exams' ||
            activeTab === 'review_links' ||
            activeTab === 'point_rules' ||
            activeTab === 'languages') && (
            <EnterpriseTabsContainer
              currentTab={activeTab === 'enterprise' ? 'levels' : (activeTab as any)}
              onTabChange={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* TAB 6: BOOKINGS & LESSONS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <PageHeaderBanner
                badgeIcon={Calendar}
                badgeText={language === 'he' ? 'יומן שיעורים אינטראקטיבי' : 'Multi-Duration Live Session Command Center'}
                statusText="Live"
                title={language === 'he' ? 'כל השיעורים המתוזמנים (25 / 40 / 55 דק׳)' : 'All Scheduled Lessons (25 / 40 / 55 Min)'}
                description={
                  language === 'he'
                    ? 'ניהול, מעקב וביטול שיעורים עם החזרת מפגש אוטומטית למכסת החבילה של התלמיד. כל הזמנים מוצגים לפי שעון ישראל (פורמט 12 שעות AM/PM).'
                    : 'Live schedule monitoring, Zoom classroom links, and instant cancellations with automated session quota returns. All times formatted in Israel Time (12-Hour AM/PM).'
                }
                action={
                  <button
                    onClick={() => setIsBookingLesson(true)}
                    className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>{language === 'he' ? 'קביעת שיעור חי' : 'Book Live Session'}</span>
                  </button>
                }
              />

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
                  <table className="w-full text-start text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold uppercase border-b border-slate-200 dark:border-slate-700 text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'מועד השיעור (שעון ישראל)' : 'Israel Time & Date'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'משך ותעריף' : 'Duration & Rate'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3.5 px-4 text-start">{language === 'he' ? 'כיתת Zoom / הקלטה' : 'Classroom & Video'}</th>
                        <th className="py-3.5 px-4 text-end">{language === 'he' ? 'פעולות' : 'Actions'}</th>
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
                                    <span>{dur} {language === 'he' ? 'דק׳' : 'min'}</span>
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
                              <td className="py-3.5 px-4 text-end">
                                {isScheduled ? (
                                  <button
                                    onClick={async () => {
                                      const confirmed = await confirmDialog({
                                        title: 'Cancel Lesson & Refund Session',
                                        titleHe: 'ביטול שיעור והחזרת מפגש',
                                        message: `Cancel this scheduled lesson? The reserved session will be returned immediately to the student's package balance.`,
                                        messageHe: `האם לבטל שיעור זה? המפגש שהוזמן יוחזר באופן מיידי למכסת החבילה של התלמיד.`,
                                        confirmText: 'Cancel & Refund',
                                        confirmTextHe: 'ביטול והחזר מפגש',
                                        variant: 'danger',
                                      });
                                      if (confirmed) {
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

      {/* CREATE USER MODAL - MODERNIZED */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full my-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Executive Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white p-6 sm:p-7">
              <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-brand-olive-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-olive-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                      <ShieldCheck className="w-3 h-3 text-brand-olive-400" />
                      <span>{language === 'he' ? 'ניהול משתמשים והרשאות' : 'User Governance'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {language === 'he' ? 'יצירת חשבון משתמש חדש' : 'Create New User Account'}
                    </h2>
                    <p className="text-xs text-brand-teal-100/80 font-medium mt-0.5">
                      {language === 'he'
                        ? 'הגדרת פרטים אישיים, תפקיד במערכת ורמת עברית'
                        : 'Configure account credentials, system role, and Hebrew level'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'שם פרטי' : 'First Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David"
                    value={newUserFirst}
                    onChange={(e) => setNewUserFirst(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'שם משפחה' : 'Last Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cohen"
                    value={newUserLast}
                    onChange={(e) => setNewUserLast(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs"
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
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span>{language === 'he' ? 'סיסמה ראשונית' : 'Initial Password'} <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {language === 'he' ? 'המשתמש יוכל לשנותה בהתחברות' : 'User can change after login'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password123!"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'תפקיד במערכת' : 'System Role'}
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  >
                    <option value="STUDENT">{language === 'he' ? '🎓 תלמיד (Student)' : '🎓 Student (Hebrew Learner)'}</option>
                    <option value="TEACHER">{language === 'he' ? '👨‍🏫 מורה מוסמך (Teacher)' : '👨‍🏫 Teacher (Certified Instructor)'}</option>
                    <option value="ADMIN">{language === 'he' ? '🛡️ מנהל מערכת (Admin)' : '🛡️ Admin (System Administrator)'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'רמת עברית התחלתית' : 'Starting Hebrew Level'}
                  </label>
                  <select
                    value={newUserLevelId}
                    onChange={(e) => setNewUserLevelId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  >
                    {safeLevels.length === 0 ? (
                      <option value="">{language === 'he' ? '-- אין רמות מוגדרות --' : '-- No levels configured --'}</option>
                    ) : (
                      safeLevels.map((lvl: any) => (
                        <option key={lvl.id} value={lvl.id}>
                          {language === 'he' ? lvl.labelHe : lvl.labelEn} {lvl.code ? `(${lvl.code})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingUser(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
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
                    levelId: newUserLevelId,
                  });
                }}
                disabled={createUserMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>
                  {createUserMutation.isPending
                    ? (language === 'he' ? 'יוצר חשבון...' : 'Creating...')
                    : (language === 'he' ? 'צור חשבון חדש' : 'Create Account')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERN CREATE / EDIT PACKAGE MODAL */}
      {isCreatingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Executive Gradient Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white p-6 sm:p-7">
              <div className="absolute top-0 end-0 -mt-8 -me-8 w-48 h-48 bg-brand-olive-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-olive-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                      <Sparkles className="w-3 h-3 text-brand-olive-400" />
                      <span>{language === 'he' ? 'חבילות ומכסות שיעורים' : 'Session Quota Packages'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {editingPkg
                        ? (language === 'he' ? 'עריכת חבילת שיעורים ומכסות' : 'Edit Lesson Package & Quotas')
                        : (language === 'he' ? 'יצירת חבילת שיעורים חדשה' : 'Create New Lesson Package')}
                    </h2>
                    <p className="text-xs text-brand-teal-100/80 font-medium mt-0.5">
                      {language === 'he'
                        ? 'הגדרת מכסות שיעורים לפי משך, מחיר ותוקף ל-30 יום'
                        : 'Configure multi-duration session quotas, pricing, and 30-day validity'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPackage(false);
                    setEditingPkg(null);
                  }}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 1. Package Names (EN & HE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <span>🇬🇧</span>
                    <span>{language === 'he' ? 'שם החבילה באנגלית' : 'Package Name (English)'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Immersion Intensive Mastery"
                    value={pkgForm.name}
                    onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <span>🇮🇱</span>
                    <span>{language === 'he' ? 'שם החבילה בעברית' : 'Package Name (Hebrew / עברית)'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="לדוגמה: מסלול שליטה אינטנסיבי בעברית"
                    value={pkgForm.nameHe}
                    onChange={(e) => setPkgForm({ ...pkgForm, nameHe: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-hebrew"
                  />
                </div>
              </div>

              {/* 2. AUTOMATIC SESSION TYPES & DURATIONS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-brand-teal-50/40 dark:bg-brand-teal-950/20 border border-brand-teal-200/60 dark:border-brand-teal-800/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-brand-teal-900 dark:text-brand-teal-200">
                        {language === 'he' ? 'מכסות שיעורים לפי משך וסוג' : 'Session Types & Durations Quotas'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'he'
                          ? 'המכסות נטענות אוטומטית מסוגי השיעורים הפעילים במערכת'
                          : 'Automatically mapped to live system session types and durations'}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-850 text-brand-teal-800 dark:text-brand-teal-300 font-black text-xs border border-brand-teal-200 dark:border-brand-teal-800/80 shadow-xs self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {language === 'he'
                        ? `סה״כ: ${pkgForm.sessionItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} שיעורים בחבילה`
                        : `Total: ${pkgForm.sessionItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} Sessions in Package`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {sessionTypes.map((st) => {
                    const found = pkgForm.sessionItems.find((si) => si.sessionTypeId === st.id);
                    const qty = found ? Number(found.quantity) : 0;
                    const hasQuantity = qty > 0;

                    return (
                      <div
                        key={st.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          hasQuantity
                            ? 'border-brand-teal-400 dark:border-brand-teal-600 bg-white dark:bg-slate-855 shadow-xs ring-1 ring-brand-teal-400/30'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-300 font-mono font-black text-xs border border-brand-teal-200/60 dark:border-brand-teal-800/60">
                            {st.durationMinutes} {language === 'he' ? 'דק׳' : 'min'}
                          </span>
                          {hasQuantity && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                            {language === 'he' && st.labelHe ? st.labelHe : st.labelEn}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {language === 'he' ? st.labelEn : st.labelHe}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = Math.max(0, qty - 1);
                              const updated = pkgForm.sessionItems.some((si) => si.sessionTypeId === st.id)
                                ? pkgForm.sessionItems.map((si) => (si.sessionTypeId === st.id ? { ...si, quantity: nextVal } : si))
                                : [...pkgForm.sessionItems, { sessionTypeId: st.id, quantity: nextVal }];
                              setPkgForm({ ...pkgForm, sessionItems: updated });
                            }}
                            disabled={qty <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 font-bold flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => {
                                const nextVal = Math.max(0, parseInt(e.target.value, 10) || 0);
                                const updated = pkgForm.sessionItems.some((si) => si.sessionTypeId === st.id)
                                  ? pkgForm.sessionItems.map((si) => (si.sessionTypeId === st.id ? { ...si, quantity: nextVal } : si))
                                  : [...pkgForm.sessionItems, { sessionTypeId: st.id, quantity: nextVal }];
                                setPkgForm({ ...pkgForm, sessionItems: updated });
                              }}
                              className="w-14 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center text-slate-900 dark:text-white"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">
                              {language === 'he' ? 'שיעורים' : 'slots'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = qty + 1;
                              const updated = pkgForm.sessionItems.some((si) => si.sessionTypeId === st.id)
                                ? pkgForm.sessionItems.map((si) => (si.sessionTypeId === st.id ? { ...si, quantity: nextVal } : si))
                                : [...pkgForm.sessionItems, { sessionTypeId: st.id, quantity: nextVal }];
                              setPkgForm({ ...pkgForm, sessionItems: updated });
                            }}
                            className="w-7 h-7 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-800 dark:text-brand-teal-300 hover:bg-brand-teal-200 dark:hover:bg-brand-teal-900 font-bold flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Pricing & Promotional Sale */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-500 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {language === 'he' ? 'תמחור ומבצעים מיוחדים' : 'Pricing & Promotional Strike-Through'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'מחיר בפועל לתשלום' : 'Selling Price'}
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        {pkgForm.currency === 'ILS' ? '₪' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkgForm.price}
                        onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })}
                        className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-black text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'מחיר מקורי (מחוק במבצע)' : 'Original Struck Price'}
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        {pkgForm.currency === 'ILS' ? '₪' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 299"
                        value={pkgForm.originalPrice}
                        onChange={(e) => setPkgForm({ ...pkgForm, originalPrice: e.target.value })}
                        className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'he' ? 'מטבע תשלום' : 'Currency'}
                    </label>
                    <select
                      value={pkgForm.currency}
                      onChange={(e) => setPkgForm({ ...pkgForm, currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ILS">ILS (₪)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgForm.onSale}
                      onChange={(e) => setPkgForm({ ...pkgForm, onSale: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-start">
                      <span className="text-xs font-black text-rose-900 dark:text-rose-200 block">
                        {language === 'he' ? 'מבצע מיוחד (Sale Offer)' : 'Special Promotion (Sale)'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {language === 'he' ? 'מציג תגית מבצע ומחיר קודם מחוק' : 'Displays promo badge and struck-out price'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 cursor-pointer hover:bg-amber-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={pkgForm.isPopular}
                      onChange={(e) => setPkgForm({ ...pkgForm, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 accent-amber-600"
                    />
                    <div className="text-start">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-200 block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{language === 'he' ? 'הבחירה הפופולרית ביותר (Most Popular)' : 'Most Popular Choice'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {language === 'he' ? 'תגית זהב יוקרתית והדגשת החבילה' : 'Golden highlight badge & featured styling'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Validity & Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                    <span>{language === 'he' ? 'תוקף החבילה (ימים)' : 'Package Validity (Days)'}</span>
                    <span className="text-[10px] text-brand-teal-700 dark:text-brand-teal-300 font-semibold">
                      {language === 'he' ? 'תוקף מרבי 30 יום' : 'Max 30 days'}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={pkgForm.validityDays}
                    onChange={(e) => setPkgForm({ ...pkgForm, validityDays: Math.min(30, Number(e.target.value)) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'he' ? 'תיאור קצר (אנגלית)' : 'Short Description (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 focused lessons with native mentors."
                    value={pkgForm.description}
                    onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'he' ? 'תיאור קצר (עברית)' : 'Short Description (Hebrew)'}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="לדוגמה: 10 שיעורים פרטיים ממוקדים עם מורים שפת-אם."
                  value={pkgForm.descriptionHe}
                  onChange={(e) => setPkgForm({ ...pkgForm, descriptionHe: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-hebrew"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPackage(false);
                  setEditingPkg(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!pkgForm.name.trim()) {
                    toast.warning(language === 'he' ? 'שם החבילה באנגלית הוא שדה חובה' : 'Package name (English) is required');
                    return;
                  }
                  savePackageMutation.mutate();
                }}
                disabled={savePackageMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>
                  {savePackageMutation.isPending
                    ? (language === 'he' ? 'שומר חבילה...' : 'Saving Package...')
                    : editingPkg
                    ? (language === 'he' ? 'עדכן חבילה' : 'Update Package')
                    : (language === 'he' ? 'צור חבילה חדשה' : 'Create Package')}
                </span>
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
                    <span>{language === 'he' ? 'פרופיל אקדמי ומכסת שיעורים' : 'Student Academic Profile & Package Quota'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'he' ? 'רמת עברית (רמות שליטה)' : 'Hebrew Proficiency Level'}
                      </label>
                      <select
                        value={editLevelId}
                        onChange={(e) => setEditLevelId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="">{language === 'he' ? '-- בחר רמת שליטה --' : '-- Select Proficiency Level --'}</option>
                        {safeLevels.map((lvl: any) => (
                          <option key={lvl.id} value={lvl.id}>
                            {language === 'he' ? lvl.labelHe : lvl.labelEn} {lvl.code ? `(${lvl.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'he' ? 'חבילות ומפגשים זמינים' : 'Available Package Sessions'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-xs">
                          {(selectedUserForEdit.studentProfile?.sessionBalances || []).length > 0 ? (
                            selectedUserForEdit.studentProfile.sessionBalances
                              .map((sb: any) => `${sb.balance}x ${sb.sessionType?.name || `${sb.sessionType?.durationMinutes || 25}m`}`)
                              .join(' • ')
                          ) : (
                            <span className="text-slate-400">{language === 'he' ? 'אין חבילה פעילה' : 'No active package'}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedUserForEdit.studentProfile?.id) {
                              setAssignStudentId(selectedUserForEdit.studentProfile.id);
                              setIsAssigningPkg(true);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5 text-brand-olive-300" />
                          <span>{language === 'he' ? 'הקצה חבילה' : 'Assign Package'}</span>
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
                  onClick={async () => {
                    const confirmed = await confirmDialog({
                      title: 'Delete User Account',
                      titleHe: 'מחיקת חשבון משתמש לצמיתות',
                      message: `Are you sure you want to permanently delete this user account? All associated sessions, logs, and profile records will be affected.`,
                      messageHe: `האם למחוק משתמש זה לצמיתות? כל הנתונים, המפגשים והפרופיל של המשתמש יימחקו מהמערכת.`,
                      confirmText: 'Permanently Delete',
                      confirmTextHe: 'מחק לצמיתות',
                      variant: 'danger',
                    });
                    if (confirmed) {
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

      {/* ASSIGN PACKAGE MODAL - HIGH ELEVATION OVERLAY */}
      {isAssigningPkg && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center font-bold shadow-2xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {language === 'he' ? 'הקצאת חבילת שיעורים לתלמיד' : 'Assign Package to Student'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'he'
                      ? 'הקצאת מכסות שיעורים תקפות ל-30 יום ישירות לחשבון התלמיד'
                      : 'Credit 30-day session quotas directly to student account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssigningPkg(false);
                  setAssignPkgId('');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Student Preview or Selector */}
              {selectedUserForEdit && selectedUserForEdit.studentProfile?.id === assignStudentId ? (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'תלמיד מקבל ההקצאה' : 'Target Student'}
                  </label>
                  <div className="p-3.5 rounded-2xl bg-brand-teal-50/50 dark:bg-brand-teal-950/30 border border-brand-teal-200/70 dark:border-brand-teal-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal-700 to-brand-teal-900 text-white font-black flex items-center justify-center text-xs shadow-xs">
                        {selectedUserForEdit.firstName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-xs text-slate-900 dark:text-white">
                          {selectedUserForEdit.firstName} {selectedUserForEdit.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {selectedUserForEdit.email}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      {language === 'he' ? 'תלמיד נבחר' : 'Selected Student'}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {language === 'he' ? 'בחר תלמיד' : 'Select Student'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                  >
                    <option value="">-- {language === 'he' ? 'בחר תלמיד מהרשימה' : 'Choose a Student from List'} --</option>
                    {studentsList.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Package Selector */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'בחר חבילת שיעורים' : 'Select Lesson Package'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignPkgId}
                  onChange={(e) => setAssignPkgId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                >
                  <option value="">-- {language === 'he' ? 'בחר חבילה להקצאה' : 'Choose a Package to Assign'} --</option>
                  {(packagesData || []).map((p: any) => {
                    const items = p.sessionItems || [];
                    const summary = items.length > 0
                      ? items.map((si: any) => `${si.quantity}x ${si.sessionType?.durationMinutes ?? 25}m`).join(', ')
                      : `${p.totalLessons ?? p.lessonsCount ?? 0} lessons`;
                    return (
                      <option key={p.id} value={p.id}>
                        {language === 'he' ? (p.nameHe || p.name) : (p.name || p.nameEn)} — [{summary}] — ({p.currency === 'ILS' ? '₪' : '$'}{p.price ?? p.priceUsd ?? 0})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Package Details Card */}
              {(() => {
                const selectedPkg = (packagesData || []).find((p: any) => p.id === assignPkgId);
                if (!selectedPkg) return null;
                const items = selectedPkg.sessionItems || [];

                return (
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        {language === 'he' ? (selectedPkg.nameHe || selectedPkg.name) : (selectedPkg.name || selectedPkg.nameEn)}
                      </span>
                      <span className="font-black text-sm text-brand-teal-800 dark:text-brand-teal-400">
                        {selectedPkg.currency === 'ILS' ? '₪' : '$'}{selectedPkg.price ?? selectedPkg.priceUsd ?? 0}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {items.length > 0 ? (
                        items.map((si: any) => (
                          <span
                            key={si.id || si.sessionTypeId}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                          >
                            {si.quantity} &times; {si.sessionType?.durationMinutes ?? 25} {language === 'he' ? 'דק׳' : 'min'}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 font-bold">
                          {selectedPkg.totalLessons ?? selectedPkg.lessonsCount ?? 0} {language === 'he' ? 'שיעורים' : 'Lessons'}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{language === 'he' ? 'תוקף שיעורים:' : 'Validity:'} <strong>30 {language === 'he' ? 'יום' : 'days'}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{language === 'he' ? 'הקצאה מיידית' : 'Instant Activation'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsAssigningPkg(false);
                  setAssignPkgId('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
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
                disabled={assignPackageMutation.isPending || !assignPkgId || !assignStudentId}
                className="flex-1 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4 text-slate-950" />
                <span>
                  {assignPackageMutation.isPending
                    ? (language === 'he' ? 'מקצה חבילה...' : 'Assigning Package...')
                    : (language === 'he' ? 'אשר הקצאת חבילה' : 'Confirm Assignment')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE LESSON MODAL - MODERNIZED */}
      {isBookingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full my-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Executive Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white p-6 sm:p-7">
              <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-brand-olive-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-olive-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                      <Clock className="w-3 h-3 text-brand-olive-400" />
                      <span>{language === 'he' ? 'יומן שיעורים חי' : 'Live Classroom'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {language === 'he' ? 'תיאום שיעור חי' : 'Schedule Live Session'}
                    </h2>
                    <p className="text-xs text-brand-teal-100/80 font-medium mt-0.5">
                      {language === 'he'
                        ? 'קביעת שיעור אישי לפי שעון ישראל עם קישור זום'
                        : 'Schedule a 1-on-1 private lesson in Israel Time with Zoom'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBookingLesson(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-5 text-xs">
              {/* Duration Switcher */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {language === 'he' ? 'בחר משך שיעור' : 'Select Session Duration'}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[25, 40, 55].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBookDuration(d as 25 | 40 | 55)}
                      className={`p-3 rounded-2xl font-extrabold text-xs border transition-all text-center flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                        bookDuration === d
                          ? d === 55
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                            : d === 40
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-500/20'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm font-black">{d} {language === 'he' ? 'דק׳' : 'Min'}</span>
                      <span className="text-[10px] opacity-80 font-medium">
                        {d === 25 ? (language === 'he' ? 'רגיל' : 'Standard') : d === 40 ? (language === 'he' ? 'מורחב' : 'Extended') : (language === 'he' ? 'מלא' : 'Full')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Selection */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'תלמיד' : 'Student'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bookStudentId}
                  onChange={(e) => setBookStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                >
                  <option value="">-- {language === 'he' ? 'בחר תלמיד' : 'Choose Student'} --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'he' ? 'מורה מוסמך' : 'Assigned Teacher'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bookTeacherId}
                  onChange={(e) => setBookTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                >
                  <option value="">-- {language === 'he' ? 'בחר מורה' : 'Choose Teacher'} --</option>
                  {(teachersData || []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName} ({t.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span>{language === 'he' ? 'מועד השיעור' : 'Scheduled Date & Time'} <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-brand-teal-700 dark:text-brand-teal-300 font-bold bg-brand-teal-50 dark:bg-brand-teal-950/60 px-2 py-0.5 rounded-md border border-brand-teal-200/60 dark:border-brand-teal-800/60">
                    🇮🇱 {ISRAEL_TZ_LABEL}
                  </span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bookDateTime}
                  onChange={(e) => setBookDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                />
              </div>

              {/* Zoom Link */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  <span>{language === 'he' ? 'קישור לחדר זום' : 'Zoom Classroom Link'}</span>
                </label>
                <input
                  type="url"
                  value={bookZoomLink}
                  onChange={(e) => setBookZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/1234567890"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsBookingLesson(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
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
                className="px-6 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>
                  {bookLessonMutation.isPending
                    ? (language === 'he' ? 'מתאם שיעור...' : 'Scheduling...')
                    : (language === 'he' ? `אשר תיאום שיעור (${bookDuration} דק׳)` : `Confirm ${bookDuration}m Session`)}
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

        <div className="relative rounded-full py-2 px-2 floating-capsule-shell grid grid-cols-6 items-center justify-around gap-0.5 sm:gap-1">
          <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/20 to-transparent pointer-events-none rounded-full" />

          {[
            { id: 'overview', label: language === 'he' ? 'מדדים' : 'Overview', icon: BarChart2, badge: null },
            { id: 'users', label: language === 'he' ? 'משתמשים' : 'Users', icon: Users, badge: usersData?.length ? String(usersData.length) : null },
            { id: 'bookings', label: language === 'he' ? 'שיעורים' : 'Bookings', icon: Calendar, badge: scheduledLessonsCount > 0 ? String(scheduledLessonsCount) : null },
            { id: 'packages', label: language === 'he' ? 'חבילות' : 'Packages', icon: Layers, badge: null },
            { id: 'enterprise', label: language === 'he' ? 'הגדרות' : 'Settings', icon: Settings, badge: '8' },
            { id: 'more', label: language === 'he' ? 'עוד' : 'More', icon: Sliders, badge: null },
          ].map((item) => {
            const Icon = item.icon;
            const isEnterpriseActive =
              activeTab === 'enterprise' ||
              activeTab === 'levels' ||
              activeTab === 'session_types' ||
              activeTab === 'roles' ||
              activeTab === 'payments' ||
              activeTab === 'exams' ||
              activeTab === 'review_links' ||
              activeTab === 'point_rules' ||
              activeTab === 'languages';
            const isHubSecondaryActive =
              activeTab === 'teachers' ||
              activeTab === 'landing_cms' ||
              activeTab === 'surveys' ||
              activeTab === 'reminders_hub' ||
              activeTab === 'system_logs';
            const isActive =
              (item.id === 'more' && (isMobileMoreOpen || isHubSecondaryActive)) ||
              (item.id === 'enterprise' && isEnterpriseActive) ||
              (item.id !== 'more' && item.id !== 'enterprise' && activeTab === item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptics.tap();
                  if (item.id === 'more') {
                    setIsMobileMoreOpen(true);
                  } else if (item.id === 'enterprise') {
                    setIsPlatformSettingsModalOpen(true);
                    setIsMobileMoreOpen(false);
                  } else {
                    setActiveTab(item.id as any);
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`relative py-1.5 px-1 sm:px-2 rounded-full flex flex-col items-center justify-center transition-all duration-300 group ${
                  isActive
                    ? 'floating-capsule-active active:scale-95'
                    : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 active:scale-95'
                }`}
              >
                {/* Notification Badge Dot */}
                {item.badge && (
                  <span className="absolute top-1 end-1.5 flex h-2 w-2 items-center justify-center pointer-events-none">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                  </span>
                )}

                <Icon
                  className={`w-5 sm:w-6 h-5 sm:h-6 shrink-0 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#0c4a60] dark:text-[#2dd4bf] stroke-[2.2] scale-105 drop-shadow-[0_1px_4px_rgba(12,74,96,0.25)]'
                      : 'text-slate-900 dark:text-slate-100 stroke-[1.8] group-hover:scale-105'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 leading-tight truncate max-w-full transition-colors ${
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

              {/* Card 5: Platform Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsPlatformSettingsModalOpen(true);
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'enterprise' ||
                  activeTab === 'levels' ||
                  activeTab === 'session_types' ||
                  activeTab === 'roles' ||
                  activeTab === 'payments' ||
                  activeTab === 'exams' ||
                  activeTab === 'review_links' ||
                  activeTab === 'point_rules' ||
                  activeTab === 'languages'
                    ? 'border-brand-teal-600 dark:border-brand-teal-400 ring-2 ring-brand-teal-600/20 dark:ring-brand-teal-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800/40">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-brand-teal-950/70 text-brand-teal-900 dark:text-brand-teal-200 border border-brand-teal-300/70 dark:border-brand-teal-700/50">
                    8
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'הגדרות פלטפורמה' : 'Platform Settings'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'רמות, סוגי מפגש, הרשאות ותשלומים' : 'Levels, sessions, RBAC & rules'}
                  </p>
                </div>
              </button>

              {/* Card 6: System Logs (SUPER_ADMIN) */}
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

      {/* Platform Settings Mobile Navigation Window */}
      <PlatformSettingsNavModal
        isOpen={isPlatformSettingsModalOpen}
        onClose={() => setIsPlatformSettingsModalOpen(false)}
        currentTab={
          activeTab === 'levels' ||
          activeTab === 'session_types' ||
          activeTab === 'roles' ||
          activeTab === 'payments' ||
          activeTab === 'exams' ||
          activeTab === 'review_links' ||
          activeTab === 'point_rules' ||
          activeTab === 'languages'
            ? (activeTab as any)
            : 'levels'
        }
        onSelectTab={(subTab) => {
          setActiveTab(subTab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
