import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Film,
  Plus,
  Play,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Heart,
  Layers,
  ChevronUp,
  ChevronDown,
  Video,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { PageHeaderBanner } from '../common/PageHeaderBanner';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';

export interface PracticeShortAdmin {
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
  levelId?: string | null;
  levelCode?: string | null;
  levelCodes?: string[];
  languageTrack?: string;
  durationSeconds?: number;
  sortOrder: number;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  tags: string[];
  level?: {
    id: string;
    code: string;
    labelEn: string;
    labelHe: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const LANGUAGE_TRACKS = [
  {
    id: 'AR_HE',
    label: 'Arabic ➔ Hebrew (من عربي لعبري)',
    native: 'عربي ← عبري',
    badge: '🇸🇦 ➔ 🇮🇱',
    color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200',
  },
  {
    id: 'HE_EN',
    label: 'Hebrew ➔ English (עברית לאנגלית)',
    native: 'عبري ← إنجليزي',
    badge: '🇮🇱 ➔ 🇬🇧',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200',
  },
  {
    id: 'AR_EN',
    label: 'Arabic ➔ English (من عربي لإنجليزي)',
    native: 'عربي ← إنجليزي',
    badge: '🇸🇦 ➔ 🇬🇧',
    color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200',
  },
  {
    id: 'ALL',
    label: 'All Tracks / General (لجميع المسارات)',
    native: 'متاح للجميع',
    badge: '🌐 ALL',
    color: 'border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
  },
];

export const AVAILABLE_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const ShortsManagementTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const isHe = language === 'he';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShort, setEditingShort] = useState<PracticeShortAdmin | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PracticeShortAdmin>>({
    title: '',
    titleHe: '',
    titleAr: '',
    description: '',
    descriptionHe: '',
    descriptionAr: '',
    videoUrl: '',
    thumbnailUrl: '',
    levelCode: 'ALL',
    levelId: null,
    durationSeconds: 30,
    sortOrder: 0,
    isActive: true,
  });

  // Fetch all levels for dropdown
  const { data: levelsData } = useQuery({
    queryKey: ['adminLevelsList'],
    queryFn: async () => {
      const res = await api.get('/levels');
      return res.data?.levels || res.data || [];
    },
  });

  // Fetch admin shorts list
  const { data: shorts = [], isLoading } = useQuery<PracticeShortAdmin[]>({
    queryKey: ['adminPracticeShorts'],
    queryFn: async () => {
      const res = await api.get('/shorts/admin/all');
      return res.data?.shorts || [];
    },
  });

