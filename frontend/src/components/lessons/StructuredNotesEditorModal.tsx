import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  FileText,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Languages,
  Highlighter,
  Volume2,
  Link,
  BookOpen,
  Keyboard,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Delete,
  ExternalLink,
} from 'lucide-react';
import {
  StructuredNotesData,
  parseStructuredNotes,
} from './StructuredNotesViewer';

interface StructuredNotesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  initialNotes?: string | null;
  initialRecordingUrl?: string | null;
  onSuccess?: () => void;
}

// Full Hebrew Alphabet Keys organized in standard Israeli keyboard rows
const HEBREW_KEYBOARD_ROWS = [
  ['/', "'", 'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'],
];

// Complete Hebrew Nikud (Vowels & Marks)
const NIKUD_CHARS = [
  { char: '\u05B7', label: 'Patach (ַ)' },
  { char: '\u05B8', label: 'Kamatz (ָ)' },
  { char: '\u05B4', label: 'Chiriq (ִ)' },
  { char: '\u05B5', label: 'Tsere (ֵ)' },
  { char: '\u05B6', label: 'Segol (ֶ)' },
  { char: '\u05B9', label: 'Cholam (ֹ)' },
  { char: '\u05BB', label: 'Kubutz (ֻ)' },
  { char: '\u05B0', label: 'Shva (ְ)' },
  { char: '\u05BC', label: 'Dagesh / Mappiq (ּ)' },
  { char: '\u05C1', label: 'Shin Dot (ׁ)' },
  { char: '\u05C2', label: 'Sin Dot (ׂ)' },
  { char: '\u05B2', label: 'Chataf Patach (ֲ)' },
  { char: '\u05B3', label: 'Chataf Kamatz (ֳ)' },
  { char: '\u05B1', label: 'Chataf Segol (ֱ)' },
];

