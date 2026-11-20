import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Highlighter,
  Languages,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export interface StructuredNotesData {
  summary?: string;
  vocabulary?: Array<{
    hebrew: string;
    transliteration?: string;
    english: string;
  }>;
  highlightedPhrases?: Array<{
    text: string;
    translation?: string;
    color?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
  }>;
  audioClips?: Array<{
    title: string;
    audioUrl: string;
  }>;
}

interface StructuredNotesViewerProps {
  notesString: string | null | undefined;
  compact?: boolean;
}

export function parseStructuredNotes(raw: string | null | undefined): StructuredNotesData | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return parsed as StructuredNotesData;
      }
    } catch {
      // fallback to plain text
    }
  }
  return { summary: trimmed };
}

export const StructuredNotesViewer: React.FC<StructuredNotesViewerProps> = ({
  notesString,
  compact = false,
}) => {
  const { language } = useTranslation();
  const isHe = language === 'he';
  const isAr = language === 'ar';
  const loc = (ar: string, he: string, en: string) => (isAr ? ar : isHe ? he : en);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const notes = parseStructuredNotes(notesString);
  if (!notes) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasVocab = notes.vocabulary && notes.vocabulary.length > 0;
  const hasHighlights = notes.highlightedPhrases && notes.highlightedPhrases.length > 0;
  const hasAudio = notes.audioClips && notes.audioClips.length > 0;
  const isRich = hasVocab || hasHighlights || hasAudio;

  const localizeSummary = (text: string) => {
    if (!isAr) return text;
    return text
      .replace(/Lesson topic:/gi, 'موضوع الحصة:')
      .replace(/Ordering at a Tel Aviv Coffee Shop/gi, 'الطلب في مقهى في تل أبيب')
      .replace(/Foundations of Reading and Script/gi, 'أسس القراءة والكتابة العبرية')
      .replace(/Israeli Cultural Nuance and Humor/gi, 'الفكاهة والثقافة والتعبيرات الإسرائيلية')
      .replace(/Present Tense Verbs \(Paal\)/gi, 'أفعال الزمن الحاضر (بنيان باعل)')
      .replace(/Directions and City Navigation/gi, 'الاتجاهات والتنقل في المدينة')
      .replace(/Past Tense Dialogs and Stories/gi, 'حوارات وقصص في زمن الماضي')
      .replace(/Israeli Slang and Colloquial Speech/gi, 'العامية والمصطلحات الإسرائيلية الدارجة')
      .replace(/Modern News Headlines Analysis/gi, 'تحليل عناوين الأخبار المعاصرة')
      .replace(/Student showed strong engagement and retention\./gi, 'أظهر الطالب تفاعلاً واستيعاباً ممتازين خلال الحصة.');
  };

  const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-900 dark:text-emerald-200',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-cyan-900 dark:text-cyan-200',
      border: 'border-cyan-200 dark:border-cyan-800',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-900 dark:text-purple-200',
      border: 'border-purple-200 dark:border-purple-800',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-900 dark:text-amber-200',
      border: 'border-amber-200 dark:border-amber-800',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-900 dark:text-rose-200',
      border: 'border-rose-200 dark:border-rose-800',
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-xs overflow-hidden transition-all text-start">
      {/* Header bar */}
      <div
        className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {loc('ملخص وملاحظات الدرس التعليمي المعتمد', 'סיכום שיעור ומסמך לימוד מובנה', 'Structured Lesson Notes & Study Guide')}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isRich
                ? loc('يتضمن الحركات والتشكيل، وجدول المفردات وأبرز التعابير', 'כולל ניקוד, טבלת מילים ודגשי הגייה', 'Includes Nikud vowels, vocabulary table & highlights')
                : loc('ملاحظات وتوجيهات المعلم', 'הערות המורה', 'Teacher session feedback')}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          {/* Summary / Notes text */}
          {notes.summary && (
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line text-xs bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              {localizeSummary(notes.summary)}
            </div>
          )}

          {/* Color-Highlighted Phrases with Nikud */}
          {hasHighlights && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Highlighter className="w-3.5 h-3.5 text-purple-500" />
                {loc('العبارات والتعابير الرئيسية (مع التشكيل):', 'ביטויי מפתח ודגשים (עם ניקוד):', 'Key Highlighted Phrases (With Nikud):')}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notes.highlightedPhrases!.map((phrase, i) => {
                  const style = colorStyles[phrase.color || 'emerald'] || colorStyles.emerald;
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border ${style.bg} ${style.border} flex items-center justify-between gap-2`}
                    >
                      <div>
                        <span className={`font-serif text-sm font-bold ${style.text}`}>
                          {phrase.text}
                        </span>
                        {phrase.translation && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {phrase.translation}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(phrase.text, 100 + i)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0"
                        title={loc('نسخ العبارة', 'העתק', 'Copy')}
                      >
                        {copiedIndex === 100 + i ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vocabulary Table with Vowels / Transliteration */}
          {hasVocab && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-teal-600" />
                {loc('المفردات الجديدة المكتسبة في الحصة:', 'אוצר מילים חדש מהשיעור:', 'New Session Vocabulary:')}
              </span>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3 text-start">{loc('الكلمة بالعبرية (مع التشكيل)', 'עברית (מנוקד)', 'Hebrew (With Nikud)')}</th>
                      <th className="py-2 px-3 text-start">{loc('النطق الصوتي', 'תעתיק', 'Transliteration')}</th>
                      <th className="py-2 px-3 text-start">{loc('المعنى بالإنجليزية', 'תרגום', 'Meaning')}</th>
                      <th className="py-2 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notes.vocabulary!.map((v, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2 px-3 font-serif font-bold text-slate-900 dark:text-white text-sm">
                          {v.hebrew}
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {v.transliteration || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {v.english}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopy(`${v.hebrew} - ${v.english}`, i)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            title={loc('نسخ', 'העתק', 'Copy')}
                          >
                            {copiedIndex === i ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audio Clips */}
          {hasAudio && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                {loc('التسجيلات الصوتية والنطق المرفق:', 'הקלטות קוליות והגייה:', 'Audio Practice Clips:')}
              </span>

              <div className="space-y-1.5">
                {notes.audioClips!.map((clip, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {clip.title}
                    </span>
                    <audio controls className="h-7 w-48 sm:w-64 max-w-full" src={clip.audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
