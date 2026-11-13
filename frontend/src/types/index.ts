export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'CS' | 'TEACHER' | 'STUDENT';
export type LanguagePref = 'en' | 'he';
export type HebrewLevel =
  | 'BEGINNER'
  | 'ELEMENTARY'
  | 'INTERMEDIATE'
  | 'UPPER_INTERMEDIATE'
  | 'ADVANCED'
  | 'FLUENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  languagePref: LanguagePref;
  avatarUrl?: string;
  isActive: boolean;
  mustChangePw: boolean;
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
}

export interface StudentProfile {
  id: string;
  level: HebrewLevel;
  totalPoints: number;
  streakDays: number;
  lastLessonAt?: string;
  notes?: string;
  packages?: StudentPackage[];
}

export interface TeacherProfile {
  id: string;
  bio?: string;
  specialties: string[];
  ratingAvg: number;
  ratingCount: number;
}

export interface Package {
  id: string;
  name: string;
  nameHe: string;
  description?: string;
  descriptionHe?: string;
  totalLessons: number;
  validityDays: number;
  price: number;
  originalPrice?: number | null;
  onSale?: boolean;
  isPopular?: boolean;
  currency: string;
  isActive: boolean;
  sessionItems?: Array<{
    id?: string;
    sessionTypeId: string;
    quantity: number;
    sessionType?: { id: string; name: string; durationMinutes: number; labelEn: string; labelHe: string };
  }>;
}

export interface StudentPackage {
  id: string;
  studentId: string;
  packageId: string;
  package: Package;
  lessonsTotal: number;
  lessonsUsed: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
}

export interface TimeSlot {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotType: 'REGULAR' | 'ONE_TIME';
  isAvailable: boolean;
}

export interface Lesson {
  id: string;
  studentId: string;
  teacherId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  lessonType: 'REGULAR' | 'ONE_TIME';
  zoomLink?: string;
  recordingUrl?: string;
  teacherNotes?: string;
  student?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  homework?: Homework[];
  feedback?: LessonFeedback;
}

export interface Homework {
  id: string;
  lessonId?: string;
  studentId: string;
  teacherId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  studentNote?: string;
  teacherFeedback?: string;
  student?: { user: { firstName: string; lastName: string } };
  teacher?: { user: { firstName: string; lastName: string } };
}

export interface LessonFeedback {
  id: string;
  lessonId: string;
  qualityRating: number;
  difficulty: number;
  paceRating: number;
  comments?: string;
}

export interface TeacherSurvey {
  id: string;
  studentId: string;
  teacherId: string;
  communication: number;
  knowledge: number;
  punctuality: number;
  overallRating: number;
  comments?: string;
  teacher?: { user: { firstName: string; lastName: string } };
  student?: { user: { firstName: string; lastName: string } };
}

export interface Game {
  id: string;
  title: string;
  titleHe: string;
  description?: string;
  gameType: 'FLASHCARD' | 'QUIZ' | 'MATCHING' | 'FILL_BLANK';
  level: HebrewLevel;
  configJson: any;
  pointsReward: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  avatarUrl?: string;
  level: HebrewLevel;
  totalPoints: number;
  streakDays: number;
}


// 2026 Enterprise Plan Additions
export type ExtendedRole = 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'CS' | 'TEACHER' | 'STUDENT';

export interface LevelModel {
  id: string;
  code: string;
  labelEn: string;
  labelHe: string;
  sortOrder: number;
  isActive: boolean;
  color?: string;
  description?: string;
  _count?: { students: number; games: number; levelExams: number };
}

export interface LanguageModel {
  id: string;
  code: string;
  labelEn: string;
  labelNative: string;
  isActive: boolean;
  flagEmoji?: string;
}

export interface SessionTypeModel {
  id: string;
  name: string;
  durationMinutes: number;
  labelEn: string;
  labelHe: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { lessons: number; packageItems: number };
}

export interface StudentSessionBalance {
  id: string;
  studentId: string;
  sessionTypeId: string;
  sessionType: SessionTypeModel;
  balance: number;
  expiresAt?: string;
}

export interface PackageSessionItem {
  id: string;
  packageId: string;
  sessionTypeId: string;
  sessionType: SessionTypeModel;
  quantity: number;
}

export interface PaymentModel {
  id: string;
  studentId: string;
  student: { user: { firstName: string; lastName: string; email: string } };
  packageId: string;
  package: { name: string; nameHe: string; sessionItems: PackageSessionItem[] };
  createdById: string;
  createdBy: { firstName: string; lastName: string; role: string; email: string };
  screenshotUrl: string;
  screenshotOriginalName?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface LevelExamModel {
  id: string;
  levelId: string;
  level: LevelModel;
  title: string;
  titleHe: string;
  description?: string;
  passingScore: number;
  questions: any[];
  isActive: boolean;
  _count?: { studentAttempts: number };
}

export interface StudentLevelExamModel {
  id: string;
  studentId: string;
  examId: string;
  exam: LevelExamModel;
  openedById: string;
  openedAt: string;
  score?: number;
  passed?: boolean;
  newLevelId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'RESET';
}

export interface ReviewLinkModel {
  id: string;
  token: string;
  createdById: string;
  createdBy: { firstName: string; lastName: string; email: string };
  targetUrl: string;
  label?: string;
  usedAt?: string;
  usedByIp?: string;
  isUsed: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface PointRuleModel {
  id: string;
  eventType: string;
  points: number;
  isActive: boolean;
  description?: string;
  updatedAt: string;
}

export interface PermissionModel {
  id: string;
  code: string;
  group: string;
  description: string;
}

export interface RoleDefinitionModel {
  id: string;
  name: string;
  labelEn: string;
  labelHe: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Array<{ permission: PermissionModel; granted: boolean }>;
}
