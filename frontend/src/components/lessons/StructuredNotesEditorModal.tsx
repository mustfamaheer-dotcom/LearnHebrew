import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Link,
  BookOpen,
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

const NIKUD_CHARS = [
  { char: '\u05B7', label: 'Patach (ַ)' },
  { char: '\u05B8', label: 'Kamatz (ָ)' },
  { char: '\u05B4', label: 'Chiriq (ִ)' },
  { char: '\u05B5', label: 'Tsere (ֵ)' },
  { char: '\u05B6', label: 'Segol (ֶ)' },
  { char: '\u05B9', label: 'Cholam (ֹ)' },
  { char: '\u05BB', label: 'Kubutz (ֻ)' },
  { char: '\u05B0', label: 'Shva (ְ)' },
  { char: '\u05BC', label: 'Dagesh (ּ)' },
  { char: '\u05C1', label: 'Shin Dot (ׁ)' },
  { char: '\u05C2', label: 'Sin Dot (ׂ)' },
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
  }, [initialNotes, initialRecordingUrl, isOpen]);

  // Insert Nikud at active text cursor
  const insertNikud = (nikudChar: string) => {
    setSummary((prev) => prev + nikudChar);
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
      const payloadData: StructuredNotesData = {
        summary: summary.trim(),
        vocabulary: vocabulary.filter((v) => v.hebrew.trim() || v.english.trim()),
        highlightedPhrases: highlightedPhrases.filter((p) => p.text.trim()),
        audioClips: audioClips.filter((a) => a.audioUrl.trim()),
      };

      const notesJsonString = JSON.stringify(payloadData);

      await api.patch(`/lessons/${lessonId}`, {
        recordingUrl: recordingUrl.trim() || null,
        teacherNotes: notesJsonString,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['studentLessons'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      toast.success(
        isHe
          ? 'סיכום השיעור המובנה נשמר בהצלחה!'
          : 'Structured lesson notes saved successfully!'
      );
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isHe ? 'שגיאה בשמירת סיכום השיעור' : 'Failed to save notes');
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-start">
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
                  ? 'הוסף סיכום עם ניקוד, טבלת מילים, ביטויים צבעוניים והקלטות'
                  : 'Add rich notes with Nikud vowels, vocabulary tables, highlights & audio clips'}
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

        {/* Recording Link Bar */}
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="url"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder={isHe ? 'קישור להקלטת השיעור (Google Drive / Zoom)...' : 'Session Recording Link (Google Drive / Zoom)...'}
              className="flex-1 bg-transparent border-0 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
            />
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
            <span>{isHe ? 'סיכום וניקוד' : 'Summary & Nikud'}</span>
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
          {/* TAB 1: SUMMARY & NIKUD TOOLBAR */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Nikud Keyboard Toolbar */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  {isHe ? 'סרגל הוספת ניקוד בלחיצה אחת:' : 'One-Click Hebrew Nikud Toolbar:'}
                </span>
                <div className="flex flex-wrap gap-1.5" dir="rtl">
                  {NIKUD_CHARS.map((n, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => insertNikud(n.char)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-900 dark:text-white font-serif font-black text-sm shadow-2xs hover:border-teal-400 transition-all"
                      title={n.label}
                    >
                      {n.char}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'סיכום כללי של השיעור והערות:' : 'Session Overview & Teacher Remarks:'}
                </label>
                <textarea
                  rows={6}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={
                    isHe
                      ? 'כתוב כאן את סיכום השיעור, דגשי דקדוק, והנחיות לתרגול...'
                      : 'Summarize topics covered, grammar focus, student progress remarks...'
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
                ? isHe ? 'שומר סיכום...' : 'Saving Notes...'
                : isHe ? 'שמור סיכום שיעור' : 'Save Structured Notes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

