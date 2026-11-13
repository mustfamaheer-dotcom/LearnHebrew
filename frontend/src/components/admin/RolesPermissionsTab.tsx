import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { rolesApi } from '../../lib/enterpriseApi';
import { RoleDefinitionModel, PermissionModel } from '../../types';
import { toast } from '../../store/toastStore';
import { haptics } from '../../utils/haptics';
import {
  ShieldCheck,
  Plus,
  Check,
  Save,
  Lock,
  Search,
  Shield,
  Layers,
  Users,
  Calendar,
  CreditCard,
  Award,
  Gamepad2,
  BellRing,
  MessageSquare,
  Settings,
  X,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Eye,
  CheckCircle2,
  Sliders,
  HelpCircle,
  GraduationCap,
  Globe,
  Radio,
  FileCheck2,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

// Category icon helper
const getGroupIcon = (group: string) => {
  switch (group.toLowerCase()) {
    case 'users':
      return Users;
    case 'students':
      return GraduationCap;
    case 'teachers':
      return Users;
    case 'lessons':
      return Calendar;
    case 'packages':
      return Layers;
    case 'payments':
      return CreditCard;
    case 'curriculum':
      return Layers;
    case 'exams':
      return Award;
    case 'rewards':
      return Gamepad2;
    case 'games':
      return Gamepad2;
    case 'notifications':
      return BellRing;
    case 'reviews':
      return MessageSquare;
    case 'surveys':
      return FileCheck2;
    case 'roles':
      return ShieldCheck;
    case 'security':
      return Shield;
    case 'settings':
      return Settings;
    default:
      return Shield;
  }
};

// High-level Domain Group Filters
const DOMAIN_GROUPS = [
  { id: 'all', labelEn: 'All Actions', labelHe: 'כל הפעולות', groups: [] },
  { id: 'users', labelEn: 'Users & Academics', labelHe: 'משתמשים ותלמידים', groups: ['Users', 'Students', 'Teachers'] },
  { id: 'lessons', labelEn: 'Lessons & Calendar', labelHe: 'שיעורים ויומנים', groups: ['Lessons'] },
  { id: 'finance', labelEn: 'Finance & Bundles', labelHe: 'כספים וחבילות', groups: ['Packages', 'Payments'] },
  { id: 'academic', labelEn: 'Curriculum & Exams', labelHe: 'מסלולים ומבחנים', groups: ['Curriculum', 'Exams'] },
  { id: 'engagement', labelEn: 'Engagement & Alerts', labelHe: 'משובים והתראות', groups: ['Rewards', 'Reviews', 'Surveys', 'Notifications'] },
  { id: 'security', labelEn: 'Security & Matrix', labelHe: 'אבטחה ומערכת', groups: ['Security', 'Roles', 'Settings'] },
];

// Rich Bilingual Permission Catalog & Sensitivity Classification
interface PermissionMeta {
  titleEn: string;
  titleHe: string;
  descEn: string;
  descHe: string;
  risk?: 'high' | 'medium' | 'financial' | 'academic';
}

const PERMISSION_CATALOG: Record<string, PermissionMeta> = {
  // Users
  'users:view': {
    titleEn: 'View Users Directory',
    titleHe: 'צפייה במאגר המשתמשים',
    descEn: 'Access the list of all students, teachers, and staff members with contact info',
    descHe: 'גישה לרשימת כל התלמידים, המורים ואנשי הצוות ופרטי ההתקשרות',
  },
  'users:create': {
    titleEn: 'Create New Users',
    titleHe: 'יצירת משתמשים חדשים',
    descEn: 'Manually register new student, teacher, or administrative accounts',
    descHe: 'רישום והקמת חשבונות חדשים לתלמידים, מורים או צוות',
  },
  'users:edit': {
    titleEn: 'Edit User Profiles',
    titleHe: 'עריכת פרופילי משתמשים',
    descEn: 'Update user contact details, names, phone numbers, and active status',
    descHe: 'עדכון פרטי קשר, שמות, מספרי טלפון וסטטוס פעילות',
    risk: 'medium',
  },
  'users:delete': {
    titleEn: 'Deactivate / Delete Users',
    titleHe: 'השבתה או מחיקת משתמשים',
    descEn: 'Deactivate user accounts and revoke platform access immediately',
    descHe: 'השבתת חשבונות משתמשים ושלילת גישה לפלטפורמה לאלתר',
    risk: 'high',
  },
  'users:reset_password': {
    titleEn: 'Reset User Passwords',
    titleHe: 'איפוס סיסמאות משתמשים',
    descEn: 'Send password reset links or generate temporary credentials',
    descHe: 'שליחת קישורי איפוס סיסמה או יצירת סיסמה זמנית למשתמש',
    risk: 'medium',
  },
  'users:export_csv': {
    titleEn: 'Export Users to CSV',
    titleHe: 'ייצוא רשימת משתמשים ל-CSV',
    descEn: 'Download user data and contact spreadsheets for CRM/analytics',
    descHe: 'הורדת נתוני משתמשים וקובצי אקסל/CSV לניתוח ו-CRM',
  },

  // Students
  'students:view_balance': {
    titleEn: 'View Session Balances',
    titleHe: 'צפייה במכסות שיעורים',
    descEn: 'Check student 25m, 40m, and 55m remaining lesson allocations',
    descHe: 'בדיקת יתרת מפגשים (25, 40 ו-55 דק׳) של התלמידים',
  },
  'students:adjust_balance': {
    titleEn: 'Adjust Session Allowances',
    titleHe: 'עדכון ידני של מכסות שיעורים',
    descEn: 'Credit or debit lesson quotas and bonus points directly on student file',
    descHe: 'הוספה או גריעה ידנית של מכסות שיעורים ונקודות בונוס לתלמיד',
    risk: 'financial',
  },
  'students:set_level': {
    titleEn: 'Set Proficiency Level',
    titleHe: 'הגדרת רמת לימוד לתלמיד',
    descEn: 'Manually promote or assign student Hebrew CEFR academic tier',
    descHe: 'שינוי או קידום ידני של רמת השליטה של התלמיד בעברית',
    risk: 'academic',
  },
  'students:view_progress': {
    titleEn: 'View Learning Analytics',
    titleHe: 'צפייה בדוחות התקדמות',
    descEn: 'Inspect vocabulary retention, grammar notes, and exam history',
    descHe: 'בדיקת שימור אוצר מילים, הערות דקדוק והיסטוריית מבחנים',
  },
  'students:edit_notes': {
    titleEn: 'Edit Confidential Academic Notes',
    titleHe: 'עריכת הערות פדגוגיות פנימיות',
    descEn: 'Record administrative notes visible only to instructors and staff',
    descHe: 'רישום הערות פדגוגיות ואישיות לתלמיד לעיני הצוות בלבד',
  },

  // Teachers
  'teachers:view_all': {
    titleEn: 'View Teachers Directory',
    titleHe: 'צפייה ברשימת המורים',
    descEn: 'Browse all instructor profiles, bios, reviews, and hourly rates',
    descHe: 'עיון בכל פרופילי המורים, ביו, דירוגים ותעריפים',
  },
  'teachers:manage_slots': {
    titleEn: 'Manage Teacher Availability',
    titleHe: 'ניהול זמינות ויומני מורים',
    descEn: 'Open, close, or override 25-minute calendar booking slots for teachers',
    descHe: 'פתיחה, נעילה או עריכה של משבצות 25 דק׳ ביומן המורים',
  },
  'teachers:assign_students': {
    titleEn: 'Assign Dedicated Instructors',
    titleHe: 'הצמדת מורה אישי לתלמיד',
    descEn: 'Pair specific students with designated private teachers',
    descHe: 'שיוך תלמידים למורים פרטיים קבועים',
  },
  'teachers:view_payouts': {
    titleEn: 'View Teacher Compensation',
    titleHe: 'צפייה בתשלומי שכר מורים',
    descEn: 'Inspect completed lesson payouts and accrued instructor balances',
    descHe: 'מעקב אחר שעות הוראה שבוצעו וחישובי שכר מורים',
    risk: 'financial',
  },

  // Lessons
  'lessons:view_all': {
    titleEn: 'View Master Schedule',
    titleHe: 'צפייה בלוח השיעורים המרכזי',
    descEn: 'View all upcoming, live, and completed sessions across the academy',
    descHe: 'מעקב אחר כל השיעורים שנקבעו, שיעורים פעילים והיסטוריה',
  },
  'lessons:book': {
    titleEn: 'Book Lessons for Students',
    titleHe: 'קביעת שיעורים עבור תלמידים',
    descEn: 'Schedule private 1-on-1 lessons directly from teacher availability',
    descHe: 'שיבוץ שיעורים פרטיים ביומן מתוך משבצות הזמינות',
  },
  'lessons:cancel': {
    titleEn: 'Cancel Scheduled Lessons',
    titleHe: 'ביטול שיעורים מתוזמנים',
    descEn: 'Cancel upcoming lessons and automatically return credits to students',
    descHe: 'ביטול שיעור והחזרת המפגש באופן אוטומטי למכסת התלמיד',
    risk: 'medium',
  },
  'lessons:reschedule': {
    titleEn: 'Reschedule Lessons',
    titleHe: 'הזזת ושינוי מועדי שיעורים',
    descEn: 'Move existing booked lessons to new date/time slots without penalty',
    descHe: 'שינוי מועד שיעור קיים למשבצת זמן חדשה ללא גריעת מכסה',
  },
  'lessons:mark_attendance': {
    titleEn: 'Mark Lesson Attendance',
    titleHe: 'רישום נוכחות במפגש',
    descEn: 'Mark student as Attended, Late, or Absent and log lesson summary',
    descHe: 'סימון התייצבות (נוכח, איחור, היעדרות) וכתיבת סיכום שיעור',
  },
  'lessons:join_zoom': {
    titleEn: 'Host Zoom Classrooms',
    titleHe: 'כניסה כמארח לחדר Zoom',
    descEn: 'Access teacher & host controls for live Zoom video classrooms',
    descHe: 'גישה לקישורי מארח לכיתות וידאו אינטראקטיביות ב-Zoom',
  },
  'lessons:view_recordings': {
    titleEn: 'View Class Recordings',
    titleHe: 'צפייה בהקלטות וידאו של שיעורים',
    descEn: 'Access archived Google Drive cloud video recordings of completed classes',
    descHe: 'גישה להקלטות שיעורים שנשמרו בענן ב-Google Drive',
  },

  // Packages
  'packages:view': {
    titleEn: 'View Packages Catalog',
    titleHe: 'צפייה בקטלוג החבילות',
    descEn: 'Browse all learning packages, session quotas, and pricing',
    descHe: 'עיון בחבילות הלימוד, מכסות השיעורים והמחירים',
  },
  'packages:create': {
    titleEn: 'Create New Packages',
    titleHe: 'יצירת חבילות לימוד חדשות',
    descEn: 'Design new bundles with customized 25m, 40m, and 55m allocations',
    descHe: 'בניית חבילות חדשות עם הרכבי מפגשים ומחירים מותאמים',
    risk: 'financial',
  },
  'packages:edit': {
    titleEn: 'Edit Existing Packages',
    titleHe: 'עריכת חבילות קיימות',
    descEn: 'Change pricing, discounts, popularity badge, and descriptions',
    descHe: 'שינוי מחירי חבילות, הנחות, סימון כפופולרי ותיאורים',
    risk: 'financial',
  },
  'packages:delete': {
    titleEn: 'Delete Learning Packages',
    titleHe: 'מחיקת חבילות לימוד',
    descEn: 'Permanently remove or archive learning packages from the catalog',
    descHe: 'מחיקה לצמיתות או ארכוב של חבילות לימוד מהקטלוג',
    risk: 'high',
  },
  'packages:assign': {
    titleEn: 'Assign Packages to Students',
    titleHe: 'הקצאת חבילות ישירות לתלמידים',
    descEn: 'Manually allocate packages to student accounts without checkout',
    descHe: 'הקצאת חבילות שלמות לתלמידים ללא צורך במעבר בקופה',
    risk: 'financial',
  },

  // Payments
  'payments:view_all': {
    titleEn: 'View Transactions Ledger',
    titleHe: 'צפייה בכל העסקאות והתשלומים',
    descEn: 'Inspect all incoming bank transfers, receipts, and order statuses',
    descHe: 'מעקב אחר כל ההעברות הבנקאיות, אסמכתאות וסטטוס הזמנות',
  },
  'payments:create': {
    titleEn: 'Submit Proof of Payment',
    titleHe: 'העלאת אסמכתת תשלום',
    descEn: 'Upload payment receipt screenshots on behalf of students',
    descHe: 'העלאת צילום מסך של אסמכתת העברה בנקאית עבור תלמיד',
  },
  'payments:approve': {
    titleEn: 'Approve Payment Receipts',
    titleHe: 'אישור תשלומי חבילות',
    descEn: 'Verify receipts and instantly unlock lesson quotas for students',
    descHe: 'אימות אסמכתה והעברה מיידית של מכסת השיעורים לתלמיד',
    risk: 'financial',
  },
  'payments:reject': {
    titleEn: 'Reject Invalid Payments',
    titleHe: 'דחיית אסמכתאות לא תקינות',
    descEn: 'Decline invalid or duplicate payment submissions with reason',
    descHe: 'דחיית העברות שגויות או כפולות עם ציון סיבה לתלמיד',
    risk: 'financial',
  },
  'payments:refund': {
    titleEn: 'Process Refunds',
    titleHe: 'ביצוע החזרים כספיים',
    descEn: 'Cancel paid orders and rollback credited session quotas',
    descHe: 'ביטול עסקאות בתשלום ומשיכת יתרות שיעורים שהוענקו',
    risk: 'high',
  },
  'payments:export_receipts': {
    titleEn: 'Export Financial Reports',
    titleHe: 'ייצוא דוחות כספיים וחשבוניות',
    descEn: 'Export revenue breakdown, tax records, and receipt summaries to CSV',
    descHe: 'הורדת דוחות הכנסות, מס וסיכומי קבלות לקובצי CSV',
  },

  // Curriculum
  'levels:view': {
    titleEn: 'View Levels & Curriculum',
    titleHe: 'צפייה ברמות ומסלולי לימוד',
    descEn: 'Inspect Hebrew proficiency tiers, CEFR standards, and syllabi',
    descHe: 'עיון ברמות השליטה בעברית (CEFR), סילבוסים ותכנים',
  },
  'levels:create': {
    titleEn: 'Create Proficiency Levels',
    titleHe: 'יצירת רמות לימוד חדשות',
    descEn: 'Add new academic tiers and define progression criteria',
    descHe: 'הוספת רמות לימוד חדשות והגדרת יעדי שליטה אקדמיים',
    risk: 'academic',
  },
  'levels:edit': {
    titleEn: 'Edit Curriculum Milestones',
    titleHe: 'עריכת סילבוס ומסלולים',
    descEn: 'Update competencies, vocabulary count targets, and descriptions',
    descHe: 'עדכון דרישות רמה, מטרות אוצר מילים ותיאורים',
    risk: 'academic',
  },
  'levels:delete': {
    titleEn: 'Delete Curriculum Levels',
    titleHe: 'מחיקת רמות לימוד',
    descEn: 'Remove deprecated proficiency levels from curriculum framework',
    descHe: 'מחיקה או ביטול של רמות לימוד מהמערך הפדגוגי',
    risk: 'high',
  },

  // Exams
  'exams:view': {
    titleEn: 'View Assessment Exams',
    titleHe: 'צפייה במבחני מעבר רמה',
    descEn: 'Inspect exam blueprints, question pools, and student test results',
    descHe: 'צפייה במבחני רמה, מאגרי שאלות ותוצאות נבחנים',
  },
  'exams:create': {
    titleEn: 'Author Progression Exams',
    titleHe: 'חיבור ועריכת מבחני רמה',
    descEn: 'Create assessment tests and import questions via CSV spreadsheets',
    descHe: 'יצירת מבחני הערכה ויבוא שאלות ותשובות מקובצי CSV',
    risk: 'academic',
  },
  'exams:open_for_student': {
    titleEn: 'Authorize Exam Attempts',
    titleHe: 'פתיחת מבחן מעבר לתלמיד',
    descEn: 'Unlock single progression exam attempt for an eligible student',
    descHe: 'אישור ופתיחת ניסיון מבחן לתלמיד שהשלים את דרישות הרמה',
  },
  'exams:reset_attempt': {
    titleEn: 'Reset Exam Submissions',
    titleHe: 'איפוס ניסיון מבחן לתלמיד',
    descEn: 'Clear previous failed attempt to permit an authorized retake',
    descHe: 'איפוס תוצאות מבחן קודם לאפשר ניגש חוזר',
  },
  'exams:grade_manually': {
    titleEn: 'Grade Open-Ended Questions',
    titleHe: 'בדיקה ידנית של מבחנים',
    descEn: 'Score written essay questions and attach teacher remarks',
    descHe: 'הזנת ציונים ידניים לשאלות פתוחות ומתן משוב מילולי',
    risk: 'academic',
  },

  // Rewards
  'games:view': {
    titleEn: 'View Practice Games',
    titleHe: 'צפייה במשחקי תרגול',
    descEn: 'Browse vocabulary memory drills and interactive grammar exercises',
    descHe: 'עיון במשחקי זיכרון, התאמת מילים ותרגולי דקדוק',
  },
  'games:create': {
    titleEn: 'Create Gamified Drills',
    titleHe: 'בניית משחקי לימוד חדשים',
    descEn: 'Design vocabulary pairs and interactive practice modules',
    descHe: 'יצירת זוגות מילים ותרגילים אינטראקטיביים חדשים',
  },
  'games:unlock_for_student': {
    titleEn: 'Unlock Practice Games',
    titleHe: 'פתיחת משחקים לתלמיד',
    descEn: 'Manually grant game access to students regardless of lesson status',
    descHe: 'מתן גישה ידנית למשחק תרגול ללא תלות בסיום שיעור',
  },
  'points:manage_rules': {
    titleEn: 'Configure Point Multipliers',
    titleHe: 'ניהול חוקי ניקוד ובונוסים',
    descEn: 'Set point values for booking sessions, attendance streaks, and homework',
    descHe: 'הגדרת כמויות נקודות לשיעורים, רצף נוכחות והשלמת משימות',
  },
  'points:manual_award': {
    titleEn: 'Award Bonus Points',
    titleHe: 'הענקת נקודות בונוס ידנית',
    descEn: 'Credit loyalty points, achievement badges, and awards to students',
    descHe: 'הוספת נקודות ותגי הישג מיוחדים לתלמידים מצטיינים',
  },

  // Reviews
  'reviews:manage_links': {
    titleEn: 'Generate Review Links',
    titleHe: 'הפקת קישורי משוב חד-פעמיים',
    descEn: 'Create secure, time-limited rating links for students',
    descHe: 'יצירת קישורים מאובטחים לדירוג המורה לאחר השיעור',
  },
  'reviews:publish': {
    titleEn: 'Publish Testimonials',
    titleHe: 'אישור ביקורות לדף הבית',
    descEn: 'Approve student reviews for public marketing showcase',
    descHe: 'אישור חוות דעת של תלמידים להצגה בדף הבית הציבורי',
  },
  'reviews:delete': {
    titleEn: 'Moderate / Delete Reviews',
    titleHe: 'מחיקת או עריכת ביקורות',
    descEn: 'Remove offensive, inaccurate, or inappropriate student reviews',
    descHe: 'הסרת חוות דעת לא הולמות או פוגעניות',
    risk: 'medium',
  },

  // Surveys
  'surveys:create': {
    titleEn: 'Create Student Surveys',
    titleHe: 'יצירת סקרי שביעות רצון',
    descEn: 'Design Net Promoter Score (NPS) and satisfaction questionnaires',
    descHe: 'בנייה והפצה של סקרי NPS ושביעות רצון מתלמידים',
  },
  'surveys:view_analytics': {
    titleEn: 'View Survey Analytics',
    titleHe: 'צפייה בניתוחי סקרים',
    descEn: 'Inspect satisfaction ratings, NPS benchmarks, and student feedback',
    descHe: 'ניתוח מגמות שביעות רצון, מדדי NPS ותובנות תלמידים',
  },

  // Notifications
  'notifications:send_manual': {
    titleEn: 'Broadcast Announcements',
    titleHe: 'שליחת הודעות והתראות מערכת',
    descEn: 'Send urgent push notices, in-app banners, and SMS to users',
    descHe: 'שידור הודעות דחופות, התראות פוש ובאנרים למשתמשים',
    risk: 'medium',
  },
  'reminders:trigger_engine': {
    titleEn: 'Trigger Reminder Engine',
    titleHe: 'הפעלת מנוע תזכורות לשיעורים',
    descEn: 'Execute automated lesson reminder checks (WhatsApp/SMS/Email)',
    descHe: 'הפעלה יזומה של שליחת תזכורות WhatsApp/SMS/Email לשיעורים קרובים',
  },

  // Security
  'roles:manage': {
    titleEn: 'Manage Roles & RBAC Matrix',
    titleHe: 'ניהול מטריצת תפקידים והרשאות',
    descEn: 'Configure permission assignments and define custom system roles',
    descHe: 'שינוי הרשאות לכל התפקידים ויצירת תפקידים מותאמים חדשים',
    risk: 'high',
  },
  'settings:manage': {
    titleEn: 'Manage Academy Platform Settings',
    titleHe: 'ניהול הגדרות ליבה של האקדמיה',
    descEn: 'Configure global platform configurations, session durations, and branding',
    descHe: 'שליטה בהגדרות מערכת גלובליות, משכי שיעורים ומיתוג',
    risk: 'high',
  },
  'audit:view_logs': {
    titleEn: 'View Security Audit Logs',
    titleHe: 'צפייה ביומני אבטחה וביקורת',
    descEn: 'Inspect immutable administrative activity trails and security events',
    descHe: 'מעקב אחר פעולות מנהלים ואירועי אבטחה ביומן מאובטח',
  },
  'languages:manage': {
    titleEn: 'Manage Languages & Localizations',
    titleHe: 'ניהול שפות ותרגומים',
    descEn: 'Activate platform languages and edit translation dictionaries',
    descHe: 'הפעלה וכיבוי של שפות ממשק ועריכת מחרוזות תרגום',
  },
};

export const RolesPermissionsTab: React.FC = () => {
  const { language } = useTranslation();
  const isHe = language === 'he';
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDomainFilter, setActiveDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'granted' | 'denied' | 'high_impact'>('all');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', labelEn: '', labelHe: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['roles-matrix'],
    queryFn: rolesApi.getMatrix,
  });

  const roles = data?.roles || [];
  const permissions: PermissionModel[] = data?.permissions || [];

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  useEffect(() => {
    if (activeRole && !selectedRoleId) {
      setSelectedRoleId(activeRole.id);
      setSelectedPermIds(
        activeRole.permissions.filter((p) => p.granted).map((p) => p.permission.id)
      );
    }
  }, [data, activeRole, selectedRoleId]);

  const handleSelectRole = (r: RoleDefinitionModel) => {
    haptics.tap();
    setSelectedRoleId(r.id);
    setSelectedPermIds(r.permissions.filter((p) => p.granted).map((p) => p.permission.id));
  };

  const updatePermissionsMutation = useMutation({
    mutationFn: () => rolesApi.updatePermissions(selectedRoleId!, selectedPermIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-matrix'] });
      toast.success(isHe ? 'הרשאות התפקיד נשמרו בהצלחה' : 'Role permissions updated successfully');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (isHe ? 'שגיאה בעדכון הרשאות' : 'Failed to update permissions')),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.createRole({ ...newRoleForm, permissionIds: selectedPermIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-matrix'] });
      toast.success(isHe ? 'תפקיד חדש נוצר בהצלחה' : 'Custom role created');
      setIsCreatingRole(false);
      setNewRoleForm({ name: '', labelEn: '', labelHe: '' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (isHe ? 'שגיאה ביצירת תפקיד' : 'Failed to create role')),
  });

  // Track Unsaved Changes
  const savedPermIds = useMemo(() => {
    if (!activeRole) return [];
    return activeRole.permissions.filter((p) => p.granted).map((p) => p.permission.id);
  }, [activeRole]);

  const hasUnsavedChanges = useMemo(() => {
    if (savedPermIds.length !== selectedPermIds.length) return true;
    const set = new Set(savedPermIds);
    return selectedPermIds.some((id) => !set.has(id));
  }, [savedPermIds, selectedPermIds]);

  const handleResetChanges = () => {
    haptics.tap();
    setSelectedPermIds(savedPermIds);
  };

  const handleGrantAll = () => {
    haptics.tap();
    setSelectedPermIds(permissions.map((p) => p.id));
  };

  const handleRevokeAll = () => {
    haptics.tap();
    setSelectedPermIds([]);
  };

  const handlePresetReadOnly = () => {
    haptics.tap();
    const readOnlyIds = permissions
      .filter((p) => p.code.endsWith(':view') || p.code.includes(':view_') || p.code.includes(':inspect'))
      .map((p) => p.id);
    setSelectedPermIds(readOnlyIds);
    toast.info(isHe ? 'הופעל פרופיל צפייה בלבד' : 'Applied Read-Only permission preset');
  };

  const togglePermission = (permId: string) => {
    haptics.tap();
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleToggleGroup = (groupPerms: PermissionModel[]) => {
    haptics.tap();
    const groupIds = groupPerms.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermIds.includes(id));

    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      // Domain filter
      if (activeDomainFilter !== 'all') {
        const domain = DOMAIN_GROUPS.find((d) => d.id === activeDomainFilter);
        if (domain && !domain.groups.map((g) => g.toLowerCase()).includes(p.group.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      const isGranted = selectedPermIds.includes(p.id);
      const meta = PERMISSION_CATALOG[p.code];
      const isHighImpact = meta?.risk === 'high' || meta?.risk === 'financial';

      if (statusFilter === 'granted' && !isGranted) return false;
      if (statusFilter === 'denied' && isGranted) return false;
      if (statusFilter === 'high_impact' && !isHighImpact) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = p.code.toLowerCase().includes(term);
        const matchesGroup = p.group.toLowerCase().includes(term);
        const matchesDesc = p.description?.toLowerCase().includes(term);
        const matchesTitleEn = meta?.titleEn.toLowerCase().includes(term);
        const matchesTitleHe = meta?.titleHe.toLowerCase().includes(term);
        const matchesDescHe = meta?.descHe.toLowerCase().includes(term);

        if (
          !matchesCode &&
          !matchesGroup &&
          !matchesDesc &&
          !matchesTitleEn &&
          !matchesTitleHe &&
          !matchesDescHe
        ) {
          return false;
        }
      }

      return true;
    });
  }, [permissions, activeDomainFilter, statusFilter, searchTerm, selectedPermIds]);

  // Group permissions by category
  const groupedPermissions: Record<string, PermissionModel[]> = useMemo(() => {
    const groups: Record<string, PermissionModel[]> = {};
    filteredPermissions.forEach((p) => {
      if (!groups[p.group]) {
        groups[p.group] = [];
      }
      groups[p.group].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  const grantedPercentage = permissions.length > 0
    ? Math.round((selectedPermIds.length / permissions.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20">
      <PageHeaderBanner
        badgeIcon={ShieldCheck}
        badgeText={isHe ? 'בקרת גישה ארגונית מלאה' : 'Enterprise RBAC Governance'}
        statusText={isHe ? 'פעיל' : 'Active'}
        title={isHe ? 'מטריצת תפקידים והרשאות מערכת' : 'Role & Permission Action Matrix'}
        description={
          isHe
            ? 'שליטה ברזולוציה הגבוהה ביותר בכל פעולה בפלטפורמה: משתמשים, שיעורים, זמני מורים, כספים, חבילות, מבחנים, משחקים ואבטחה.'
            : 'Granular security control over every action: user administration, scheduling, financial audits, exam authoring, gamification, and platform configurations.'
        }
        action={
          <button
            onClick={() => setIsCreatingRole(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{isHe ? 'צור תפקיד מותאם אישית' : 'Create Custom Role'}</span>
          </button>
        }
      />

      {/* CREATE ROLE MODAL */}
      {isCreatingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {isHe ? 'הגדרת תפקיד חדש' : 'Define New Platform Role'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isHe ? 'התפקיד יקבל את מערך ההרשאות המסומן' : 'Role will inherit current selected actions'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingRole(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isHe ? 'מזהה מפתח תפקיד (באנגלית ואותיות גדולות)' : 'Role Key Identifier (UPPERCASE)'}
                </label>
                <input
                  type="text"
                  placeholder="ACADEMIC_DIRECTOR"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isHe ? 'שם תפקיד באנגלית' : 'English Label'}
                </label>
                <input
                  type="text"
                  placeholder="Academic Director"
                  value={newRoleForm.labelEn}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, labelEn: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {isHe ? 'שם תפקיד בעברית' : 'Hebrew Label'}
                </label>
                <input
                  type="text"
                  placeholder="מנהל פדגוגי ואקדמי"
                  value={newRoleForm.labelHe}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, labelHe: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingRole(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                {isHe ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => createRoleMutation.mutate()}
                disabled={!newRoleForm.name || !newRoleForm.labelEn || createRoleMutation.isPending}
                className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
              >
                {createRoleMutation.isPending ? (isHe ? 'יוצר...' : 'Creating...') : (isHe ? 'צור תפקיד' : 'Create Role')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Roles List Sidebar (4 Columns) - Sticky with Internal Scroll */}
        <div className="space-y-3 lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-thin pe-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isHe ? 'תפקידי פלטפורמה' : 'Platform Roles'}
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {roles.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {roles.map((r) => {
              const isActive = (selectedRoleId || activeRole?.id) === r.id;
              const grantedCount = r.permissions.filter((p) => p.granted).length;
              const percent = permissions.length > 0 ? Math.round((grantedCount / permissions.length) * 100) : 0;

              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-start p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group active:scale-[0.99] ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white border-brand-teal-500/50 shadow-xl ring-2 ring-brand-teal-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-teal-300 hover:bg-slate-50/80 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm truncate">
                          {isHe && r.labelHe ? r.labelHe : r.labelEn}
                        </span>
                        {r.isSystem && (
                          <span
                            className={`p-1 rounded-md shrink-0 ${
                              isActive
                                ? 'bg-white/10 text-brand-olive-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                            title={isHe ? 'תפקיד מערכת מובנה' : 'System protected role'}
                          >
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 truncate ${
                          isActive ? 'text-brand-olive-300' : 'text-slate-400'
                        }`}
                      >
                        {r.name}
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isActive ? 'text-brand-teal-200 font-semibold' : 'text-slate-500'}>
                        {isHe ? `${grantedCount} מתוך ${permissions.length} פעולות` : `${grantedCount} / ${permissions.length} actions`}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          grantedCount > 0 ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="w-full h-1.5 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isActive ? 'bg-gradient-to-r from-brand-olive-400 to-emerald-400' : 'bg-brand-teal-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Configuration Workspace (8 Columns) - Fixed/Sticky with Internal Scrolling */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:sticky lg:top-24 h-[85vh] lg:h-[calc(100vh-7rem)]">
          {/* Executive Role Header & Stats (Stationary Compact Header) */}
          <div className="py-2.5 sm:py-3 px-4 sm:px-5 bg-gradient-to-r from-slate-900 via-slate-900 to-brand-teal-950 text-white border-b border-slate-800 relative overflow-hidden shrink-0">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: Role Info & Badges */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white truncate">
                      {isHe && activeRole?.labelHe ? activeRole.labelHe : activeRole?.labelEn}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-brand-olive-300">
                      {activeRole?.name}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                        <Radio className="w-2.5 h-2.5" />
                        <span>{isHe ? 'לא נשמר' : 'Unsaved'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-brand-teal-100/70 truncate">
                    {isHe ? 'בחר פעולות מורשות עבור התפקיד' : 'Manage Granted Actions for this Role'}
                  </p>
                </div>
              </div>

              {/* Right: Presets, Stats & Save Button in One Unified Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Compact Coverage Indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-xs">
                  <span className="text-[10px] font-bold text-brand-teal-200">
                    {selectedPermIds.length}/{permissions.length}
                  </span>
                  <span className="text-xs font-black text-brand-olive-300">
                    {grantedPercentage}%
                  </span>
                </div>

                {/* Compact Presets */}
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={handleGrantAll}
                    title={isHe ? 'בחר הכל (מלא)' : 'Grant All'}
                    className="px-2 py-1 rounded-lg hover:bg-white/15 text-[11px] font-bold text-white transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{isHe ? 'הכל' : 'All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetReadOnly}
                    title={isHe ? 'פרופיל צפייה בלבד' : 'Read-Only Preset'}
                    className="px-2 py-1 rounded-lg hover:bg-white/15 text-[11px] font-bold text-white transition flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-sky-400" />
                    <span>{isHe ? 'צפייה' : 'Read-Only'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeAll}
                    title={isHe ? 'בטל הכל' : 'Revoke All'}
                    className="px-2 py-1 rounded-lg hover:bg-white/15 text-[11px] font-bold text-rose-300 transition flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>{isHe ? 'אפס' : 'Revoke'}</span>
                  </button>
                  {hasUnsavedChanges && (
                    <button
                      type="button"
                      onClick={handleResetChanges}
                      title={isHe ? 'שחזר למצב שמור' : 'Reset to Saved'}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-bold text-amber-300 transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Compact Save Button */}
                <button
                  type="button"
                  onClick={() => updatePermissionsMutation.mutate()}
                  disabled={updatePermissionsMutation.isPending || !hasUnsavedChanges}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 ${
                    hasUnsavedChanges
                      ? 'bg-brand-olive-400 hover:bg-brand-olive-300 text-slate-950 shadow-brand-olive-500/20 ring-1 ring-brand-olive-400/50'
                      : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {updatePermissionsMutation.isPending
                      ? (isHe ? 'שומר...' : 'Saving...')
                      : (isHe ? 'שמור' : 'Save Changes')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtering & Search Bar (Stationary Toolbar) */}
          <div className="p-2.5 sm:p-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 shrink-0">
            {/* Domain Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {DOMAIN_GROUPS.map((dom) => {
                const isSelected = activeDomainFilter === dom.id;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setActiveDomainFilter(dom.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                      isSelected
                        ? 'bg-brand-teal-800 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {isHe ? dom.labelHe : dom.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Search Input & Status Toggles */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isHe
                      ? 'חיפוש פעולה לפי קוד, שם או תיאור...'
                      : 'Search actions by code, name, or description...'
                  }
                  className="w-full ps-9 pe-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-hidden"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isHe ? 'הכל' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('granted')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'granted'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  {isHe ? 'מורשה בלבד' : 'Granted'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('denied')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'denied'
                      ? 'bg-slate-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isHe ? 'חסום' : 'Denied'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('high_impact')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    statusFilter === 'high_impact'
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{isHe ? 'רגישות גבוהה' : 'High Impact'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Granular Permission Action Cards (Scrollable Inside Body) */}
          <div className="p-4 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin">
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">
                  {isHe ? 'לא נמצאו פעולות תואמות לסינון' : 'No matching platform actions found'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveDomainFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-brand-teal-700 dark:text-brand-teal-400 font-bold hover:underline"
                >
                  {isHe ? 'נקה את כל המסננים' : 'Clear all search filters'}
                </button>
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([group, perms]) => {
                const Icon = getGroupIcon(group);
                const groupIds = perms.map((p) => p.id);
                const grantedInGroup = groupIds.filter((id) => selectedPermIds.includes(id)).length;
                const allGroupGranted = grantedInGroup === perms.length && perms.length > 0;

                return (
                  <div
                    key={group}
                    className="border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 bg-white dark:bg-slate-850/40 space-y-3.5 shadow-2xs transition-all hover:border-brand-teal-300 dark:hover:border-brand-teal-700"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {group}
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {grantedInGroup} / {perms.length} {isHe ? 'פעולות מורשות' : 'granted'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {isHe
                              ? `שליטה מלאה בכל פעולות תחום ${group}`
                              : `Granular capability controls for ${group} operations`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleGroup(perms)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                          allGroupGranted
                            ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                            : 'bg-brand-teal-50 hover:bg-brand-teal-100 border-brand-teal-200 text-brand-teal-800 dark:bg-brand-teal-950/50 dark:border-brand-teal-800 dark:text-brand-teal-300'
                        }`}
                      >
                        {allGroupGranted
                          ? (isHe ? 'בטל קבוצה' : 'Revoke Category')
                          : (isHe ? 'הפעל הכל בקבוצה' : 'Grant Category')}
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {perms.map((p) => {
                        const isChecked = selectedPermIds.includes(p.id);
                        const meta = PERMISSION_CATALOG[p.code];
                        const title = isHe ? meta?.titleHe || p.code : meta?.titleEn || p.code;
                        const desc = isHe ? meta?.descHe || p.description : meta?.descEn || p.description;

                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePermission(p.id)}
                            className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 group active:scale-[0.99] ${
                              isChecked
                                ? 'bg-gradient-to-r from-brand-teal-50/70 to-emerald-50/40 dark:from-brand-teal-950/40 dark:to-slate-850 border-brand-teal-500/80 dark:border-brand-teal-500 shadow-xs ring-1 ring-brand-teal-500/20'
                                : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`font-black text-sm ${
                                  isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {title}
                                </span>

                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {p.code}
                                </span>

                                {/* Badges */}
                                {meta?.risk === 'high' && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>{isHe ? 'רגישות גבוהה' : 'High Impact'}</span>
                                  </span>
                                )}

                                {meta?.risk === 'financial' && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60">
                                    {isHe ? 'פיננסי' : 'Financial'}
                                  </span>
                                )}

                                {meta?.risk === 'academic' && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60">
                                    {isHe ? 'אקדמי' : 'Academic'}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {desc}
                              </p>
                            </div>

                            {/* Modern Interactive Switch */}
                            <div className="shrink-0 pt-0.5">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isChecked}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePermission(p.id);
                                }}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                  isChecked ? 'bg-brand-teal-700 dark:bg-brand-teal-500 shadow-xs' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    isChecked
                                      ? (isHe ? '-translate-x-5' : 'translate-x-5')
                                      : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Reminder Bar when changes exist */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:end-8 sm:w-auto z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-teal-950 text-white p-4 px-6 rounded-3xl shadow-2xl border border-brand-olive-400/30 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div>
              <div className="text-xs font-black text-white">
                {isHe ? 'ישנם שינויי הרשאות שלא נשמרו' : 'Unsaved permission changes'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isHe && activeRole?.labelHe ? activeRole.labelHe : activeRole?.labelEn} • {selectedPermIds.length} {isHe ? 'פעולות פעילות' : 'actions enabled'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetChanges}
              className="px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              {isHe ? 'בטל' : 'Discard'}
            </button>
            <button
              type="button"
              onClick={() => updatePermissionsMutation.mutate()}
              disabled={updatePermissionsMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-olive-400 hover:bg-brand-olive-300 text-slate-950 text-xs font-black transition shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{updatePermissionsMutation.isPending ? (isHe ? 'שומר...' : 'Saving...') : (isHe ? 'שמור עכשיו' : 'Save Now')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
