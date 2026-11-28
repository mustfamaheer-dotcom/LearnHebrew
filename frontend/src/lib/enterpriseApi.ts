import { api } from './api';
import {
  LevelModel,
  LanguageModel,
  SessionTypeModel,
  RoleDefinitionModel,
  PermissionModel,
  PaymentModel,
  LevelExamModel,
  StudentLevelExamModel,
  ReviewLinkModel,
  PointRuleModel,
} from '../types';

export const levelsApi = {
  list: async (): Promise<LevelModel[]> => {
    const res = await api.get('/levels');
    return res.data;
  },
  create: async (data: Partial<LevelModel>): Promise<LevelModel> => {
    const res = await api.post('/levels', data);
    return res.data;
  },
  update: async (id: string, data: Partial<LevelModel>): Promise<LevelModel> => {
    const res = await api.put(`/levels/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/levels/${id}`);
  },
};

export const languagesApi = {
  list: async (): Promise<LanguageModel[]> => {
    const res = await api.get('/languages');
    return res.data;
  },
  create: async (data: Partial<LanguageModel>): Promise<LanguageModel> => {
    const res = await api.post('/languages', data);
    return res.data;
  },
  update: async (id: string, data: Partial<LanguageModel>): Promise<LanguageModel> => {
    const res = await api.put(`/languages/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/languages/${id}`);
  },
  toggle: async (id: string, isActive: boolean): Promise<LanguageModel> => {
    const res = await api.patch(`/languages/${id}/toggle`, { isActive });
    return res.data;
  },
};

export const sessionTypesApi = {
  list: async (): Promise<SessionTypeModel[]> => {
    const res = await api.get('/session-types');
    return res.data;
  },
  create: async (data: Partial<SessionTypeModel>): Promise<SessionTypeModel> => {
    const res = await api.post('/session-types', data);
    return res.data;
  },
  update: async (id: string, data: Partial<SessionTypeModel>): Promise<SessionTypeModel> => {
    const res = await api.put(`/session-types/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/session-types/${id}`);
  },
};

export const rolesApi = {
  getMatrix: async (): Promise<{ roles: RoleDefinitionModel[]; permissions: PermissionModel[] }> => {
    const res = await api.get('/roles/matrix');
    return res.data;
  },
  createRole: async (data: { name: string; labelEn: string; labelHe: string; permissionIds: string[] }): Promise<RoleDefinitionModel> => {
    const res = await api.post('/roles', data);
    return res.data;
  },
  updatePermissions: async (roleId: string, permissionIds: string[]): Promise<RoleDefinitionModel> => {
    const res = await api.put(`/roles/${roleId}/permissions`, { permissionIds });
    return res.data;
  },
  deleteRole: async (roleId: string): Promise<void> => {
    await api.delete(`/roles/${roleId}`);
  },
};