  // Extract drive ID for preview
  const extractDriveId = (url: string) => {
    if (!url) return null;
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const previewDriveId = extractDriveId(formData.videoUrl || '');

  // Save / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<PracticeShortAdmin>) => {
      if (editingShort) {
        return api.put(`/shorts/${editingShort.id}`, payload);
      }
      return api.post('/shorts', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPracticeShorts'] });
      queryClient.invalidateQueries({ queryKey: ['studentPracticeShorts'] });
      setIsModalOpen(false);
      setEditingShort(null);
      resetForm();
      toast.success(
        isHe
          ? editingShort ? 'הסרטון עודכן בהצלחה' : 'הסרטון פורסם בהצלחה'
          : isAr
          ? editingShort ? 'تم تحديث المقطع بنجاح' : 'تم نشر المقطع بنجاح'
          : editingShort ? 'Short updated successfully' : 'Short created successfully'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to save practice short');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/shorts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPracticeShorts'] });
      queryClient.invalidateQueries({ queryKey: ['studentPracticeShorts'] });
      toast.success(isHe ? 'הסרטון הוסר' : isAr ? 'تم حذف المقطع' : 'Short removed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete short');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.put(`/shorts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPracticeShorts'] });
      queryClient.invalidateQueries({ queryKey: ['studentPracticeShorts'] });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      return api.post('/shorts/admin/reorder', { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPracticeShorts'] });
      queryClient.invalidateQueries({ queryKey: ['studentPracticeShorts'] });
      toast.success(isHe ? 'סדר הסרטונים נשמר' : isAr ? 'تم حفظ الترتيب' : 'Sort order updated');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      titleHe: '',
      titleAr: '',
      description: '',
      descriptionHe: '',
      descriptionAr: '',
      videoUrl: '',
      thumbnailUrl: '',
      levelCode: 'ALL',
      levelCodes: ['ALL'],
      languageTrack: 'AR_HE',
      levelId: null,
      durationSeconds: 30,
      sortOrder: (shorts.length || 0) + 1,
      isActive: true,
    });
  };

  const handleOpenAdd = () => {
    setEditingShort(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (short: PracticeShortAdmin) => {
    setEditingShort(short);
    let initialLevels = short.levelCodes || [];
    if (initialLevels.length === 0 && short.levelCode) {
      initialLevels = [short.levelCode];
    }
    if (initialLevels.length === 0) {
      initialLevels = ['ALL'];
    }
    setFormData({
      title: short.title,
      titleHe: short.titleHe || '',
      titleAr: short.titleAr || '',
      description: short.description || '',
      descriptionHe: short.descriptionHe || '',
      descriptionAr: short.descriptionAr || '',
      videoUrl: short.videoUrl,
      thumbnailUrl: short.thumbnailUrl || '',
      levelCode: short.levelCode || 'ALL',
      levelCodes: initialLevels,
      languageTrack: short.languageTrack || 'ALL',
      levelId: short.levelId || null,
      durationSeconds: short.durationSeconds || 30,
      sortOrder: short.sortOrder || 0,
      isActive: short.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (short: PracticeShortAdmin) => {
    const confirmed = await confirmDialog({
      title: 'Delete Practice Short',
      titleHe: 'מחיקת סרטון תרגול',
      message: `Are you sure you want to permanently delete "${short.title}"?`,
      messageHe: `האם אתה בטוח שברצונך למחוק את הסרטון "${short.titleHe || short.title}"?`,
      confirmText: 'Delete Permanently',
      confirmTextHe: 'מחק לצמיתות',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(short.id);
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shorts.length) return;

    const newShorts = [...shorts];
    const [moved] = newShorts.splice(index, 1);
    newShorts.splice(targetIndex, 0, moved);

    const reordered = newShorts.map((s, idx) => ({ id: s.id, sortOrder: idx + 1 }));
    reorderMutation.mutate(reordered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error(isHe ? 'אנא הזן כותרת לסרטון' : 'Title is required');
      return;
    }
    if (!formData.videoUrl?.trim()) {
      toast.error(isHe ? 'אנא הזן קישור ל-Google Drive' : 'Google Drive video link is required');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeaderBanner
        badgeIcon={Film}
        badgeText={isHe ? 'סרטונים לתרגול • Learn in Shorts' : isAr ? 'فيديوهات للتدريب • Shorts' : 'Learn in Shorts • Practice Feed'}
        statusText={`${shorts.length} ${isHe ? 'סרטונים במערכת' : isAr ? 'مقطع مسجل' : 'Shorts Active'}`}
        title={
          isHe
            ? 'ניהול סרטונים לתרגול (Shorts / Reels)'
            : isAr
            ? 'إدارة مقاطع التدريب السريعة (Learn in Shorts)'
            : 'Practice Shorts & Reels Management'
        }
        description={
          isHe
            ? 'העלה ונהל סרטוני תרגול מ-Google Drive בפורמט Reels / TikTok עם שיוך לרמות לימוד, תמונות ממוזערות וסדר הופעה לתלמידים.'
            : isAr
            ? 'أضف ونظّم مقاطع الفيديو التدريبية من Google Drive بأسلوب Reels / TikTok، وحدد المستوى الدراسي المطلوب والصورة المصغرة وترتيب العرض للطلاب.'
            : 'Manage bite-sized vertical video lessons powered by Google Drive links. Configure multi-lingual titles, CEFR levels, custom thumbnails, and live playback queues.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isHe ? 'הוסף סרטון חדש' : isAr ? 'إضافة مقطع جديد' : 'Add New Short'}</span>
            </button>
          </div>
        }
      />

      {/* Grid of Shorts */}
      {isLoading ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-teal-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">
            {isHe ? 'טוען סרטוני תרגול...' : isAr ? 'جاري تحميل المقاطع...' : 'Loading practice shorts...'}
          </p>
        </div>
      ) : shorts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-600 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isHe ? 'טרם נוספו סרטוני תרגול' : isAr ? 'لم تتم إضافة مقاطع حتى الآن' : 'No Practice Shorts Yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isHe
                ? 'לחץ על "הוסף סרטון חדש" והדבק קישור Google Drive ליצירת סרטון התרגול הראשון.'
                : isAr
                ? 'اضغط على "إضافة مقطع جديد" وألصق رابط Google Drive لإنشاء أول مقطع تيك توك تعليمي.'
                : 'Click "Add New Short" to paste your first Google Drive video link and publish it to the student feed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isHe ? 'הוסף סרטון ראשון' : isAr ? 'أضف أول مقطع' : 'Create First Short'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shorts.map((short, idx) => {
            const driveId = short.googleDriveId || extractDriveId(short.videoUrl);
            const thumbUrl =
              short.thumbnailUrl ||
              (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800` : null);

