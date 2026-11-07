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
              {isHe ? 'סיכום שיעור ומסמך לימוד מובנה' : 'Structured Lesson Notes & Study Guide'}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isRich
                ? isHe
                  ? 'כולל ניקוד, טבלת מילים ודגשי הגייה'
                  : 'Includes Nikud vowels, vocabulary table & highlights'
                : isHe
                ? 'הערות המורה'
                : 'Teacher session feedback'}
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
              {notes.summary}
            </div>
          )}

          {/* Color-Highlighted Phrases with Nikud */}
          {hasHighlights && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Highlighter className="w-3.5 h-3.5 text-purple-500" />
                {isHe ? 'ביטויי מפתח ודגשים (עם ניקוד):' : 'Key Highlighted Phrases (With Nikud):'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notes.highlightedPhrases!.map((phrase, i) => {
                  const style = colorStyles[phrase.color || 'emerald'] || colorStyles.emerald;
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border ${style.bg} ${style.border} ${style.text} flex flex-col justify-between`}
                    >
                      <p className="font-bold text-sm tracking-wide text-slate-900 dark:text-white font-serif" dir="rtl">
                        {phrase.text}
                      </p>
                      {phrase.translation && (
                        <p className="text-[11px] opacity-80 mt-1 font-sans">{phrase.translation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vocabulary Table */}
          {hasVocab && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-teal-500" />
                {isHe ? 'טבלת אוצר מילים שנלמד:' : 'Covered Vocabulary Table:'}
              </span>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5 text-start font-bold">{isHe ? 'עברית עם ניקוד' : 'Hebrew with Nikud'}</th>
                      <th className="p-2.5 text-start font-bold">{isHe ? 'תעתיק לטיני' : 'Transliteration'}</th>
                      <th className="p-2.5 text-start font-bold">{isHe ? 'משמעות / תרגום' : 'English Meaning'}</th>
                      <th className="p-2.5 text-center w-12 font-bold">{isHe ? 'העתק' : 'Copy'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {notes.vocabulary!.map((v, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-2.5 font-bold text-sm text-slate-900 dark:text-white font-serif" dir="rtl">
                          {v.hebrew}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {v.transliteration || '—'}
                        </td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200 font-medium">
                          {v.english}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopy(`${v.hebrew} (${v.transliteration || ''}) = ${v.english}`, idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
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

          {/* Embedded Audio Clips */}
          {hasAudio && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                {isHe ? 'הקלטות שמע והגייה:' : 'Pronunciation & Audio Clips:'}
              </span>

              <div className="space-y-2">
                {notes.audioClips!.map((audio, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {audio.title || (isHe ? `הקלטה ${i + 1}` : `Audio Clip ${i + 1}`)}
                      </span>
                    </div>

                    <audio
                      controls
                      src={audio.audioUrl}
                      className="h-8 max-w-xs w-full outline-none"
                    >
                      Your browser does not support audio element.
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
