import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { levelExamsApi, levelsApi } from '../../lib/enterpriseApi';
import { LevelExamModel } from '../../types';
import { toast } from '../../store/toastStore';
import {
  Award,
  Plus,
  UserCheck,
  RefreshCw,
  CheckCircle,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit2,
  X,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

interface ExamQuestion {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE';
  questionEn: string;
  questionHe: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export const LevelExamsTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['level-exams'],
    queryFn: levelExamsApi.list,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.list,
  });

  const [form, setForm] = useState({
    levelId: '',
    title: '',
    titleHe: '',
    description: '',
    passingScore: 70,
  });

  const [questions, setQuestions] = useState<ExamQuestion[]>([
    {
      id: 'q1',
      type: 'MCQ',
      questionEn: 'Which Hebrew letter makes the "Sh" sound?',
      questionHe: 'איזו אות מבטאת את הצליל "שׁ"?',
      options: ['ס (Samekh)', 'ש (Shin)', 'צ (Tsadi)'],
      correctAnswer: 'ש (Shin)',
      points: 50,
    },
    {
      id: 'q2',
      type: 'TRUE_FALSE',
      questionEn: 'Hebrew is read from right to left.',
      questionHe: 'עברית נקראת מימין לשמאל.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 50,
    },
  ]);

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      levelExamsApi.create({
        ...form,
        questions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['level-exams'] });
      toast.success(language === 'he' ? 'תבנית המבחן נוצרה בהצלחה' : 'Level Exam template created successfully');
      setIsCreating(false);
      setForm({ levelId: levels[0]?.id || '', title: '', titleHe: '', description: '', passingScore: 70 });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה ביצירת מבחן' : 'Failed to create exam')),
  });

  // Download CSV Template
  const downloadCsvTemplate = () => {
    const csvContent =
      '\uFEFF' +
      'Question_EN,Question_HE,Type,Option_A,Option_B,Option_C,Option_D,Correct_Answer,Points\n' +
      '"Which Hebrew letter makes the ""Sh"" sound?","איזו אות מבטאת את הצליל ""שׁ""?",MCQ,"ס (Samekh)","ש (Shin)","צ (Tsadi)","ב (Bet)","ש (Shin)",25\n' +
      '"Hebrew is written and read from right to left.","עברית נכתבת ונקראת מימין לשמאל.",TRUE_FALSE,"True","False","","","True",25\n' +
      '"What is the Hebrew greeting for ""Peace/Hello""?","מהי ברכת השלום המקובלת בעברית?",MCQ,"Shalom (שלום)","Boker Tov (בוקר טוב)","Toda (תודה)","Lehitraot (להתראות)","Shalom (שלום)",25\n' +
      '"The vowel dot under a letter is called a Niqqud.","סימן הניקוד תחת האות נקרא ניקוד.",TRUE_FALSE,"True","False","","","True",25\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Engrew_Exam_Questions_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(language === 'he' ? 'תבנית ה-CSV הורדה בהצלחה' : 'CSV Template downloaded successfully');
  };

  // Upload and Parse CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length <= 1) {
          toast.error(language === 'he' ? 'קובץ ה-CSV ריק' : 'The CSV file is empty');
          return;
        }

        const parsedQuestions: ExamQuestion[] = [];
        // Skip header line 0
        for (let i = 1; i < lines.length; i++) {
          // Parse CSV line taking quotes into account
          const row: string[] = [];
          let insideQuote = false;
          let currentField = '';

          for (let c = 0; c < lines[i].length; c++) {
            const char = lines[i][c];
            if (char === '"') {
              if (insideQuote && lines[i][c + 1] === '"') {
                currentField += '"';
                c++;
              } else {
                insideQuote = !insideQuote;
              }
            } else if (char === ',' && !insideQuote) {
              row.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          row.push(currentField.trim());

          if (row.length >= 7) {
            const [qEn, qHe, type, optA, optB, optC, optD, correctAns, pts] = row;
            const options = [optA, optB, optC, optD].filter(Boolean);

            parsedQuestions.push({
              id: `q_${Date.now()}_${i}`,
              type: type?.toUpperCase() === 'TRUE_FALSE' ? 'TRUE_FALSE' : 'MCQ',
              questionEn: qEn || `Question ${i}`,
              questionHe: qHe || qEn,
              options: options.length > 0 ? options : ['True', 'False'],
              correctAnswer: correctAns || options[0] || 'True',
              points: Number(pts) || 25,
            });
          }
        }

        if (parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          toast.success(
            language === 'he'
              ? `${parsedQuestions.length} שאלות נטענו בהצלחה מה-CSV!`
              : `Successfully imported ${parsedQuestions.length} questions from CSV!`
          );
        } else {
          toast.error(language === 'he' ? 'לא זוהו שאלות תקינות בקובץ' : 'No valid questions found in CSV');
        }
      } catch (err) {
        toast.error(language === 'he' ? 'שגיאה בקריאת קובץ CSV' : 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddEmptyQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}`,
        type: 'MCQ',
        questionEn: '',
        questionHe: '',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 'Option 1',
        points: 25,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Award}
        badgeText={language === 'he' ? 'מערכת מבחני מעבר רמה (הזדמנות אחת)' : '1-Attempt Exam Engine'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'מבחני מעבר והתקדמות רמה' : 'Level Progression Exams'}
        description={
          language === 'he'
            ? 'מורים פותחים מבחנים אלו לתלמידים בסיום סילבוס הרמה. לתלמיד יש ניסיון יחיד לעבור. ניתן לייבא שאלות מקובץ CSV או ליצור ידנית.'
            : 'Teachers unlock these exams for students after completing level curricula. Students have 1 attempt to pass. Upload exams via CSV or author questions directly.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadCsvTemplate}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95"
              title={language === 'he' ? 'הורד תבנית CSV מוכנה' : 'Download CSV Template'}
            >
              <Download className="w-4 h-4 text-brand-olive-300" />
              <span>{language === 'he' ? 'הורד תבנית CSV' : 'CSV Template'}</span>
            </button>
            <button
              onClick={() => {
                if (levels.length > 0 && !form.levelId) setForm({ ...form, levelId: levels[0].id });
                setIsCreating(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{language === 'he' ? 'צור מבחן חדש' : 'Create Exam'}</span>
            </button>
          </div>
        }
      />

      {/* CREATE EXAM MODAL / DRAWER */}
      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-6 shadow-xs animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-brand-teal-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {language === 'he' ? 'בניית מבחן התקדמות רמה' : 'Level Progression Exam Builder'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'he' ? 'הגדר פרטי מבחן והעלה שאלות מקובץ CSV או הוסף שאלות ידנית' : 'Configure exam metadata and import questions via CSV or build them inline.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-xs transition shadow-xs"
              >
                <Upload className="w-4 h-4 text-brand-olive-300" />
                <span>{language === 'he' ? 'העלה שאלות מ-CSV' : 'Upload CSV Questions'}</span>
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title={language === 'he' ? 'הורד תבנית CSV' : 'Download CSV Template'}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exam Metadata Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'רמת יעד' : 'Target Level'}
              </label>
              <select
                value={form.levelId}
                onChange={(e) => setForm({ ...form, levelId: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {language === 'he' && l.labelHe ? l.labelHe : l.labelEn} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'כותרת המבחן (אנגלית)' : 'Exam Title (EN)'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Level Alef Transition Exam' : 'e.g. Level Alef Transition Exam'}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'כותרת המבחן (עברית)' : 'Exam Title (HE)'}
              </label>
              <input
                type="text"
                placeholder="לדוגמה: מבחן מעבר רמה א׳"
                value={form.titleHe}
                onChange={(e) => setForm({ ...form, titleHe: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'ציון מעבר נדרש (%)' : 'Passing Score (%)'}
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={form.passingScore}
                onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Questions List Header */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {language === 'he' ? 'שאלות המבחן' : 'Exam Questions'} ({questions.length})
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {language === 'he'
                    ? `סה״כ נקודות: ${questions.reduce((s, q) => s + (q.points || 0), 0)}`
                    : `Total Points: ${questions.reduce((s, q) => s + (q.points || 0), 0)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddEmptyQuestion}
                className="flex items-center gap-1 text-xs font-bold text-brand-teal-700 dark:text-brand-teal-300 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'he' ? 'הוסף שאלה' : 'Add Question'}</span>
              </button>
            </div>

            {/* Questions Table / Cards */}
            <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2 py-0.5 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-800 dark:text-brand-teal-300 font-bold text-xs">
                      #{idx + 1} • {q.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title={language === 'he' ? 'הסר שאלה' : 'Remove Question'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">{language === 'he' ? 'שאלה (אנגלית)' : 'Question (EN)'}</span>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{q.questionEn}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">{language === 'he' ? 'שאלה (עברית)' : 'Question (HE)'}</span>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{q.questionHe}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-slate-500">{language === 'he' ? 'אפשרויות:' : 'Options:'}</span>
                    {q.options?.map((opt, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-lg font-medium text-[11px] ${
                          opt === q.correctAnswer
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt} {opt === q.correctAnswer ? '✓' : ''}
                      </span>
                    ))}
                    <span className="ms-auto text-[11px] font-bold text-amber-600">
                      +{q.points} {language === 'he' ? 'נק׳' : 'pts'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-brand-teal-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || questions.length === 0 || createMutation.isPending}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
            >
              {createMutation.isPending
                ? (language === 'he' ? 'שומר...' : 'Saving...')
                : (language === 'he' ? 'שמור תבנית מבחן' : 'Save Exam Template')}
            </button>
          </div>
        </div>
      )}

      {/* EXAMS DIRECTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => {
          const isExpanded = expandedExamId === ex.id;
          const questionsList = (ex.questions as any[]) || [];

          return (
            <div
              key={ex.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800/40">
                    {language === 'he' ? `רמת יעד: ${ex.level?.labelHe || ex.level?.labelEn}` : `Target: ${ex.level?.labelEn}`}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">{ex.title}</h4>
                  <p className="text-xs text-slate-500 font-medium" dir="rtl">{ex.titleHe}</p>
                </div>

                <div className="text-end">
                  <span className="text-xs font-black text-brand-teal-700 dark:text-brand-teal-300">
                    {language === 'he' ? `ציון מעבר: ${ex.passingScore}%` : `Pass: ${ex.passingScore}%`}
                  </span>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {questionsList.length} {language === 'he' ? 'שאלות' : 'questions'}
                  </div>
                </div>
              </div>

              {/* Accordion Toggle for Question Preview */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExpandedExamId(isExpanded ? null : ex.id)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-teal-800 dark:hover:text-brand-teal-300"
                >
                  <span>
                    {isExpanded
                      ? (language === 'he' ? 'הסתר שאלות' : 'Hide Questions')
                      : (language === 'he' ? 'הצג תצוגה מקדימה של שאלות' : 'Preview Questions')}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                    {questionsList.map((q, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          #{idx + 1}: {q.questionEn}
                        </div>
                        <div className="text-[11px] text-slate-400" dir="rtl">{q.questionHe}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          {language === 'he' ? 'תשובה נכונה:' : 'Correct:'} {q.correctAnswer} (+{q.points || 25} pts)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {exams.length === 0 && (
          <div className="col-span-2 p-10 text-center text-slate-400 border border-dashed rounded-3xl">
            {language === 'he'
              ? 'אין עדיין תבניות מבחנים. לחץ על "צור מבחן חדש" או העלה קובץ CSV.'
              : 'No exam templates created yet. Click "Create Exam" or upload a CSV.'}
          </div>
        )}
      </div>
    </div>
  );
};