            return (
              <div
                key={short.id}
                className={`group rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  short.isActive
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60 opacity-75'
                }`}
              >
                {/* Thumbnail / Video Preview Area (9:16 Aspect ratio container) */}
                <div className="relative aspect-[9/14] bg-slate-950 overflow-hidden flex items-center justify-center">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={short.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 z-10 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono font-bold text-[10px]">
                      #{short.sortOrder || idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      {short.languageTrack && short.languageTrack !== 'ALL' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600/90 text-white font-bold text-[10px] shadow-xs">
                          {short.languageTrack === 'AR_HE' ? '🇸🇦 AR➔HE' : short.languageTrack === 'HE_EN' ? '🇮🇱 HE➔EN' : '🇸🇦 AR➔EN'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-black text-[10px] shadow-xs">
                        {short.levelCodes && short.levelCodes.length > 0 ? short.levelCodes.join(', ') : short.levelCode || 'ALL'}
                      </span>
                    </div>
                  </div>

                  {/* Center Play Button (Triggers Video Preview Modal) */}
                  <button
                    type="button"
                    onClick={() => {
                      const finalUrl = driveId
                        ? `https://drive.google.com/file/d/${driveId}/preview`
                        : short.videoUrl;
                      setPreviewVideoUrl(finalUrl);
                    }}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95 cursor-pointer z-10"
                    title={isHe ? 'צפה בתצוגה מקדימה' : 'Preview Short'}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  {/* Bottom Video Meta info */}
                  <div className="absolute bottom-2.5 inset-x-2.5 text-white z-10 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1 font-mono">
                        <Eye className="w-3 h-3 text-brand-teal-400" />
                        {short.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                        {short.likeCount || 0}
                      </span>
                      {short.durationSeconds ? (
                        <span className="font-mono text-[10px] text-slate-400 ml-auto">
                          {short.durationSeconds}s
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                      {isHe && short.titleHe ? short.titleHe : isAr && short.titleAr ? short.titleAr : short.title}
                    </h4>

                    {short.titleHe && !isHe && (
                      <p className="font-hebrew text-xs text-brand-olive-300 truncate">
                        {short.titleHe}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  {/* Order adjustment buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={isHe ? 'הזז למעלה' : 'Move Up'}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === shorts.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={isHe ? 'הזז למטה' : 'Move Down'}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Active status pill */}
                  <button
                    type="button"
                    onClick={() => toggleActiveMutation.mutate({ id: short.id, isActive: !short.isActive })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                      short.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {short.isActive ? (isHe ? 'פעיל' : 'Active') : (isHe ? 'טיוטה' : 'Draft')}
                  </button>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(short)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-teal-600 dark:hover:text-teal-400 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-950/60 transition-colors"
                      title={isHe ? 'ערוך' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(short)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      title={isHe ? 'מחק' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Short Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950 text-brand-teal-600 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingShort
                      ? isHe ? 'עריכת סרטון תרגול' : isAr ? 'تعديل مقطع تدريبي' : 'Edit Practice Short'
                      : isHe ? 'הוספת סרטון תרגול חדש' : isAr ? 'إضافة مقطع تدريبي جديد' : 'Add New Practice Short'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isHe ? 'הגדר קישור Google Drive, כותרות ומستوى לימוד' : 'Configure Google Drive link, multilingual titles, and level'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google Drive Video URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isHe ? 'קישור וידאו מ-Google Drive *' : 'Google Drive Video Link *'}
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/1A2b3C4d.../view?usp=sharing"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-teal-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>
                    {isHe
                      ? 'וודא שהרשאות השיתוף בדרייב מוגדרות ל-"כל מי שיש לו את הקישור יכול לצפות"'
                      : 'Ensure file permission in Google Drive is set to "Anyone with the link can view"'}
                  </span>
                </p>
              </div>

              {/* Live Google Drive Preview Box if Drive ID detected */}
              {previewDriveId && (
                <div className="p-3 rounded-2xl bg-brand-teal-50/50 dark:bg-brand-teal-950/40 border border-brand-teal-200/60 dark:border-brand-teal-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-brand-teal-900 dark:text-brand-teal-200 block">
                        Google Drive File ID: {previewDriveId}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isHe ? 'זוהה בהצלחה. תמונה ממוזערת תיווצר אוטומטית.' : 'Successfully recognized. Preview & thumbnail ready.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(`https://drive.google.com/file/d/${previewDriveId}/preview`)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 text-brand-teal-700 dark:text-teal-300 border border-brand-teal-200 dark:border-brand-teal-700 text-[11px] font-bold rounded-lg shadow-2xs hover:bg-brand-teal-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isHe ? 'בדוק נגינה' : 'Test Player'}</span>
                  </button>
                </div>
              )}

              {/* Multilingual Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Hebrew Greetings"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-hebrew">
                    כותרת (עברית)
                  </label>
                  <input
                    type="text"
                    placeholder="לדוגמה: ברכות יומיומיות בעברית"
                    value={formData.titleHe || ''}
                    onChange={(e) => setFormData({ ...formData, titleHe: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-hebrew"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    العنوان (عربي)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: أهم التحيات والتعابير اليومية"
                    value={formData.titleAr || ''}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Target Language Track (المسار التعليمي واللغة المستهدفة) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isHe ? 'מסלול שפה ויעד לומדים (Language Track) *' : isAr ? 'المسار التعليمي واللغة المستهدفة *' : 'Target Audience / Language Track *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LANGUAGE_TRACKS.map((track) => {
                    const isSelected = (formData.languageTrack || 'ALL') === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, languageTrack: track.id })}
                        className={`p-2.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-1 active:scale-95 ${
                          isSelected
                            ? 'ring-2 ring-brand-teal-500 border-brand-teal-500 bg-brand-teal-50/70 dark:bg-brand-teal-950/60 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{track.badge}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal-600" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">
                            {track.native}
                          </p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                            {track.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target CEFR Levels (Multi-select) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isHe ? 'רמות יעד (בחר רמה אחת או יותר) *' : isAr ? 'المستويات المستهدفة (اختر مستوى أو أكثر) *' : 'Target Levels (Multi-level Selection) *'}
                  </label>
                  <span className="text-[10px] text-brand-teal-600 dark:text-teal-400 font-bold">
                    {formData.levelCodes && formData.levelCodes.includes('ALL')
                      ? (isHe ? 'כל הרמות נבחרו' : isAr ? 'جميع المستويات' : 'All Levels')
                      : formData.levelCodes && formData.levelCodes.length > 0
                      ? formData.levelCodes.join(' • ')
                      : 'All Levels'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {/* "ALL" Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        levelCodes: ['ALL'],
                        levelCode: 'ALL',
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      (formData.levelCodes || []).includes('ALL')
                        ? 'bg-brand-teal-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isHe ? 'כל הרמות (All)' : isAr ? 'جميع المستويات' : 'All Levels'}
                  </button>

                  {/* Individual Level Pills (A1, A2, B1, B2, C1, C2) */}
                  {AVAILABLE_CEFR_LEVELS.map((lvl) => {
                    const currentCodes = (formData.levelCodes || []).filter((c) => c !== 'ALL');
                    const isSelected = currentCodes.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          let updated: string[];
                          if (isSelected) {
                            updated = currentCodes.filter((c) => c !== lvl);
                            if (updated.length === 0) updated = ['ALL'];
                          } else {
                            updated = [...currentCodes, lvl];
                          }
                          setFormData({
                            ...formData,
                            levelCodes: updated,
                            levelCode: updated[0] || 'ALL',
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-brand-teal-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{lvl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isHe ? 'משך משוער (בשניות)' : 'Duration (Seconds)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={formData.durationSeconds || 30}
                    onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isHe ? 'מספר סדר הופעה' : 'Sort Order Sequence'}
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder || 0}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Custom Thumbnail URL (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isHe ? 'קישור תמונה ממוזערת מותאמת (אופציונלי)' : 'Custom Thumbnail URL (Optional)'}
                </label>
                <input
                  type="url"
                  placeholder="https://... (Leave blank to auto-generate from Google Drive)"
                  value={formData.thumbnailUrl || ''}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="shortIsActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-brand-teal-600 focus:ring-brand-teal-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="shortIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isHe ? 'פרסם כסרטון פעיל (מוצג לתלמידים מיד)' : 'Publish as Active (Visible immediately in student feed)'}
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  {isHe ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isHe ? 'שומר...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{editingShort ? (isHe ? 'שמור שינויים' : 'Save Changes') : (isHe ? 'פרסם סרטון' : 'Publish Short')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal (Simulates Google Drive Iframe) */}
      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-3 end-3 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={previewVideoUrl}
              allow="autoplay; fullscreen; encrypted-media"
              className="w-full h-full border-0"
              title="Short Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortsManagementTab;
