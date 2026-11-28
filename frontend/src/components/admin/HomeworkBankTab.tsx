import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  FileText,
  HelpCircle,
  Sparkles,
  Users,
  Award,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from '../../store/toastStore';
import {
  homeworkTemplatesApi,
  HomeworkTemplateModel,
  HomeworkQuestion,
} from '../../lib/enterpriseApi';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const TRACK_OPTIONS = [
  { id: 'ALL', labelAr: 'متاح للجميع', labelHe: 'כל המסלולים', labelEn: 'All Tracks' },
  { id: 'AR_HE', labelAr: 'عربي ← عبري', labelHe: 'ערבית ← עברית', labelEn: 'Arabic → Hebrew' },
  { id: 'HE_EN', labelAr: 'عبري ← إنجليزي', labelHe: 'עברית ← אנגלית', labelEn: 'Hebrew → English' },
  { id: 'AR_EN', labelAr: 'عربي ← إنجليزي', labelHe: 'ערבית ← אנגלית', labelEn: 'Arabic → English' },
];

export const HomeworkBankTab: React.FC = () => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isHe = language === 'he';
  const queryClient = useQueryClient();

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<HomeworkTemplateModel | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<HomeworkTemplateModel | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formTitleHe, setFormTitleHe] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPassageTitle, setFormPassageTitle] = useState('');
  const [formPassageText, setFormPassageText] = useState('');
  const [formSelectedLevels, setFormSelectedLevels] = useState<string[]>(['A1']);
  const [formTrack, setFormTrack] = useState('ALL');
  const [formPassingScore, setFormPassingScore] = useState(70);
  const [formQuestions, setFormQuestions] = useState<HomeworkQuestion[]>([]);

  // Query: Fetch Templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['adminHomeworkTemplates', selectedLevel, selectedTrack, searchQuery],
    queryFn: () =>
      homeworkTemplatesApi.list({
        level: selectedLevel !== 'ALL' ? selectedLevel : undefined,
        track: selectedTrack !== 'ALL' ? selectedTrack : undefined,
        search: searchQuery || undefined,
      }),
  });

  // Open Editor for Create
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormTitleAr('');
    setFormTitleHe('');
    setFormDescription('');
    setFormPassageTitle('');
    setFormPassageText('');
    setFormSelectedLevels(['A1']);
    setFormTrack('ALL');
    setFormPassingScore(70);
    setFormQuestions([
      {
        id: 'q1',
        order: 1,
        type: 'TRUE_FALSE',
        prompt: '',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: '',
        points: 1,
      },
    ]);
    setIsEditorOpen(true);
  };

  // Open Editor for Edit
  const handleOpenEdit = (t: HomeworkTemplateModel) => {
    setEditingTemplate(t);
    setFormTitle(t.title || '');
    setFormTitleAr(t.titleAr || '');
    setFormTitleHe(t.titleHe || '');
    setFormDescription(t.description || '');
    setFormPassageTitle(t.readingPassageTitle || '');
    setFormPassageText(t.readingPassage || '');
    setFormSelectedLevels(t.levelCodes?.length ? t.levelCodes : [t.levelCode || 'A1']);
    setFormTrack(t.targetTrack || 'ALL');
    setFormPassingScore(t.passingPercentage || 70);
    setFormQuestions(t.questions?.length ? t.questions : []);
    setIsEditorOpen(true);
  };

  // Mutation: Save Template (Create or Update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formTitle.trim()) throw new Error(isAr ? 'يرجى إدخال عنوان الواجب' : 'Title is required');
      if (!formPassageText.trim()) throw new Error(isAr ? 'يرجى كتابة القطعة القرائية' : 'Reading passage text is required');
      if (formQuestions.length === 0) throw new Error(isAr ? 'يرجى إضافة سؤال واحد على الأقل' : 'At least one question is required');

      // Validate questions
      for (let i = 0; i < formQuestions.length; i++) {
        const q = formQuestions[i];
        if (!q.prompt.trim()) {
          throw new Error(isAr ? `السؤال رقم ${i + 1} لا يحتوي على نص` : `Question #${i + 1} prompt is empty`);
        }
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          throw new Error(isAr ? `السؤال رقم ${i + 1} يحتاج إلى تحديد الإجابة الصحيحة` : `Question #${i + 1} requires a correct answer`);
        }
      }

      const payload = {
        title: formTitle.trim(),
        titleAr: formTitleAr.trim() || undefined,
        titleHe: formTitleHe.trim() || undefined,
        description: formDescription.trim() || undefined,
        readingPassageTitle: formPassageTitle.trim() || undefined,
        readingPassage: formPassageText.trim(),
        levelCode: formSelectedLevels[0] || 'A1',
        levelCodes: formSelectedLevels,
        targetTrack: formTrack,
        passingPercentage: formPassingScore,
        questions: formQuestions,
      };

      if (editingTemplate) {
        return homeworkTemplatesApi.update(editingTemplate.id, payload);
      } else {
        return homeworkTemplatesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHomeworkTemplates'] });
      setIsEditorOpen(false);
      toast.success(
        editingTemplate
          ? (isAr ? 'تم تحديث الواجب بنجاح' : isHe ? 'הוואגב עודכן בהצלחה' : 'Homework updated successfully')
          : (isAr ? 'تم إنشاء الواجب وحفظه في البنك' : isHe ? 'השיעור נוצר בהצלחה' : 'Homework template created successfully')
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save homework');
    },
  });

  // Mutation: Delete Template
  const deleteMutation = useMutation({
    mutationFn: (id: string) => homeworkTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHomeworkTemplates'] });
      toast.success(isAr ? 'تم حذف الواجب من البنك' : 'Homework template deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete');
    },
  });

  // Add Question Helpers
  const addTrueFalseQuestion = () => {
    const newQ: HomeworkQuestion = {
      id: `q_${Date.now()}_${formQuestions.length + 1}`,
      order: formQuestions.length + 1,
      type: 'TRUE_FALSE',
      prompt: '',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: '',
      points: 1,
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  const addMultipleChoiceQuestion = () => {
    const newQ: HomeworkQuestion = {
      id: `q_${Date.now()}_${formQuestions.length + 1}`,
      order: formQuestions.length + 1,
      type: 'MULTIPLE_CHOICE',
      prompt: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  const updateQuestion = (index: number, updates: Partial<HomeworkQuestion>) => {
    const updated = [...formQuestions];
    updated[index] = { ...updated[index], ...updates };
    setFormQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setFormQuestions(formQuestions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-brand-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider border border-teal-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isAr ? 'بنك الواجبات والقطع القرائية' : isHe ? 'מאגר שיעורי בית וקריאה' : 'Interactive Reading & Homework Bank'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isAr ? 'إدارة بنك الواجبات والقطع التفاعلية' : isHe ? 'ניהול מאגר שיעורי הבית של המערכת' : 'Reading Comprehension & Drill Bank'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/80 max-w-2xl leading-relaxed">
              {isAr
                ? 'أنشئ قطعاً قرائية وتدريبات تفاعلية (صح/خطأ واختيار من متعدد) مصححة ذاتياً. يمكن للمعلمين تصفح هذا البنك وتعيين المناسب لكل طالب بضغطة زر.'
                : isHe
                ? 'צור קטעי קריאה ומבחני הבנה אינטראקטיביים עם בדיקה אוטומטית. מורים יכולים לחפש ולהקצות תרגילים אלו ישירות לתלמידים.'
                : 'Author interactive reading passages and self-grading comprehension quizzes (True/False & MCQ). Teachers can search and assign these drills directly to their students.'}
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>{isAr ? 'إنشاء واجب جديد' : isHe ? 'הוסף שיעור בית חדש' : 'Create New Homework'}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث باسم الواجب، عنوان القطعة القرائية، أو محتوى النص...'
                  : isHe
                  ? 'חפש לפי כותרת, קטע קריאה או מילות מפתח...'
                  : 'Search by title, passage name, or keywords...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Level Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setSelectedLevel('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                  selectedLevel === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              {LEVEL_OPTIONS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2 py-1 rounded-lg text-xs font-black transition-colors ${
                    selectedLevel === lvl
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Track Filter */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              {TRACK_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {isAr ? t.labelAr : isHe ? t.labelHe : t.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Homework Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-bold animate-pulse">
          {isAr ? 'جاري تحميل بنك الواجبات...' : 'Loading homework templates...'}
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد واجبات مطابقة' : 'No homework templates found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAr
              ? 'لم يتم إضافة واجبات في هذا التصنيف بعد. انقر على "إنشاء واجب جديد" لإضافة أول قطعة قرائية وأسئلتها.'
              : 'Create your first interactive homework passage with True/False and Multiple Choice questions.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs"
          >
            {isAr ? '+ إنشاء أول واجب' : '+ Create First Homework'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-teal-400 dark:hover:border-teal-600 transition-all group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(tpl.levelCodes?.length ? tpl.levelCodes : [tpl.levelCode]).map((code) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 text-[10px] font-black uppercase tracking-wider"
                      >
                        {code}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      {TRACK_OPTIONS.find((t) => t.id === tpl.targetTrack)?.labelEn || tpl.targetTrack}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{tpl._count?.assignments ?? 0}</span>
                  </span>
                </div>

                {/* Title & Passage Snippet */}
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                    {isAr ? (tpl.titleAr || tpl.title) : isHe ? (tpl.titleHe || tpl.title) : tpl.title}
                  </h3>
                  {tpl.readingPassageTitle && (
                    <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-0.5 line-clamp-1">
                      📖 {tpl.readingPassageTitle}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.readingPassage}
                  </p>
                </div>

                {/* Metrics Pill */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>{tpl.questions?.length ?? 0} {isAr ? 'أسئلة تفاعلية' : 'Questions'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{tpl.totalPoints ?? 10} {isAr ? 'درجة' : 'Pts'}</span>
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'معاينة' : 'Preview'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-600 dark:bg-slate-800 dark:hover:bg-teal-950/40 text-slate-500 transition-colors"
                    title={isAr ? 'تعديل' : 'Edit'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isAr ? 'هل أنت متأكد من حذف هذا الواجب من البنك؟' : 'Are you sure you want to delete this template?')) {
                        deleteMutation.mutate(tpl.id);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 transition-colors"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT HOMEWORK TEMPLATE BUILDER        */}
      {/* ==================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingTemplate
                      ? (isAr ? 'تعديل الواجب التفاعلي' : 'Edit Homework Template')
                      : (isAr ? 'إنشاء واجب تفاعلي جديد' : 'Create New Interactive Homework')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'أدخل نص القطعة القرائية وأسئلة الفهم (صح/خطأ أو اختيار من متعدد)'
                      : 'Configure reading passage and interactive comprehension questions.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* 1. Basic Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'عنوان الواجب الرئيسي (إنجليزي / افتراضي) *' : 'Homework Title (English / Default) *'}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Tom's Trip to London - Past Tense Practice"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'العنوان بالعربية (اختياري)' : 'Arabic Title (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="مثال: رحلة توم إلى لندن - تدريب"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'العنوان بالعبرية (اختياري)' : 'Hebrew Title (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formTitleHe}
                    onChange={(e) => setFormTitleHe(e.target.value)}
                    placeholder="לדוגמה: הטיול של תום ללונדון"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'مسار الجمهور المستهدف *' : 'Target Track *'}
                  </label>
                  <select
                    value={formTrack}
                    onChange={(e) => setFormTrack(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {TRACK_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.labelAr : isHe ? t.labelHe : t.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Level Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isAr ? 'المستويات المستهدفة (حدد ليفل أو أكثر) *' : 'Target CEFR Levels (Multi-selection) *'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map((lvl) => {
                    const isSelected = formSelectedLevels.includes(lvl);
                    return (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => {
                          if (isSelected) {
                            if (formSelectedLevels.length > 1) {
                              setFormSelectedLevels(formSelectedLevels.filter((x) => x !== lvl));
                            }
                          } else {
                            setFormSelectedLevels([...formSelectedLevels, lvl]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {lvl} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Reading Comprehension Passage */}
              <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-black text-teal-950 dark:text-teal-200">
                      {isAr ? 'نص القطعة القرائية (Reading Passage)' : 'Reading Comprehension Passage'}
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold">
                    {formPassageText.trim() ? `${formPassageText.trim().split(/\s+/).length} words` : '0 words'}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={formPassageTitle}
                    onChange={(e) => setFormPassageTitle(e.target.value)}
                    placeholder="Passage Header (e.g. Text 1: Tom's Trip to London)"
                    className="w-full px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={formPassageText}
                    onChange={(e) => setFormPassageText(e.target.value)}
                    placeholder="Enter the reading passage here... (e.g. Last summer, Tom went on a trip to London. His flight was at nine o'clock in the morning. He took one small bag, because he does not like heavy luggage...)"
                    className="w-full p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* 3. Questions Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-600" />
                      <span>{isAr ? 'الأسئلة التفاعلية' : 'Interactive Questions'} ({formQuestions.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? 'أضف أسئلة صح/خطأ أو اختيار من متعدد مع تحديد الإجابة الصحيحة للتصحيح التلقائي'
                        : 'Configure self-grading True/False and Multiple Choice questions.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addTrueFalseQuestion}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold text-xs border border-teal-300/60 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ {isAr ? 'صح / خطأ' : 'True / False'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={addMultipleChoiceQuestion}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs border border-emerald-300/60 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ {isAr ? 'اختيار من متعدد' : 'Multiple Choice'}</span>
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {formQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {q.type === 'TRUE_FALSE' ? (isAr ? 'صح أو خطأ' : 'True or False') : (isAr ? 'اختيار من متعدد' : 'Multiple Choice')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <span>{isAr ? 'الدرجة:' : 'Points:'}</span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={q.points || 1}
                              onChange={(e) => updateQuestion(idx, { points: Number(e.target.value) || 1 })}
                              className="w-12 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <div>
                        <input
                          type="text"
                          value={q.prompt}
                          onChange={(e) => updateQuestion(idx, { prompt: e.target.value })}
                          placeholder={
                            q.type === 'TRUE_FALSE'
                              ? 'e.g. 8. Tom went to London last summer.'
                              : 'e.g. Where did Tom stay in London?'
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {/* True / False Selector */}
                      {q.type === 'TRUE_FALSE' && (
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {isAr ? 'الإجابة الصحيحة:' : 'Correct Answer:'}
                          </span>
                          <div className="flex items-center gap-2">
                            {['True', 'False'].map((choice) => {
                              const isChecked = q.correctAnswer === choice;
                              return (
                                <button
                                  type="button"
                                  key={choice}
                                  onClick={() => updateQuestion(idx, { correctAnswer: choice })}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    isChecked
                                      ? choice === 'True'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {isChecked ? <Check className="w-3.5 h-3.5" /> : null}
                                  <span>{choice}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Multiple Choice Options */}
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 block">
                            {isAr ? 'الخيارات (اختر الدائرة للإجابة الصحيحة):' : 'Options (select radio for correct answer):'}
                          </span>
                          {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                            const isCorrect = q.correctAnswer === opt && opt.trim() !== '';
                            return (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_q_${idx}`}
                                  checked={isCorrect}
                                  onChange={() => updateQuestion(idx, { correctAnswer: opt })}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  disabled={!opt.trim()}
                                />
                                <span className="text-xs font-black text-slate-400 w-4">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...(q.options || [])];
                                    newOptions[optIdx] = e.target.value;
                                    const wasCorrect = q.correctAnswer === opt;
                                    updateQuestion(idx, {
                                      options: newOptions,
                                      correctAnswer: wasCorrect ? e.target.value : q.correctAnswer,
                                    });
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-50/30'
                                      : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation Field */}
                      <div>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                          placeholder={
                            isAr
                              ? 'شرح توضيحي للطالب عند الخطأ (اختياري، مثلاً: النص يذكر أنه سافر الصيف الماضي)'
                              : 'Explanation shown to student after submission (e.g. The text states he went last summer)'
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {saveMutation.isPending
                    ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                    : (isAr ? 'حفظ ونشر في البنك' : 'Save & Publish')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADMIN INTERACTIVE PREVIEW                      */}
      {/* ==================================================== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/30">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isAr ? 'معاينة تجربة الطالب للواجب' : 'Student Experience Preview'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Passage Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {previewTemplate.readingPassageTitle || previewTemplate.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
                  {previewTemplate.readingPassage}
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  {isAr ? 'الأسئلة والحلول النموذجية:' : 'Questions & Answer Key:'}
                </h4>
                {previewTemplate.questions?.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-2"
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      {idx + 1}. {q.prompt}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">{isAr ? 'الإجابة الصحيحة:' : 'Correct Answer:'}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {q.correctAnswer}
                      </span>
                    </div>
                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-end">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
              >
                {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkBankTab;