export const paymentsApi = {
  list: async (filters?: { status?: string; studentId?: string }): Promise<PaymentModel[]> => {
    const res = await api.get('/payments', { params: filters });
    return res.data;
  },
  createWithScreenshot: async (formData: FormData): Promise<PaymentModel> => {
    const res = await api.post('/payments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  uploadScreenshotOnly: async (file: File): Promise<{ screenshotUrl: string; originalName: string }> => {
    const formData = new FormData();
    formData.append('screenshot', file);
    const res = await api.post('/payments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  approve: async (id: string): Promise<any> => {
    const res = await api.post(`/payments/${id}/approve`);
    return res.data;
  },
  reject: async (id: string, reason?: string): Promise<any> => {
    const res = await api.post(`/payments/${id}/reject`, { reason });
    return res.data;
  },
};

export const levelExamsApi = {
  list: async (): Promise<LevelExamModel[]> => {
    const res = await api.get('/level-exams');
    return res.data;
  },
  create: async (data: Partial<LevelExamModel>): Promise<LevelExamModel> => {
    const res = await api.post('/level-exams', data);
    return res.data;
  },
  openForStudent: async (examId: string, studentId: string): Promise<StudentLevelExamModel> => {
    const res = await api.post(`/level-exams/${examId}/open/${studentId}`);
    return res.data;
  },
  getMyExams: async (): Promise<StudentLevelExamModel[]> => {
    const res = await api.get('/level-exams/my-exams');
    return res.data;
  },
  submitExam: async (attemptId: string, answers: any): Promise<StudentLevelExamModel> => {
    const res = await api.post(`/level-exams/${attemptId}/submit`, { answers });
    return res.data;
  },
  adminReset: async (attemptId: string): Promise<StudentLevelExamModel> => {
    const res = await api.post(`/level-exams/${attemptId}/reset`);
    return res.data;
  },
};

export const reviewLinksApi = {
  list: async (): Promise<ReviewLinkModel[]> => {
    const res = await api.get('/review-links');
    return res.data;
  },
  create: async (data: { targetUrl?: string; label?: string }): Promise<ReviewLinkModel> => {
    const res = await api.post('/review-links', data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/review-links/${id}`);
  },
  redeem: async (token: string): Promise<{ valid: boolean; targetUrl: string; label?: string; usageCount?: number; submissionsCount?: number }> => {
    const res = await api.get(`/review-links/redeem/${token}`);
    return res.data;
  },
  submit: async (
    token: string,
    data: {
      reviewerName?: string;
      reviewerEmail?: string;
      rating?: number;
      teachingRating?: number;
      platformRating?: number;
      title?: string;
      comment?: string;
      recommend?: boolean;
      allowPublicShare?: boolean;
    }
  ): Promise<{ success: boolean; message: string; targetUrl?: string }> => {
    const res = await api.post(`/review-links/submit/${token}`, data);
    return res.data;
  },
};

export const pointRulesApi = {
  list: async (): Promise<PointRuleModel[]> => {
    const res = await api.get('/point-rules');
    return res.data;
  },
  update: async (id: string, data: { points: number; isActive?: boolean; description?: string }): Promise<PointRuleModel> => {
    const res = await api.put(`/point-rules/${id}`, data);
    return res.data;
  },
};

export const teacherActionsApi = {
  markAttendance: async (lessonId: string, status: 'ATTENDED' | 'ABSENT' | 'EXCUSED') => {
    const res = await api.put(`/lessons/${lessonId}/attendance`, { status });
    return res.data;
  },
  unlockGame: async (gameId: string, studentId: string, lessonId: string) => {
    const res = await api.post(`/games/${gameId}/unlock`, { studentId, lessonId });
    return res.data;
  },
};

export interface HomeworkQuestion {
  id: string;
  order: number;
  type: 'TRUE_FALSE' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
}

export interface HomeworkTemplateModel {
  id: string;
  title: string;
  titleAr?: string;
  titleHe?: string;
  description?: string;
  readingPassageTitle?: string;
  readingPassage: string;
  levelCode: string;
  levelCodes: string[];
  targetTrack: string;
  questions: HomeworkQuestion[];
  totalPoints: number;
  passingPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { assignments: number };
}

export const homeworkTemplatesApi = {
  list: async (filters?: { level?: string; track?: string; search?: string; isActive?: boolean }): Promise<HomeworkTemplateModel[]> => {
    const res = await api.get('/homework/templates', { params: filters });
    return res.data.templates;
  },
  getById: async (id: string): Promise<HomeworkTemplateModel> => {
    const res = await api.get(`/homework/templates/${id}`);
    return res.data.template;
  },
  create: async (data: Partial<HomeworkTemplateModel>): Promise<HomeworkTemplateModel> => {
    const res = await api.post('/homework/templates', data);
    return res.data.template;
  },
  update: async (id: string, data: Partial<HomeworkTemplateModel>): Promise<HomeworkTemplateModel> => {
    const res = await api.put(`/homework/templates/${id}`, data);
    return res.data.template;
  },
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/homework/templates/${id}`);
    return res.data;
  },
  catalog: async (filters?: { level?: string; track?: string; search?: string }): Promise<HomeworkTemplateModel[]> => {
    const res = await api.get('/homework/catalog', { params: filters });
    return res.data.catalog;
  },
  assign: async (data: { templateId: string; studentId: string; lessonId?: string; dueDate?: string; customNotes?: string }) => {
    const res = await api.post('/homework/assign-template', data);
    return res.data;
  },
  getSolveData: async (homeworkId: string) => {
    const res = await api.get(`/homework/${homeworkId}/solve`);
    return res.data;
  },
  submitInteractive: async (homeworkId: string, answers: Record<string, any>) => {
    const res = await api.post(`/homework/${homeworkId}/submit-interactive`, { answers });
    return res.data;
  },
};
