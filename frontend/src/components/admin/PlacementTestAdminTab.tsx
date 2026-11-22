import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  FileText,
  Search,
  RotateCcw,
  UserPlus,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Award,
  Filter,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

interface Submission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nativeLanguage: string;
  score: number;
  totalQuestions: number;
  wrongCount: number;
  stoppedEarly: boolean;
  evaluatedLevel: string;
  timeSpentSeconds: number | null;
  answers: any[];
  status: string;
  convertedToStudent: boolean;
  convertedStudentId: string | null;
  createdAt: string;
}

interface Question {
  id: string;
  orderNumber: number;
  questionText: string;
  questionTextHe?: string | null;
  questionTextAr?: string | null;
  optionA: string;
  optionAHe?: string | null;
  optionAAr?: string | null;
  optionB: string;
  optionBHe?: string | null;
  optionBAr?: string | null;
  optionC: string;
  optionCHe?: string | null;
  optionCAr?: string | null;
  optionD: string;
  optionDHe?: string | null;
  optionDAr?: string | null;
  correctOption: string;
  level: string;
  explanation: string | null;
  explanationHe?: string | null;
  explanationAr?: string | null;
  isActive: boolean;
}

export const PlacementTestAdminTab: React.FC = () => {
  const { language } = useAuthStore();
  const isRTL = language === 'ar' || language === 'he';

  const [activeSubTab, setActiveSubTab] = useState<'submissions' | 'questions'>('submissions');

  // Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [modalLang, setModalLang] = useState<'en' | 'he' | 'ar'>('en');
  const [questionForm, setQuestionForm] = useState({
    orderNumber: 1,
    questionText: '',
    questionTextHe: '',
    questionTextAr: '',
    optionA: '',
    optionAHe: '',
    optionAAr: '',
    optionB: '',
    optionBHe: '',
    optionBAr: '',
    optionC: '',
    optionCHe: '',
    optionCAr: '',
    optionD: '',
    optionDHe: '',
    optionDAr: '',
    correctOption: 'A',
    level: 'A1',
    explanation: '',
    explanationHe: '',
    explanationAr: '',
    isActive: true,
  });

  // Fetch Submissions
  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get('/placement-test/submissions', {
        params: {
          search: search || undefined,
          level: levelFilter !== 'ALL' ? levelFilter : undefined,
        },
      });
      setSubmissions(res.data?.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch Questions
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/placement-test/questions');
      setQuestions(res.data?.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'submissions') {
      fetchSubmissions();
    } else {
      fetchQuestions();
    }
  }, [activeSubTab, levelFilter]);

  // Action: Allow Retake
  const handleAllowRetake = async (sub: Submission) => {
    if (!window.confirm(`Allow a new placement test attempt for ${sub.firstName} ${sub.lastName} (${sub.email})?`)) {
      return;
    }

    setActionLoadingId(sub.id);
    try {
      await api.post(`/placement-test/submissions/${sub.id}/allow-retake`);
      alert(`Retake unlocked successfully! ${sub.firstName} can now take the test again.`);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock retake.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Convert to Student User
  const handleConvertToStudent = async (sub: Submission) => {
    if (!window.confirm(`Create a Student Account for ${sub.firstName} ${sub.lastName} with CEFR Level ${sub.evaluatedLevel}?`)) {
      return;
    }

    setActionLoadingId(sub.id);
    try {
      const res = await api.post(`/placement-test/submissions/${sub.id}/convert-to-student`);
      alert(`Success! Student account created for ${sub.email}. Temporary password: Student@2026!`);
      fetchSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert to student.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Save Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await api.put(`/placement-test/questions/${editingQuestion.id}`, {
          ...questionForm,
          id: editingQuestion.id,
        });
      } else {
        await api.post('/placement-test/questions', questionForm);
      }
      setQuestionModalOpen(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save question.');
    }
  };

  // Action: Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this placement test question?')) return;
    try {
      await api.delete(`/placement-test/questions/${id}`);
      fetchQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const getLevelBadge = (lvl: string) => {
    switch (lvl) {
      case 'A1':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'A2':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200';
      case 'B1':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      case 'B2':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'C1':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200';
      case 'C2':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Subdomain Link */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-300" />
            <h2 className="text-xl font-extrabold tracking-tight">
              {language === 'ar' ? 'إدارة اختبار تحديد المستوى' : language === 'he' ? 'ניהול מבחן רמה' : 'English Placement Test Management'}
            </h2>
          </div>
          <p className="text-xs text-teal-100 max-w-xl">
            {language === 'ar'
              ? 'متابعة نتائج المرشحين، إدارة بنك الـ 36 سؤالاً، فتح محاولات إعادة، وتحويل المتقدمين إلى طلاب مسجلين بضغطة زر.'
              : language === 'he'
              ? 'מעקב אחר תוצאות נבחנים, ניהול מאגר 36 השאלות, פתיחת ניסיונות חוזרים והמרת מועמדים לתלמידים פעילים.'
              : 'Monitor candidate test submissions, manage the 36-question grammar bank, unlock retakes, and convert prospects to active students.'}
          </p>
        </div>

        {/* Live Placement Test Links */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/placement-test"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>Open Test Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'submissions'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{language === 'ar' ? 'نتائج المتقدمين' : language === 'he' ? 'תוצאות נבחנים' : 'Candidate Submissions'}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
            {submissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'questions'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{language === 'ar' ? 'بنك الأسئلة (36)' : language === 'he' ? 'מאגר שאלות (36)' : 'Question Bank (36)'}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
            {questions.length || 36}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: SUBMISSIONS & LEADS TABLE                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث بالاسم، الإيميل، الهاتف...' : 'Search by candidate, email, phone...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSubmissions()}
                className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500">CEFR:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Levels</option>
                <option value="A1">Level A1 (Elementary)</option>
                <option value="A2">Level A2 (Pre-Intermediate)</option>
                <option value="B1">Level B1 (Intermediate)</option>
                <option value="B2">Level B2 (Upper Intermediate)</option>
                <option value="C1">Level C1 (Advanced)</option>
                <option value="C2">Level C2 (Fluent / Mastery)</option>
              </select>

              <button
                onClick={fetchSubmissions}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Lang</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">CEFR Level</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {loadingSubmissions ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Loading test submissions...
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p>No placement test submissions found.</p>
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {sub.firstName} {sub.lastName}
                          </span>
                          {sub.stoppedEarly && (
                            <span className="text-[10px] text-rose-500 font-semibold block">
                              Stopped at 4 mistakes
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="block text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                              {sub.email}
                            </span>
                            <span className="block text-slate-500 font-mono text-[11px]">
                              {sub.phone}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            {sub.nativeLanguage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {sub.score} / {sub.totalQuestions}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {Math.round((sub.score / sub.totalQuestions) * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${getLevelBadge(sub.evaluatedLevel)}`}>
                            {sub.evaluatedLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {sub.convertedToStudent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Student Active</span>
                            </span>
                          ) : sub.status === 'RETAKE_ALLOWED' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                              Retake Unlocked
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-[10px]">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="View Question-by-Question Answers"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Allow Retake */}
                            <button
                              onClick={() => handleAllowRetake(sub)}
                              disabled={actionLoadingId === sub.id}
                              className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                              title="Allow Retake (Unlock Exam)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Convert to Student */}
                            {!sub.convertedToStudent && (
                              <button
                                onClick={() => handleConvertToStudent(sub)}
                                disabled={actionLoadingId === sub.id}
                                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                                title="Create Student User Account"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Create Student</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: QUESTION BANK MANAGEMENT (36 QUESTIONS)                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                36 English Grammar Placement Questions
              </h3>
              <p className="text-xs text-slate-500">
                Gradually escalating difficulty from Elementary (A1) to Fluent (C2).
              </p>
            </div>

            <button
              onClick={() => {
                setEditingQuestion(null);
                setModalLang('en');
                setQuestionForm({
                  orderNumber: questions.length + 1,
                  questionText: '',
                  questionTextHe: '',
                  questionTextAr: '',
                  optionA: '',
                  optionAHe: '',
                  optionAAr: '',
                  optionB: '',
                  optionBHe: '',
                  optionBAr: '',
                  optionC: '',
                  optionCHe: '',
                  optionCAr: '',
                  optionD: '',
                  optionDHe: '',
                  optionDAr: '',
                  correctOption: 'A',
                  level: 'A1',
                  explanation: '',
                  explanationHe: '',
                  explanationAr: '',
                  isActive: true,
                });
                setQuestionModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center">
                      #{q.orderNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getLevelBadge(q.level)}`}>
                      {q.level}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-bold ms-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/50">EN</span>
                      <span className={`px-1.5 py-0.5 rounded ${q.questionTextHe ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50' : 'bg-slate-100 text-slate-400'}`}>HE</span>
                      <span className={`px-1.5 py-0.5 rounded ${q.questionTextAr ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/50' : 'bg-slate-100 text-slate-400'}`}>AR</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setModalLang('en');
                        setQuestionForm({
                          orderNumber: q.orderNumber,
                          questionText: q.questionText,
                          questionTextHe: q.questionTextHe || '',
                          questionTextAr: q.questionTextAr || '',
                          optionA: q.optionA,
                          optionAHe: q.optionAHe || '',
                          optionAAr: q.optionAAr || '',
                          optionB: q.optionB,
                          optionBHe: q.optionBHe || '',
                          optionBAr: q.optionBAr || '',
                          optionC: q.optionC,
                          optionCHe: q.optionCHe || '',
                          optionCAr: q.optionCAr || '',
                          optionD: q.optionD,
                          optionDHe: q.optionDHe || '',
                          optionDAr: q.optionDAr || '',
                          correctOption: q.correctOption,
                          level: q.level,
                          explanation: q.explanation || '',
                          explanationHe: q.explanationHe || '',
                          explanationAr: q.explanationAr || '',
                          isActive: q.isActive,
                        });
                        setQuestionModalOpen(true);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                      title="Edit Question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {q.questionText}
                </p>

                {/* Options List */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'A', text: q.optionA },
                    { key: 'B', text: q.optionB },
                    { key: 'C', text: q.optionC },
                    { key: 'D', text: q.optionD },
                  ].map(({ key, text }) => (
                    <div
                      key={key}
                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                        q.correctOption === key
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-extrabold">{key}.</span>
                      <span className="truncate">{text}</span>
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-400 italic">
                    Note: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CANDIDATE DETAILED ANSWERS MODAL (FULLY SCROLLABLE)               */}
      {/* ========================================================================= */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full h-[90vh] max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedSubmission.firstName} {selectedSubmission.lastName}'s Exam Breakdown</span>
                  {selectedSubmission.stoppedEarly && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      Stopped Early (4 Mistakes)
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1">
                  <span>
                    Evaluated CEFR: <strong className="text-teal-600 font-extrabold">{selectedSubmission.evaluatedLevel}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Score: <strong>{selectedSubmission.score} / {selectedSubmission.totalQuestions}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Attempted: <strong>{selectedSubmission.answers?.length || 0} / {selectedSubmission.totalQuestions}</strong>
                  </span>
                  {selectedSubmission.timeSpentSeconds && (
                    <>
                      <span>•</span>
                      <span>
                        Time: <strong>{Math.floor(selectedSubmission.timeSpentSeconds / 60)}m {selectedSubmission.timeSpentSeconds % 60}s</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Questions Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-slate-800/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-teal-500">
              {Array.isArray(selectedSubmission.answers) && selectedSubmission.answers.map((ans: any, idx: number) => {
                const q = questions.find((x) => x.id === ans.questionId || x.orderNumber === ans.orderNumber);

                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                      ans.isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                        : ans.isDontKnow
                        ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/80 text-purple-950 dark:text-purple-100'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80 text-rose-950 dark:text-rose-100'
                    }`}
                  >
                    {/* Question Title & Level */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm block leading-snug">
                          #{ans.orderNumber}. {ans.questionText || q?.questionText}
                        </span>
                        {(q?.questionTextHe || q?.questionTextAr) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                            {q?.questionTextHe && <div dir="rtl">🇮🇱 {q.questionTextHe}</div>}
                            {q?.questionTextAr && <div dir="rtl">🇸🇦 {q.questionTextAr}</div>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {ans.level || q?.level}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-2xs ${
                          ans.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : ans.isDontKnow
                            ? 'bg-purple-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}>
                          {ans.isCorrect ? '✓ Correct' : ans.isDontKnow ? '🤷 I don\'t know' : '✗ Mistake'}
                        </span>
                      </div>
                    </div>

                    {/* Option Choices Details (A, B, C, D) */}
                    {q && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {[
                          { key: 'A', text: q.optionA, he: q.optionAHe, ar: q.optionAAr },
                          { key: 'B', text: q.optionB, he: q.optionBHe, ar: q.optionBAr },
                          { key: 'C', text: q.optionC, he: q.optionCHe, ar: q.optionCAr },
                          { key: 'D', text: q.optionD, he: q.optionDHe, ar: q.optionDAr },
                        ].map((opt) => {
                          const isPicked = ans.selectedOption === opt.key;
                          const isCorrect = q.correctOption?.toUpperCase() === opt.key;

                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 transition-all ${
                                isCorrect
                                  ? 'bg-emerald-100/70 dark:bg-emerald-900/40 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-400'
                                  : isPicked
                                  ? 'bg-rose-100/70 dark:bg-rose-900/40 border-rose-400 text-rose-900 dark:text-rose-100 font-bold'
                                  : 'bg-white/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isPicked
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {opt.key}
                                </span>
                                <span className="truncate">{opt.text}</span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1 text-[10px]">
                                {isCorrect && (
                                  <span className="text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
                                    [Correct]
                                  </span>
                                )}
                                {isPicked && !isCorrect && (
                                  <span className="text-rose-700 dark:text-rose-300 font-extrabold uppercase">
                                    [Candidate Pick]
                                  </span>
                                )}
                                {isPicked && isCorrect && (
                                  <span className="text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
                                    [Candidate Pick ✓]
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Candidate Answer Summary */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Candidate Answer:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md ${
                          ans.isCorrect
                            ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                            : ans.isDontKnow
                            ? 'bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                            : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                        }`}>
                          {ans.isDontKnow ? "I don't know" : ans.selectedOption}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Correct Answer:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          {ans.correctOption || q?.correctOption}
                        </span>
                      </div>
                    </div>

                    {/* Grammar Rule / Explanation */}
                    {(ans.explanation || q?.explanation) && (
                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-100">Why:</strong> {ans.explanation || q?.explanation}
                        </div>
                        {q?.explanationHe && (
                          <div dir="rtl" className="text-slate-500 dark:text-slate-400">
                            <strong>הסבר:</strong> {q.explanationHe}
                          </div>
                        )}
                        {q?.explanationAr && (
                          <div dir="rtl" className="text-slate-500 dark:text-slate-400">
                            <strong>التوضيح:</strong> {q.explanationAr}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Notice if test stopped early */}
              {selectedSubmission.stoppedEarly && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Remaining Questions (#{(selectedSubmission.answers?.length || 0) + 1} to #36) Not Attempted</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                    The candidate reached the maximum limit of 4 incorrect answers at question #{selectedSubmission.answers?.length || 0}. The exam was automatically concluded in accordance with CEFR adaptive stopping criteria.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
              <span className="text-xs text-slate-500 font-medium">
                Showing {selectedSubmission.answers?.length || 0} evaluated questions
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT QUESTION MODAL                                        */}
      {/* ========================================================================= */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {editingQuestion ? 'Edit Placement Question' : 'Add Placement Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Order Number (1-36)</label>
                  <input
                    type="number"
                    required
                    value={questionForm.orderNumber}
                    onChange={(e) => setQuestionForm({ ...questionForm, orderNumber: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">CEFR Level</label>
                  <select
                    value={questionForm.level}
                    onChange={(e) => setQuestionForm({ ...questionForm, level: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Correct Answer</label>
                <select
                  value={questionForm.correctOption}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctOption: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              {/* Language Switcher for Question Content */}
              <div className="pt-1">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalLang('en')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      modalLang === 'en'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalLang('he')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      modalLang === 'he'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🇮🇱</span>
                    <span>עברית</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalLang('ar')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      modalLang === 'ar'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🇸🇦</span>
                    <span>العربية</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Content based on modalLang */}
              <div className="space-y-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-bold mb-1">
                    {modalLang === 'en' ? 'Question Text (English)' : modalLang === 'he' ? 'נוסח השאלה (עברית)' : 'نص السؤال (العربية)'}
                  </label>
                  <input
                    type="text"
                    required={modalLang === 'en'}
                    dir={modalLang === 'en' ? 'ltr' : 'rtl'}
                    value={
                      modalLang === 'en'
                        ? questionForm.questionText
                        : modalLang === 'he'
                        ? questionForm.questionTextHe
                        : questionForm.questionTextAr
                    }
                    onChange={(e) => {
                      if (modalLang === 'en') setQuestionForm({ ...questionForm, questionText: e.target.value });
                      else if (modalLang === 'he') setQuestionForm({ ...questionForm, questionTextHe: e.target.value });
                      else setQuestionForm({ ...questionForm, questionTextAr: e.target.value });
                    }}
                    placeholder={
                      modalLang === 'en'
                        ? 'e.g. I ______ bus on Mondays.'
                        : modalLang === 'he'
                        ? 'לדוגמה: I ______ bus on Mondays. (אני ______ באוטובוס)'
                        : 'مثال: I ______ bus on Mondays. (أنا ______ بالحافلة)'
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">
                      {modalLang === 'en' ? 'Option A' : modalLang === 'he' ? 'אפשרות A (עברית)' : 'الخيار A (العربية)'}
                    </label>
                    <input
                      type="text"
                      required={modalLang === 'en'}
                      dir={modalLang === 'en' ? 'ltr' : 'rtl'}
                      value={
                        modalLang === 'en'
                          ? questionForm.optionA
                          : modalLang === 'he'
                          ? questionForm.optionAHe
                          : questionForm.optionAAr
                      }
                      onChange={(e) => {
                        if (modalLang === 'en') setQuestionForm({ ...questionForm, optionA: e.target.value });
                        else if (modalLang === 'he') setQuestionForm({ ...questionForm, optionAHe: e.target.value });
                        else setQuestionForm({ ...questionForm, optionAAr: e.target.value });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      {modalLang === 'en' ? 'Option B' : modalLang === 'he' ? 'אפשרות B (עברית)' : 'الخيار B (العربية)'}
                    </label>
                    <input
                      type="text"
                      required={modalLang === 'en'}
                      dir={modalLang === 'en' ? 'ltr' : 'rtl'}
                      value={
                        modalLang === 'en'
                          ? questionForm.optionB
                          : modalLang === 'he'
                          ? questionForm.optionBHe
                          : questionForm.optionBAr
                      }
                      onChange={(e) => {
                        if (modalLang === 'en') setQuestionForm({ ...questionForm, optionB: e.target.value });
                        else if (modalLang === 'he') setQuestionForm({ ...questionForm, optionBHe: e.target.value });
                        else setQuestionForm({ ...questionForm, optionBAr: e.target.value });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      {modalLang === 'en' ? 'Option C' : modalLang === 'he' ? 'אפשרות C (עברית)' : 'الخيار C (العربية)'}
                    </label>
                    <input
                      type="text"
                      required={modalLang === 'en'}
                      dir={modalLang === 'en' ? 'ltr' : 'rtl'}
                      value={
                        modalLang === 'en'
                          ? questionForm.optionC
                          : modalLang === 'he'
                          ? questionForm.optionCHe
                          : questionForm.optionCAr
                      }
                      onChange={(e) => {
                        if (modalLang === 'en') setQuestionForm({ ...questionForm, optionC: e.target.value });
                        else if (modalLang === 'he') setQuestionForm({ ...questionForm, optionCHe: e.target.value });
                        else setQuestionForm({ ...questionForm, optionCAr: e.target.value });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      {modalLang === 'en' ? 'Option D' : modalLang === 'he' ? 'אפשרות D (עברית)' : 'الخيار D (العربية)'}
                    </label>
                    <input
                      type="text"
                      required={modalLang === 'en'}
                      dir={modalLang === 'en' ? 'ltr' : 'rtl'}
                      value={
                        modalLang === 'en'
                          ? questionForm.optionD
                          : modalLang === 'he'
                          ? questionForm.optionDHe
                          : questionForm.optionDAr
                      }
                      onChange={(e) => {
                        if (modalLang === 'en') setQuestionForm({ ...questionForm, optionD: e.target.value });
                        else if (modalLang === 'he') setQuestionForm({ ...questionForm, optionDHe: e.target.value });
                        else setQuestionForm({ ...questionForm, optionDAr: e.target.value });
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {modalLang === 'en' ? 'Grammar Explanation (English)' : modalLang === 'he' ? 'הסבר דקדוקי (עברית)' : 'الشرح النحوي (العربية)'}
                  </label>
                  <textarea
                    rows={2}
                    dir={modalLang === 'en' ? 'ltr' : 'rtl'}
                    value={
                      modalLang === 'en'
                        ? questionForm.explanation
                        : modalLang === 'he'
                        ? questionForm.explanationHe
                        : questionForm.explanationAr
                    }
                    onChange={(e) => {
                      if (modalLang === 'en') setQuestionForm({ ...questionForm, explanation: e.target.value });
                      else if (modalLang === 'he') setQuestionForm({ ...questionForm, explanationHe: e.target.value });
                      else setQuestionForm({ ...questionForm, explanationAr: e.target.value });
                    }}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTestAdminTab;
