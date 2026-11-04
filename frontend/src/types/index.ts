export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
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
  currency: string;
  isActive: boolean;
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

