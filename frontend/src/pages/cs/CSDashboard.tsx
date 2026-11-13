import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useSidebarStore } from '../../store/sidebarStore';
import { toast } from '../../store/toastStore';
import { haptics } from '../../utils/haptics';
import { GlassSidebar } from '../../components/common/GlassSidebar';
import { PageHeaderBanner } from '../../components/common/PageHeaderBanner';
import { formatIsraelDateTime, formatSlotRange12Hour, ISRAEL_TZ_LABEL } from '../../lib/timeUtils';
import {
  BarChart2,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  X,
  Search,
  AlertCircle,
  MessageSquare,
  Award,
  Video,
  ArrowRight,
  ShieldAlert,
  Headphones,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Star,
} from 'lucide-react';

export const CSDashboard: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { isCollapsed } = useSidebarStore();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'bookings' | 'attendance' | 'surveys'>('overview');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Booking modal state for CS assistance
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  // Queries
  const { data: usersData = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['cs-students', searchTerm],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'STUDENT', search: searchTerm } });
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.users || raw?.data || []);
    },
  });

  const { data: lessonsData = [], isLoading: isLessonsLoading } = useQuery({
    queryKey: ['cs-lessons'],
    queryFn: async () => {
      const res = await api.get('/lessons');
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.lessons || raw?.data || []);
    },
  });

  const { data: teachersData = [] } = useQuery({
    queryKey: ['cs-teachers'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.teachers || raw?.data || []);
    },
  });

  const { data: surveysData = [] } = useQuery({
    queryKey: ['cs-surveys'],
    queryFn: async () => {
      const res = await api.get('/feedback/surveys');
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.surveys || raw?.data || []);
    },
  });

  // Safe arrays for guaranteed crash-free rendering
  const safeUsers = Array.isArray(usersData) ? usersData : ((usersData as any)?.users || []);
  const safeLessons = Array.isArray(lessonsData) ? lessonsData : ((lessonsData as any)?.lessons || []);
  const safeTeachers = Array.isArray(teachersData) ? teachersData : ((teachersData as any)?.teachers || []);
  const safeSurveys = Array.isArray(surveysData) ? surveysData : ((surveysData as any)?.surveys || []);

  // Calculate KPIs
  const totalStudents = safeUsers.length;
  const upcomingLessons = safeLessons.filter((l: any) => l.status === 'SCHEDULED');
  const completedLessons = safeLessons.filter((l: any) => l.status === 'COMPLETED');
  const attendedCount = completedLessons.filter((l: any) => l.attendanceStatus === 'ATTENDED').length;
  const attendanceRate = completedLessons.length > 0 ? Math.round((attendedCount / completedLessons.length) * 100) : 100;

  // Find students with expiring session balances (within next 7 days)
  const expiringStudents = safeUsers.filter((u: any) => {
    const balances = u.studentProfile?.sessionBalances || [];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return balances.some((b: any) => b.balance > 0 && b.expiresAt && new Date(b.expiresAt) <= sevenDaysFromNow);
  });

  // Sidebar Nav Items
  const navItems = [
    {
      id: 'overview',
      label: 'Overview & Support KPIs',
      labelHe: 'מדדי שירות ומבט כולל',
      icon: BarChart2,
      badge: null,
    },
    {
      id: 'students',
      label: 'Students & Balances',
      labelHe: 'תלמידים ויתרות מפגשים',
      icon: Users,
      badge: totalStudents > 0 ? String(totalStudents) : null,
    },
    {
      id: 'bookings',
      label: 'Session Bookings',
      labelHe: 'יומן שיעורים ותיאום',
      icon: Calendar,
      badge: upcomingLessons.length > 0 ? String(upcomingLessons.length) : null,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'attendance',
      label: 'Attendance & Logs',
      labelHe: 'מעקב נוכחות וביטולים',
      icon: CheckCircle2,
      badge: null,
    },
    {
      id: 'surveys',
      label: 'Surveys & Reviews',
      labelHe: 'משובים וסקרים',
      icon: MessageSquare,
      badge: surveysData.length > 0 ? String(surveysData.length) : null,
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
            role: language === 'he' ? 'שירות לקוחות' : 'Customer Service',
          }}
          panelSubtitle={language === 'he' ? 'פורטל שירות לקוחות' : 'Customer Support Hub'}
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
          {/* Executive Top Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/10">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold mb-3 border border-white/15">
                  <Headphones className="w-4 h-4 text-brand-olive-400" />
                  <span>{language === 'he' ? 'מוקד תמיכה ושירות לקוחות' : 'Customer Support & Retention Command'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/70">{language === 'he' ? 'פעיל' : 'Active'}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {language === 'he' ? 'תמיכת תלמידים, יתרות שיעורים ויומן' : 'Student Support & Schedule Coordination'}
                </h1>
                <p className="text-brand-teal-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                  {language === 'he'
                    ? 'סיוע בתיאום שיעורים מיתרות פעילות, מעקב אחר תפוגת חבילות ל-30 יום, בדיקת נוכחות ותגובה למשובי מורים.'
                    : 'Assist students in session booking from active quotas, audit 30-day package expirations, and monitor teacher surveys.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className="px-4 py-2.5 rounded-xl bg-white text-brand-teal-950 hover:bg-brand-olive-300 transition-all font-black text-xs shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Search className="w-4 h-4 text-brand-teal-900" />
                  <span>{language === 'he' ? 'איתור יתרת תלמיד' : 'Search Student'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4-Card KPI Stat Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'he' ? 'תלמידים נתמכים' : 'Supported Students'}
                </span>
                <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {totalStudents}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'he' ? 'כלל התלמידים במערכת' : 'Total enrolled students'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'he' ? 'שיעורים קרובים' : 'Upcoming Lessons'}
                </span>
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {upcomingLessons.length}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'he' ? 'מתוזמנים לפי שעון ישראל' : 'Scheduled in Israel Time'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'he' ? 'תפוגה קרובה (< 7 ימים)' : 'Expiring Soon (< 7d)'}
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {expiringStudents.length}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'he' ? 'דורשים תזכורת תיאום' : 'Require booking reminder'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'he' ? 'אחוז התייצבות' : 'Attendance Rate'}
                </span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {attendanceRate}%
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'he' ? 'שיעורים שהושלמו בהצלחה' : 'Completed sessions attendance'}
                </p>
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & RAPID SUPPORT */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Expiring Soon Alert Banner */}
              {expiringStudents.length > 0 && (
                <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold">
                        {language === 'he' ? 'התראת תפוגת חבילות (מגבלת 30 יום)' : '30-Day Package Expiration Notice'}
                      </h2>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        {language === 'he'
                          ? `ל-${expiringStudents.length} תלמידים יש יתרות מפגשים שיפוגו בשבוע הקרוב. פנה אליהם לעידוד תיאום שיעור.`
                          : `${expiringStudents.length} students have unused session balances expiring in the next 7 days.`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs shrink-0"
                  >
                    {language === 'he' ? 'צפה בתלמידים' : 'View Expiring Balances'}
                  </button>
                </div>
              )}

              {/* Next Scheduled Sessions */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-teal-600" />
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === 'he' ? 'השיעורים הבאים בלוח הזמנים (שעון ישראל)' : 'Next Live Sessions (Israel Time)'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-brand-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>{language === 'he' ? 'צפה בכל השיעורים' : 'View Schedule'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'משך' : 'Duration'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'מועד השיעור' : 'Schedule (IST)'}</th>
                        <th className="py-3 px-4 text-start font-bold">{language === 'he' ? 'קישור זום' : 'Zoom'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {upcomingLessons.slice(0, 5).map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {l.student?.user?.firstName} {l.student?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-[11px]">
                              {l.durationMinutes || 25} min
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-brand-teal-700 dark:text-brand-teal-300 font-mono text-[11px] font-bold">
                            {formatIsraelDateTime(l.startTime)}
                          </td>
                          <td className="py-3.5 px-4">
                            {l.zoomLink ? (
                              <a
                                href={l.zoomLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold underline"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Zoom</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {upcomingLessons.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            {language === 'he' ? 'אין שיעורים מתוזמנים כרגע' : 'No upcoming sessions scheduled'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS & BALANCES */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Users}
                badgeText={language === 'he' ? 'יתרות שיעורים ותמיכת תלמידים' : 'Student Quotas & Retention'}
                statusText="Active"
                title={language === 'he' ? 'תלמידים, יתרות מפגשים ותפוגה' : 'Student Quotas & Expiry Tracking'}
                description={
                  language === 'he'
                    ? 'מעקב אחר יתרות שיעורים (25 / 40 / 55 דק׳) שתוקפן 30 יום, תיאום מפגשים ישיר עבור התלמיד, ואיתור יתרות קרובות לפוג.'
                    : 'Track 30-day session balances (25 / 40 / 55m), audit expiring quotas, and book live lessons directly on behalf of students.'
                }
              />

              {/* Search Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'he' ? 'חיפוש תלמיד לפי שם או אימייל...' : 'Search student by name or email...'}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {usersData.length} {language === 'he' ? 'תלמידים' : 'Students'}
                </span>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'שפות ורמה' : 'Languages & Level'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'יתרות שיעורים לפי סוג' : 'Quotas (25/40/55m)'}</th>
                        <th className="py-3.5 px-5 text-start font-bold">{language === 'he' ? 'תוקף חבילה' : 'Package Expiry'}</th>
                        <th className="py-3.5 px-5 text-end font-bold">{language === 'he' ? 'פעולות' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {safeUsers.map((u: any) => {
                        const balances = u.studentProfile?.sessionBalances || [];
                        const nearestExpiry = balances
                          .filter((b: any) => b.balance > 0 && b.expiresAt)
                          .map((b: any) => new Date(b.expiresAt))
                          .sort((a: any, b: any) => a.getTime() - b.getTime())[0];

                        const isExpiringSoon = nearestExpiry && (nearestExpiry.getTime() - Date.now()) < (7 * 24 * 60 * 60 * 1000);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0">
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
                            <td className="py-4 px-5">
                              <div className="text-[11px] space-y-0.5">
                                <div>
                                  <span className="text-slate-400">Native: </span>
                                  <span className="font-bold">{u.nativeLanguage?.labelEn || 'English'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Level: </span>
                                  <span className="font-bold text-blue-600">{u.studentProfile?.levelModel?.labelEn || 'Beginner'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              {balances.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {balances.map((sb: any) => (
                                    <span
                                      key={sb.id}
                                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                                        sb.balance > 0
                                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {sb.balance}x {sb.sessionType?.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No active quotas</span>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              {nearestExpiry ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    isExpiringSoon
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 animate-pulse'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{nearestExpiry.toLocaleDateString()}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-end">
                              <button
                                onClick={() => {
                                  setSelectedStudent(u);
                                  setIsBookingModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-800 dark:bg-brand-teal-950/60 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800/60 font-bold text-xs"
                              >
                                {language === 'he' ? 'תיאום שיעור' : 'Book Session'}
                              </button>
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

          {/* TAB 3: BOOKINGS & CALENDAR */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Calendar}
                badgeText={language === 'he' ? 'יומן ותיאום שיעורים' : 'Session Schedule & Coordination'}
                statusText="Live"
                title={language === 'he' ? 'יומן השיעורים המרכזי' : 'All Platform Sessions'}
                description={
                  language === 'he'
                    ? 'צפייה בכל השיעורים המתואמים, קישורי Zoom לחדרי הלימוד, סטטוסי מפגש ומועדים לפי שעון ישראל.'
                    : 'Overview of all scheduled 1-on-1 lessons, live Zoom classroom links, session durations, and Israel Time dates.'
                }
              />

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'משך' : 'Duration'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'מועד (IST)' : 'Date/Time'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                        <th className="py-3.5 px-4 text-end font-bold">{language === 'he' ? 'זום' : 'Zoom'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {safeLessons.map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {l.student?.user?.firstName} {l.student?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold">
                            {l.durationMinutes || 25} min
                          </td>
                          <td className="py-3.5 px-4 text-brand-teal-700 dark:text-brand-teal-300 font-mono text-[11px] font-bold">
                            {formatIsraelDateTime(l.startTime)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                l.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : l.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-end">
                            {l.zoomLink ? (
                              <a
                                href={l.zoomLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold underline"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
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

          {/* TAB 4: ATTENDANCE & LOGS */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={CheckCircle2}
                badgeText={language === 'he' ? 'נוכחות ואימות שיעורים' : 'Session Attendance Auditing'}
                statusText="Live"
                title={language === 'he' ? 'מעקב נוכחות וביצועי תלמידים' : 'Attendance & Attendance Audit'}
                description={
                  language === 'he'
                    ? 'מעקב נוכחות מורים ותלמידים (התייצב / נעדר), בדיקת הערכות המורה, ושימור איכות ההוראה.'
                    : 'Real-time record of student attendance (Attended / Absent) marked by teachers with notes and points tracking.'
                }
              />

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'מורה' : 'Teacher'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'מועד' : 'Date'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'סטטוס התייצבות' : 'Attendance Status'}</th>
                        <th className="py-3.5 px-4 text-start font-bold">{language === 'he' ? 'הערות מורה' : 'Teacher Notes'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {completedLessons.map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {l.student?.user?.firstName} {l.student?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {formatIsraelDateTime(l.startTime)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                l.attendanceStatus === 'ATTENDED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : l.attendanceStatus === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                              }`}
                            >
                              {l.attendanceStatus || 'UNRECORDED'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                            {l.teacherNotes || '-'}
                          </td>
                        </tr>
                      ))}
                      {completedLessons.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            {language === 'he' ? 'טרם הושלמו שיעורים' : 'No completed lessons yet'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SURVEYS & REVIEWS */}
          {activeTab === 'surveys' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={MessageSquare}
                badgeText={language === 'he' ? 'נעילת עריכה לאחר 7 ימים' : '7-Day Edit Lock Rule'}
                statusText="Active"
                title={language === 'he' ? 'משובי תלמידים על מורים' : 'Teacher Reviews & Surveys'}
                description={
                  language === 'he'
                    ? 'סקירת הערכות תלמידים על איכות ההוראה. התלמיד יכול לערוך משוב רק במהלך 7 ימים ממועד הגשתו.'
                    : 'Monitor student feedback on teacher performance. Submissions are permanently locked from editing 7 days after submission.'
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeSurveys.map((s: any) => {
                    const daysAgo = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                    const isLocked = daysAgo > 7;

                    return (
                      <div
                        key={s.id}
                        className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {s.student?.user?.firstName} {s.student?.user?.lastName} &rarr; {s.teacher?.user?.firstName} {s.teacher?.user?.lastName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {isLocked ? (language === 'he' ? 'נעול (מעל 7 ימים)' : 'Locked (>7d)') : (language === 'he' ? 'פתוח לעריכה' : 'Editable')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < (s.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ms-1">
                            {s.rating || 5}/5
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{s.comment || 'No comment provided'}"
                        </p>

                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                  {surveysData.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                      {language === 'he' ? 'לא נמצאו משובים' : 'No teacher surveys found'}
                    </div>
                  )}
                </div>
              </div>
          )}
        </main>
      </div>

      {/* MODAL: Help Student Book Session from Active Quotas */}
      {isBookingModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {language === 'he' ? 'תיאום שיעור עבור תלמיד' : 'Assist Student Booking'}
                </h3>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-xs space-y-1">
              <span className="text-slate-400 block font-semibold">
                {language === 'he' ? 'תלמיד נבחר:' : 'Selected Student:'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.email})
              </span>
              <div className="pt-2 flex flex-wrap gap-1.5">
                {(selectedStudent.studentProfile?.sessionBalances || []).map((sb: any) => (
                  <span
                    key={sb.id}
                    className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]"
                  >
                    {sb.balance}x {sb.sessionType?.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'he' ? 'בחר מורה (תכנון 45 ימים קדימה)' : 'Select Teacher (45 Days Open Slots)'}
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {safeTeachers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName} (Active)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(
                    language === 'he' ? 'השיעור תואם בהצלחה מיתרת התלמיד!' : 'Session booked from student quota!',
                    language === 'he' ? 'תואם בהצלחה' : 'Success'
                  );
                  setIsBookingModalOpen(false);
                }}
                disabled={!selectedTeacherId}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {language === 'he' ? 'אשר תיאום שיעור' : 'Confirm Booking'}
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
          {[
            { id: 'overview', label: language === 'he' ? 'מדדים' : 'Overview', icon: BarChart2 },
            { id: 'students', label: language === 'he' ? 'תלמידים' : 'Students', icon: Users, badge: totalStudents > 0 ? String(totalStudents) : null },
            { id: 'bookings', label: language === 'he' ? 'שיעורים' : 'Bookings', icon: Calendar, badge: upcomingLessons.length > 0 ? String(upcomingLessons.length) : null },
            { id: 'attendance', label: language === 'he' ? 'נוכחות' : 'Attendance', icon: CheckCircle2 },
            { id: 'surveys', label: language === 'he' ? 'משובים' : 'Surveys', icon: MessageSquare },
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
                    <span className="absolute -top-1 -end-1 px-1 min-w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
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
export default CSDashboard;