export const StructuredNotesEditorModal: React.FC<StructuredNotesEditorModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  initialNotes,
  initialRecordingUrl,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isHe = language === 'he';

  const summaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [activeTab, setActiveTab] = useState<'summary' | 'vocab' | 'phrases' | 'audio'>('summary');
  const [recordingUrl, setRecordingUrl] = useState(initialRecordingUrl || '');
  const [summary, setSummary] = useState('');
  const [vocabulary, setVocabulary] = useState<
    Array<{ hebrew: string; transliteration: string; english: string }>
  >([]);
  const [highlightedPhrases, setHighlightedPhrases] = useState<
    Array<{ text: string; translation: string; color: 'emerald' | 'cyan' | 'purple' | 'amber' }>
  >([]);
  const [audioClips, setAudioClips] = useState<Array<{ title: string; audioUrl: string }>>([]);

  // Full Hebrew Virtual Keyboard State & Controls
  const [showKeyboard, setShowKeyboard] = useState<boolean>(true);
  const [keyboardView, setKeyboardView] = useState<'all' | 'letters' | 'nikud'>('all');

  // Detailed actionable error banner state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialNotes) {
      const parsed = parseStructuredNotes(initialNotes);
      if (parsed) {
        setSummary(parsed.summary || '');
        setVocabulary(
          (parsed.vocabulary || []).map((v) => ({
            hebrew: v.hebrew,
            transliteration: v.transliteration || '',
            english: v.english,
          }))
        );
        setHighlightedPhrases(
          (parsed.highlightedPhrases || []).map((p) => ({
            text: p.text,
            translation: p.translation || '',
            color: (p.color as any) || 'emerald',
          }))
        );
        setAudioClips(parsed.audioClips || []);
      } else {
        setSummary(initialNotes);
      }
    } else {
      setSummary('');
      setVocabulary([]);
      setHighlightedPhrases([]);
      setAudioClips([]);
    }
    setRecordingUrl(initialRecordingUrl || '');
    setErrorMessage(null);
  }, [initialNotes, initialRecordingUrl, isOpen]);

  // Insert character or Nikud at current cursor location with focus retention
  const insertChar = (char: string) => {
    const el = summaryTextareaRef.current;
    if (el) {
      const start = el.selectionStart ?? summary.length;
      const end = el.selectionEnd ?? summary.length;
      const newSummary = summary.substring(0, start) + char + summary.substring(end);
      setSummary(newSummary);
      setTimeout(() => {
        el.focus();
        const newPos = start + char.length;
        el.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setSummary((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    const el = summaryTextareaRef.current;
    if (el) {
      const start = el.selectionStart ?? summary.length;
      const end = el.selectionEnd ?? summary.length;
      if (start === end && start > 0) {
        const newSummary = summary.substring(0, start - 1) + summary.substring(end);
        setSummary(newSummary);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start - 1, start - 1);
        }, 0);
      } else if (start !== end) {
        const newSummary = summary.substring(0, start) + summary.substring(end);
        setSummary(newSummary);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start, start);
        }, 0);
      }
    } else {
      setSummary((prev) => prev.slice(0, -1));
    }
  };

  const addVocabRow = () => {
    setVocabulary((prev) => [...prev, { hebrew: '', transliteration: '', english: '' }]);
  };

  const removeVocabRow = (idx: number) => {
    setVocabulary((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPhraseRow = () => {
    setHighlightedPhrases((prev) => [...prev, { text: '', translation: '', color: 'emerald' }]);
  };

  const removePhraseRow = (idx: number) => {
    setHighlightedPhrases((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAudioRow = () => {
    setAudioClips((prev) => [...prev, { title: '', audioUrl: '' }]);
  };

  const removeAudioRow = (idx: number) => {
    setAudioClips((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);

      // Validate recording URL format if entered
      const trimmedUrl = recordingUrl.trim();
      if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        throw new Error(
          isHe
            ? 'קישור ההקלטה חייב להתחיל ב-https:// או http:// (לדוגמה קישור מ-Google Drive או זום).'
            : 'The recording URL must start with https:// or http:// (e.g. Google Drive or Zoom link).'
        );
      }

      const payloadData: StructuredNotesData = {
        summary: summary.trim(),
        vocabulary: vocabulary.filter((v) => v.hebrew.trim() || v.english.trim()),
        highlightedPhrases: highlightedPhrases.filter((p) => p.text.trim()),
        audioClips: audioClips.filter((a) => a.audioUrl.trim()),
      };

      const notesJsonString = JSON.stringify(payloadData);

      await api.patch(`/lessons/${lessonId}`, {
        recordingUrl: trimmedUrl || null,
        teacherNotes: notesJsonString,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['studentLessons'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentRecordedSessions'] });
      queryClient.invalidateQueries({ queryKey: ['recordedSessions'] });
      toast.success(
        isHe
          ? 'סיכום השיעור נשמר וההקלטה סונכרנה בהצלחה למאגר השיעורים המוקלטים!'
          : 'Structured lesson notes saved & recording synced to Recorded Sessions!'
      );
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';

      const guidance = isHe
        ? 'אנא בדוק את תקינות הקישור, ודא שחיבור האינטרנט פעיל ונסה לשמור שוב.'
        : 'Please ensure the link is a valid web address, check your connection, and try saving again.';

      const fullError = serverMsg ? `${serverMsg} • ${guidance}` : guidance;
      setErrorMessage(fullError);
      toast.error(fullError);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-start">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isHe ? 'עורך סיכומי שיעור מובנים' : 'Structured Lesson Notes Editor'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHe
                  ? 'הוסף סיכום עם מקלדת עברית מלאה וניקוד, טבלת מילים, ביטויים והקלטות'
                  : 'Add notes with full Hebrew keyboard & Nikud, vocabulary tables, highlights & audio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clear Actionable Error Display Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {isHe ? 'נדרשת תשומת לב:' : 'Action Required:'}
                </span>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Google Drive / Session Recording Link Bar with Auto-Sync Notice */}
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <input
              type="url"
              value={recordingUrl}
              onChange={(e) => {
                setRecordingUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={
                isHe
                  ? 'קישור להקלטת השיעור (Google Drive / Zoom) - מסונכרן אוטומטית למאגר ההקלטות של התלמיד...'
                  : 'Session Recording Link (Google Drive / Zoom) - automatically synced to student recorded portal...'
              }
              className="flex-1 bg-transparent border-0 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-teal-700 dark:text-teal-400 font-medium">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>
              {isHe
                ? 'שמירת קישור ההקלטה תוסיף אותו אוטומטית למאגר השיעורים המוקלטים של התלמיד.'
                : 'Saving the recording link automatically publishes it to the student’s Recorded Sessions repository.'}
            </span>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-900/30 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'summary'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isHe ? 'סיכום ומקלדת עברית' : 'Summary & Hebrew Keyboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'vocab'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>{isHe ? `אוצר מילים (${vocabulary.length})` : `Vocabulary (${vocabulary.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phrases')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'phrases'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Highlighter className="w-4 h-4" />
            <span>{isHe ? `ביטויים מודגשים (${highlightedPhrases.length})` : `Highlights (${highlightedPhrases.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'audio'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isHe ? `הקלטות קול (${audioClips.length})` : `Audio Clips (${audioClips.length})`}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SUMMARY & FULL HEBREW KEYBOARD */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Full Hebrew Keyboard + Nikud Accordion Card */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                {/* Keyboard Header & Hide/Show Toggle */}
                <div className="p-3 bg-slate-100/80 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isHe ? 'מקלדת עברית מלאה וסרגל ניקוד' : 'Full Hebrew Virtual Keyboard & Nikud'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold">
                      א-ת + ניקוד
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: Letters / Nikud / All */}
                    {showKeyboard && (
                      <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setKeyboardView('all')}
                          className={`px-2 py-0.5 rounded-md transition-colors ${
                            keyboardView === 'all'
                              ? 'bg-teal-600 text-white'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {isHe ? 'הכל' : 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyboardView('letters')}
                          className={`px-2 py-0.5 rounded-md transition-colors ${
                            keyboardView === 'letters'
                              ? 'bg-teal-600 text-white'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {isHe ? 'אותיות' : 'Letters'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyboardView('nikud')}
                          className={`px-2 py-0.5 rounded-md transition-colors ${
                            keyboardView === 'nikud'
                              ? 'bg-teal-600 text-white'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {isHe ? 'ניקוד' : 'Nikud'}
                        </button>
                      </div>
                    )}

                    {/* Hide / Show Button */}
                    <button
                      type="button"
                      onClick={() => setShowKeyboard((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={showKeyboard ? (isHe ? 'הסתר מקלדת' : 'Hide Keyboard') : (isHe ? 'הצג מקלדת' : 'Show Keyboard')}
                    >
                      <span>
                        {showKeyboard
                          ? isHe ? 'הסתר מקלדת' : 'Hide Keyboard'
                          : isHe ? 'הצג מקלדת' : 'Show Keyboard'}
                      </span>
                      {showKeyboard ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Keyboard Body */}
                {showKeyboard && (
                  <div className="p-3 space-y-2.5 animate-fade-in" dir="rtl">
                    {/* Hebrew Alphabet Rows */}
                    {(keyboardView === 'all' || keyboardView === 'letters') && (
                      <div className="space-y-1.5">
                        {HEBREW_KEYBOARD_ROWS.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5 flex-wrap">
                            {row.map((letter) => (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => insertChar(letter)}
                                className="w-7 h-8 sm:w-8 sm:h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-900 dark:text-white font-serif font-black text-sm sm:text-base shadow-2xs hover:border-teal-400 active:scale-95 transition-all flex items-center justify-center"
                              >
                                {letter}
                              </button>
                            ))}
                          </div>
                        ))}

                        {/* Functional Action Keys: Space, Backspace, Quotes */}
                        <div className="flex justify-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => insertChar('׳')}
                            className="px-2.5 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 active:scale-95"
                            title="Geresh (׳)"
                          >
                            ׳
                          </button>
                          <button
                            type="button"
                            onClick={() => insertChar('״')}
                            className="px-2.5 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 active:scale-95"
                            title="Gershayim (״)"
                          >
                            ״
                          </button>
                          <button
                            type="button"
                            onClick={() => insertChar(' ')}
                            className="flex-1 max-w-[200px] h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>{isHe ? 'רווח' : 'Space'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleBackspace}
                            className="px-3 h-8 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold active:scale-95 flex items-center gap-1"
                            title={isHe ? 'מחיקה' : 'Backspace'}
                          >
                            <Delete className="w-3.5 h-3.5" />
                            <span>{isHe ? 'מחק' : 'Back'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nikud Vowel Marks Bar */}
                    {(keyboardView === 'all' || keyboardView === 'nikud') && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-400" dir="ltr">
                          <span>{isHe ? 'ניקוד ותנועות (הוסף לאות שנבחרה):' : 'Hebrew Nikud Vowels (Add to selected letter):'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {NIKUD_CHARS.map((n, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => insertChar(n.char)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-900 dark:text-white font-serif font-black text-sm shadow-2xs hover:border-teal-400 active:scale-95 transition-all"
                              title={n.label}
                            >
                              {n.char}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary Textarea with Active Cursor Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'סיכום כללי של השיעור והערות:' : 'Session Overview & Teacher Remarks:'}
                </label>
                <textarea
                  ref={summaryTextareaRef}
                  rows={6}
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={
                    isHe
                      ? 'כתוב כאן את סיכום השיעור, דגשי דקדוק, והנחיות לתרגול (השתמש במקלדת למעלה לניקוד ואותיות)...'
                      : 'Summarize topics covered, grammar focus, student progress remarks (use virtual keyboard for Hebrew letters & Nikud)...'
                  }
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: VOCABULARY TABLE BUILDER */}
          {activeTab === 'vocab' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    {isHe ? 'טבלת אוצר מילים שנלמד' : 'Vocabulary Table Builder'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isHe ? 'הוסף מילים בעברית (כולל ניקוד), תעתיק לטיני ותרגום' : 'Hebrew words with Nikud, phonetic transliteration, and translation'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVocabRow}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold hover:bg-teal-100 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHe ? 'הוסף מילה' : 'Add Word'}</span>
                </button>
              </div>

              {vocabulary.length > 0 ? (
                <div className="space-y-2.5">
                  {vocabulary.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          dir="rtl"
                          placeholder={isHe ? 'עברית עם ניקוד (למשל: שָׁלוֹם)' : 'Hebrew (e.g. שָׁלוֹם)'}
                          value={row.hebrew}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVocabulary((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, hebrew: val } : r))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white font-serif outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder={isHe ? 'תעתיק (למשל: Shalom)' : 'Transliteration (e.g. Shalom)'}
                          value={row.transliteration}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVocabulary((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, transliteration: val } : r))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder={isHe ? 'משמעות (למשל: Peace / Hello)' : 'Meaning (e.g. Peace / Hello)'}
                          value={row.english}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVocabulary((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, english: val } : r))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeVocabRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                  {isHe
                    ? 'אין מילים בטבלה. לחץ על "הוסף מילה" להוספת אוצר מילים.'
                    : 'No vocabulary words added. Click "Add Word" to build a study table.'}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HIGHLIGHTED PHRASES */}
          {activeTab === 'phrases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    {isHe ? 'ביטויי מפתח מודגשים בצבע' : 'Color-Highlighted Key Phrases'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isHe ? 'הדגש ביטויים מרכזיים עם ניקוד וצבעי רקע' : 'Feature conversational phrases with Nikud and color highlights'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPhraseRow}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHe ? 'הוסף ביטוי' : 'Add Phrase'}</span>
                </button>
              </div>

              {highlightedPhrases.length > 0 ? (
                <div className="space-y-2.5">
                  {highlightedPhrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          dir="rtl"
                          placeholder={isHe ? 'ביטוי בעברית (עם ניקוד)...' : 'Hebrew Phrase with Nikud...'}
                          value={phrase.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHighlightedPhrases((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, text: val } : p))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white font-serif outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder={isHe ? 'תרגום / הסבר...' : 'Translation / context...'}
                          value={phrase.translation}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHighlightedPhrases((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, translation: val } : p))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={phrase.color}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setHighlightedPhrases((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, color: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                        >
                          <option value="emerald">Emerald 🟢</option>
                          <option value="purple">Purple 🟣</option>
                          <option value="cyan">Cyan 🔵</option>
                          <option value="amber">Amber 🟡</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removePhraseRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove phrase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                  {isHe
                    ? 'אין ביטויים מודגשים. לחץ על "הוסף ביטוי" להדגשת משפטים מרכזיים.'
                    : 'No highlighted phrases added. Click "Add Phrase" to feature idioms or grammar patterns.'}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIO CLIPS */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    {isHe ? 'הקלטות שמע להגייה נכונה' : 'Embedded Audio Clips'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isHe ? 'הוסף קישורי אודיו או קבצי קול מ-Drive להשמעה ישירה ע״י התלמיד' : 'Link audio pronunciations or Google Drive audio for in-app student replay'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAudioRow}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHe ? 'הוסף הקלטה' : 'Add Clip'}</span>
                </button>
              </div>

              {audioClips.length > 0 ? (
                <div className="space-y-2.5">
                  {audioClips.map((clip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder={isHe ? 'כותרת ההקלטה (למשל: הגיית תנועות)...' : 'Audio Title (e.g. Vowel drill)...'}
                          value={clip.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAudioClips((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, title: val } : a))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={clip.audioUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAudioClips((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, audioUrl: val } : a))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeAudioRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove clip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                  {isHe
                    ? 'אין הקלטות קול מקושרות.'
                    : 'No audio clips added. Click "Add Clip" to link pronunciation recordings.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {isHe ? 'ביטול' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {saveMutation.isPending
                ? isHe ? 'שומר ומסנכרן...' : 'Saving & Syncing...'
                : isHe ? 'שמור וסנכרן להקלטות' : 'Save & Sync Recording'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
