import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Bookmark,
  Share2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  Layers,
  CheckCircle,
  Clock,
  ExternalLink,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { haptics } from '../../utils/haptics';
import { toast } from '../../store/toastStore';

export interface PracticeShortItem {
  id: string;
  title: string;
  titleHe?: string;
  titleAr?: string;
  description?: string;
  descriptionHe?: string;
  descriptionAr?: string;
  videoUrl: string;
  googleDriveId?: string;
  thumbnailUrl?: string;
  levelCode?: string;
  durationSeconds?: number;
  sortOrder: number;
  viewCount: number;
  likeCount: number;
  tags: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  level?: {
    code: string;
    labelEn: string;
    labelHe: string;
  };
}

const LEVEL_TO_CEFR: Record<string, string> = {
  BEGINNER: 'A1',
  ELEMENTARY: 'A2',
  INTERMEDIATE: 'B1',
  UPPER_INTERMEDIATE: 'B2',
  ADVANCED: 'C1',
  FLUENT: 'C2',
};

interface StudentShortsFeedProps {
  studentLevel?: string;
}

export const StudentShortsFeed: React.FC<StudentShortsFeedProps> = ({ studentLevel }) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const isHe = language === 'he';

  // Normalize student level (e.g. BEGINNER -> A1)
  const normalizedLevel = useMemo(() => {
    if (!studentLevel) return 'A1';
    const upper = String(studentLevel).trim().toUpperCase();
    return LEVEL_TO_CEFR[upper] || upper;
  }, [studentLevel]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [showHeartAnim, setShowHeartAnim] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch shorts strictly for student's level
  const { data: shorts = [], isLoading } = useQuery<PracticeShortItem[]>({
    queryKey: ['studentPracticeShorts', normalizedLevel],
    queryFn: async () => {
      const res = await api.get('/shorts', {
        params: { levelCode: normalizedLevel },
      });
      return res.data?.shorts || [];
    },
  });

  const currentShort: PracticeShortItem | undefined = shorts[currentIndex];

  // Helper to extract Drive ID
  const extractDriveId = (url: string) => {
    if (!url) return null;
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Interaction mutation
  const interactMutation = useMutation({
    mutationFn: async ({ shortId, isLiked, isSaved }: { shortId: string; isLiked?: boolean; isSaved?: boolean }) => {
      return api.post(`/shorts/${shortId}/interact`, { isLiked, isSaved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPracticeShorts'] });
    },
  });

  // Track view when current index changes
  useEffect(() => {
    if (currentShort) {
      api.post(`/shorts/${currentShort.id}/view`).catch(() => {});
    }
  }, [currentShort?.id]);

  // Keyboard navigation for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture inside inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'm') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.key === 'l' && currentShort) {
        e.preventDefault();
        handleToggleLike(currentShort);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, shorts.length, currentShort]);

  const handleNext = () => {
    haptics.tap();
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    haptics.tap();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleToggleLike = (short: PracticeShortItem) => {
    haptics.tap();
    const newLiked = !short.isLiked;
    if (newLiked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    }
    interactMutation.mutate({ shortId: short.id, isLiked: newLiked });
  };

  const handleToggleSave = (short: PracticeShortItem) => {
    haptics.tap();
    const newSaved = !short.isSaved;
    interactMutation.mutate({ shortId: short.id, isSaved: newSaved });
    toast.success(
      newSaved
        ? isHe ? 'הסרטון נשמר במועדפים' : isAr ? 'تم حفظ المقطع في المفضلة' : 'Short saved to bookmarks'
        : isHe ? 'הסרטון הוסר מהמועדפים' : isAr ? 'تمت الإزالة من المفضلة' : 'Short removed from bookmarks'
    );
  };

  const handleShare = (short: PracticeShortItem) => {
    haptics.tap();
    if (navigator.share) {
      navigator.share({
        title: short.titleHe || short.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(isHe ? 'הקישור הועתק' : isAr ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 border border-brand-teal-200 dark:border-brand-teal-800 flex items-center justify-center">
          <Film className="w-7 h-7 text-brand-teal-600 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isHe ? 'טוען סרטוני תרגול...' : isAr ? 'جاري تحميل مقاطع التدريب...' : 'Loading Learn in Shorts...'}
          </p>
          <p className="text-xs text-slate-500">
            {isHe ? 'מכין חוויית צפייה מותאמת אישית' : 'Optimizing vertical practice reels'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Header & Automatic Level Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isHe ? 'סרטונים לתרגול' : isAr ? 'فيديوهات للتدريب (Shorts)' : 'Learn in Shorts'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider">
                Reels
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHe
                ? 'שיעורים קצרים וממוקדים לתרגול יומיומי בפורמט וידאו אנכי'
                : isAr
                ? 'مقاطع سريعة ومركزة للتدريب اليومي بأسلوب تيك توك التفاعלי'
                : 'Bite-sized vertical video lessons designed for rapid daily drills'}
            </p>
          </div>
        </div>

        {/* Automatic Student Level Badge (Locked Strictly to Student Level) */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200/80 dark:border-brand-teal-800/80 shrink-0 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-brand-teal-500 animate-pulse" />
          <span className="text-xs font-bold text-brand-teal-900 dark:text-brand-teal-200">
            {isHe ? `רמת תרגול: ${normalizedLevel}` : isAr ? `مستوى التدريب: ${normalizedLevel}` : `Target Level: ${normalizedLevel}`}
          </span>
        </div>
      </div>

      {shorts.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isHe
              ? `אין סרטונים זמינים לרמה ${normalizedLevel} כרגע`
              : isAr
              ? `لا توجد مقاطع متاحة لمستوى ${normalizedLevel} حالياً`
              : `No practice shorts for Level ${normalizedLevel} yet`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isHe
              ? 'המורים מעלים סרטוני תרגול חדשים באופן שוטף, חזור לבדוק בקרוב!'
              : isAr
              ? 'يقوم المعلمون بإضافة مقاطع تدريبية جديدة بشكل دوري، تحقق مجدداً قريباً!'
              : 'Teachers upload new practice shorts regularly. Check back soon!'}
          </p>
        </div>
      ) : (
        /* Dual Layout: Adaptive Shorts Theater (Desktop side queue + Mobile TikTok Stage) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Reels Player Theater (lg:col-span-8 or 7) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
            {/* The 9:16 Mobile Smartphone Styled Stage */}
            <div
              ref={containerRef}
              className="relative w-full max-w-[390px] sm:max-w-[420px] aspect-[9/16] bg-black rounded-3xl sm:rounded-4xl overflow-hidden shadow-2xl border-4 border-slate-800/80 dark:border-slate-800 select-none"
            >
              {currentShort && (
                <>
                  {/* Google Drive Video Player Iframe */}
                  <iframe
                    key={currentShort.id}
                    src={
                      (currentShort.googleDriveId || extractDriveId(currentShort.videoUrl))
                        ? `https://drive.google.com/file/d/${currentShort.googleDriveId || extractDriveId(currentShort.videoUrl)}/preview`
                        : currentShort.videoUrl
                    }
                    allow="autoplay; fullscreen; encrypted-media"
                    className="w-full h-full border-0 absolute inset-0 z-0 pointer-events-auto"
                    title={currentShort.title}
                  />

                  {/* Gradient Overlay for Top and Bottom readability */}
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                  {/* Top Bar inside Player */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-20 pointer-events-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-black text-[11px] shadow-sm">
                        {currentShort.levelCode || 'ALL'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-mono text-[10px]">
                        {currentIndex + 1} / {shorts.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMuted((prev) => !prev)}
                      className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Big Heart Animation on Double Tap / Like */}
                  {showHeartAnim && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-ping">
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-xl" />
                    </div>
                  )}

                  {/* Right Floating Actions Column (TikTok style) */}
                  <div className="absolute bottom-16 end-3 flex flex-col items-center gap-4 z-20 pointer-events-auto">
                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(currentShort)}
                      className="flex flex-col items-center gap-0.5 group cursor-pointer"
                    >
                      <div
                        className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg transition-transform active:scale-75 ${
                          currentShort.isLiked
                            ? 'bg-rose-500 text-white scale-105'
                            : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${currentShort.isLiked ? 'fill-white' : ''}`} />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {currentShort.likeCount || 0}
                      </span>
                    </button>

                    {/* Bookmark / Save */}
                    <button
                      type="button"
                      onClick={() => handleToggleSave(currentShort)}
                      className="flex flex-col items-center gap-0.5 group cursor-pointer"
                    >
                      <div
                        className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg transition-transform active:scale-75 ${
                          currentShort.isSaved
                            ? 'bg-amber-500 text-white scale-105'
                            : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${currentShort.isSaved ? 'fill-white' : ''}`} />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {isHe ? 'שמור' : isAr ? 'حفظ' : 'Save'}
                      </span>
                    </button>

                    {/* Notes Sheet Toggle */}
                    {(currentShort.description || currentShort.descriptionHe || currentShort.descriptionAr) && (
                      <button
                        type="button"
                        onClick={() => setShowNotes((prev) => !prev)}
                        className="flex flex-col items-center gap-0.5 group cursor-pointer"
                      >
                        <div
                          className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg transition-transform active:scale-75 ${
                            showNotes ? 'bg-brand-teal-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                        >
                          <Info className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">
                          {isHe ? 'הסבר' : isAr ? 'شرح' : 'Notes'}
                        </span>
                      </button>
                    )}

                    {/* Share */}
                    <button
                      type="button"
                      onClick={() => handleShare(currentShort)}
                      className="flex flex-col items-center gap-0.5 group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform active:scale-75">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {isHe ? 'שתף' : isAr ? 'مشاركة' : 'Share'}
                      </span>
                    </button>
                  </div>

                  {/* Bottom Video Meta Info */}
                  <div className="absolute bottom-4 inset-x-3.5 z-20 pointer-events-none pr-14 rtl:pr-0 rtl:pl-14">
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                        {isHe && currentShort.titleHe
                          ? currentShort.titleHe
                          : isAr && currentShort.titleAr
                          ? currentShort.titleAr
                          : currentShort.title}
                      </h3>

                      {currentShort.titleHe && !isHe && (
                        <p className="text-xs sm:text-sm font-hebrew font-bold text-brand-olive-300 drop-shadow-md">
                          {currentShort.titleHe}
                        </p>
                      )}

                      {/* Expandable Notes Panel */}
                      {showNotes && (
                        <div className="p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs space-y-1.5 animate-fadeIn pointer-events-auto">
                          <p className="leading-relaxed">
                            {isHe && currentShort.descriptionHe
                              ? currentShort.descriptionHe
                              : isAr && currentShort.descriptionAr
                              ? currentShort.descriptionAr
                              : currentShort.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stage Navigation Arrows (Desktop / Mobile Friendly) */}
            <div className="flex items-center gap-4 mt-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
                <span>{isHe ? 'הסרטון הקודם (K)' : isAr ? 'السابق' : 'Previous (K)'}</span>
              </button>

              <button
                type="button"
                disabled={currentIndex === shorts.length - 1}
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 text-white font-bold text-xs shadow-md hover:from-brand-teal-700 hover:to-brand-teal-900 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{isHe ? 'הסרטון הבא (J)' : isAr ? 'التالي' : 'Next (J)'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Playlist Queue (Desktop / Tablet view) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isHe ? 'רשימת סרטונים לתרגול' : isAr ? 'قائمة المقاطع' : 'Practice Playlist Queue'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {shorts.length} {isHe ? 'סרטונים' : isAr ? 'فيديو' : 'videos'}
              </span>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
              {shorts.map((item, idx) => {
                const isItemActive = idx === currentIndex;
                const driveId = item.googleDriveId || extractDriveId(item.videoUrl);
                const thumb = item.thumbnailUrl || (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w400` : null);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      haptics.tap();
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isItemActive
                        ? 'bg-brand-teal-50 dark:bg-brand-teal-950/60 border-brand-teal-500/80 shadow-sm ring-1 ring-brand-teal-500/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-brand-teal-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-20 rounded-xl bg-black overflow-hidden shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-6 h-6 text-slate-600" />
                      )}
                      {isItemActive && (
                        <div className="absolute inset-0 bg-brand-teal-900/60 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black font-mono text-slate-600 dark:text-slate-300">
                          {item.levelCode || 'ALL'}
                        </span>
                        {item.durationSeconds ? (
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.durationSeconds}s
                          </span>
                        ) : null}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {isHe && item.titleHe ? item.titleHe : isAr && item.titleAr ? item.titleAr : item.title}
                      </h4>

                      {item.titleHe && !isHe && (
                        <p className="font-hebrew text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.titleHe}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentShortsFeed;
