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
  redeem: async (token: string): Promise<{ targetUrl: string }> => {
    const res = await api.get(`/review-links/redeem/${token}`);
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
