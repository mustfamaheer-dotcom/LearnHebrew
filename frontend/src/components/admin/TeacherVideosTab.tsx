import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video,
  Plus,
  Play,
  Trash2,
  Edit2,
  ExternalLink,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Star,
  Users,
  Film,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { PageHeaderBanner } from '../common/PageHeaderBanner';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';
import { getAvatarUrl, processImageToWebP } from '../../utils/avatar';

export interface TeacherVideo {
  id: string;
  teacherId?: string;
  teacherName: string;
  teacherNameHe?: string;
  teacherNameAr?: string;
  avatarUrl?: string;
  title: string;
  titleHe?: string;
  titleAr?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  specialtyEn?: string;
  specialtyHe?: string;
  specialtyAr?: string;
  rating?: string;
  lessonsCount?: number;
  bioEn?: string;
  bioHe?: string;
  bioAr?: string;
  badges?: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
}

export const TeacherVideosTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TeacherVideo | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Form State
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<TeacherVideo>>({
    teacherName: '',
    teacherNameHe: '',
    teacherNameAr: '',
    avatarUrl: '',
    title: '',
    titleHe: '',
    titleAr: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '0:45',
    specialtyEn: 'Native Hebrew Mentor',
    specialtyHe: 'מנטור מוסמך לעברית מדוברת',
    specialtyAr: 'معلم معتمد للعبرية المعاصرة',
    rating: '5.0',
    lessonsCount: 150,
    bioEn: '',
    bioHe: '',
    bioAr: '',
    badges: ['Native Speaker', 'Certified Mentor'],
    isActive: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Platform Teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<any[]>({
    queryKey: ['teachersListForVideos'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      return res.data?.teachers || [];
    },
  });

  // Fetch Teacher Videos
  const { data: videosData, isLoading } = useQuery<{ videos: TeacherVideo[] }>({
    queryKey: ['teacher-videos'],
    queryFn: async () => {
      const res = await api.get('/settings/teacher-videos');
      return res.data;
    },
  });

  const videos = videosData?.videos || [];

  // Add/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<TeacherVideo>) => {
      if (editingVideo?.id) {
        // Update existing in full list
        const updatedList = videos.map((v) => (v.id === editingVideo.id ? { ...v, ...payload } : v));
        return api.put('/settings/teacher-videos', { videos: updatedList });
      } else {
        return api.post('/settings/teacher-videos', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-videos'] });
      toast.success(
        language === 'he'
          ? 'סרטון המורה נשמר בהצלחה!'
          : isAr
          ? 'تم حفظ فيديو المعلم بنجاح!'
          : 'Teacher video saved successfully!'
      );
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error ||
          (language === 'he' ? 'שגיאה בשמירת הסרטון' : 'Failed to save teacher video')
      );
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/settings/teacher-videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-videos'] });
      toast.success(
        language === 'he' ? 'הסרטון הוסר בהצלחה' : isAr ? 'تم حذف الفيديو' : 'Video deleted successfully'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete video');
    },
  });

  // Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const updatedList = videos.map((v) => (v.id === id ? { ...v, isActive } : v));
      return api.put('/settings/teacher-videos', { videos: updatedList });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-videos'] });
    },
  });

  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setFormData({
      teacherName: '',
      teacherNameHe: '',
      teacherNameAr: '',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      title: 'Modern Hebrew Conversation & Accent',
      titleHe: 'שיחה חופשית, דקדוק וביטחון בדיבור',
      titleAr: 'محادثة وتحدث بالعبرية بطلاقة وثقة',
      videoUrl: '',
      thumbnailUrl: '',
      duration: '0:45',
      specialtyEn: 'Conversational Hebrew Specialist',
      specialtyHe: 'הוראת עברית מדוברת והגייה',
      specialtyAr: 'العبرية المحادثية والنطق السليم',
      rating: '5.0',
      lessonsCount: 150,
      bioEn: 'Dedicated certified teacher ready to guide you step-by-step to fluency.',
      bioHe: 'מורה מוסמך ומסור להובלתכם לשיחה שוטפת וביטחון מלא.',
      bioAr: 'معلم متميز لمساعدتك على التحدث بثقة وسلاسة من الدرس الأول.',
      badges: ['Native Speaker', 'Top Rated'],
      isActive: true,
    });
    setSourceType('upload');
    setVideoFile(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: TeacherVideo) => {
    setEditingVideo(video);
    setFormData({ ...video });
    setSourceType(video.videoUrl.startsWith('https://engrew.com/uploads/') ? 'upload' : 'url');
    setVideoFile(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
    setVideoFile(null);
    setUploadProgress(null);
    setIsUploading(false);
  };

  // Avatar file upload & WebP conversion
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webpDataUrl = await processImageToWebP(file, 400, 0.9);
      setFormData((prev) => ({ ...prev, avatarUrl: webpDataUrl }));
      toast.success(
        language === 'he' ? 'תמונת הפרופיל עודכנה בהצלחה' : isAr ? 'تم تحديث الصورة الشخصية' : 'Avatar updated'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to process avatar');
    }
  };

  // Auto-fill from selected platform teacher
  const handleSelectTeacher = (teacherId: string) => {
    if (!teacherId || teacherId === 'custom') {
      setFormData((prev) => ({
        ...prev,
        teacherId: undefined,
      }));
      return;
    }

    const teacher = teachers.find((t: any) => t.id === teacherId);
    if (!teacher) return;

    const fullName =
      `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim() ||
      teacher.user?.email ||
      '';
    const avatar = teacher.user?.avatarUrl || '';
    const specialtiesText =
      Array.isArray(teacher.specialties) && teacher.specialties.length > 0
        ? teacher.specialties.join(', ')
        : 'Conversational Hebrew Specialist';
    const ratingVal =
      teacher.ratingAvg && teacher.ratingAvg > 0 ? Number(teacher.ratingAvg).toFixed(1) : '5.0';

    setFormData((prev) => ({
      ...prev,
      teacherId: teacher.id,
      teacherName: fullName,
      avatarUrl: avatar || prev.avatarUrl,
      specialtyEn: specialtiesText,
      rating: ratingVal,
      lessonsCount: teacher._count?.lessons || prev.lessonsCount || 120,
      bioEn: teacher.bio || prev.bioEn,
    }));
  };

  // Video File Selection & Automatic Canvas Thumbnail Generation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);

    // Auto extract thumbnail from video frame using HTML5 video + canvas
    const url = URL.createObjectURL(file);
    const videoElem = document.createElement('video');
    videoElem.src = url;
    videoElem.currentTime = 1.0;
    videoElem.muted = true;
    videoElem.playsInline = true;

    videoElem.onloadeddata = () => {
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoElem.videoWidth || 640;
          canvas.height = videoElem.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
            const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (!formData.thumbnailUrl) {
              setFormData((prev) => ({ ...prev, thumbnailUrl: thumbDataUrl }));
            }
          }
        } catch {
          // Ignore canvas security errors
        }
      }, 300);

      // Extract duration formatted
      if (videoElem.duration && !isNaN(videoElem.duration)) {
        const mins = Math.floor(videoElem.duration / 60);
        const secs = Math.floor(videoElem.duration % 60);
        const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        setFormData((prev) => ({ ...prev, duration: durationStr }));
      }
    };
  };

  // Direct Upload to Server
  const handleUploadFile = async (): Promise<string | null> => {
    if (!videoFile) return formData.videoUrl || null;

    setIsUploading(true);
    setUploadProgress(10);

    const uploadFormData = new FormData();
    uploadFormData.append('video', videoFile);

    try {
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90);
            setUploadProgress(pct);
          }
        });

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                if (res.success && res.url) {
                  setUploadProgress(100);
                  resolve(res);
                } else {
                  reject(new Error(res.error || 'Server rejected video file'));
                }
              } catch (parseErr) {
                reject(new Error('Invalid response from upload server'));
              }
            } else {
              reject(new Error(`Server error: HTTP ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during video upload'));
      });

      xhr.open('POST', 'https://engrew.com/api/upload-video.php', true);
      xhr.send(uploadFormData);

      const result = await uploadPromise;
      return result.url;
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teacherName?.trim()) {
      toast.error(language === 'he' ? 'אנא הזן את שם המורה' : 'Please enter the teacher name');
      return;
    }

    let finalVideoUrl = formData.videoUrl;

    if (sourceType === 'upload' && videoFile) {
      const uploadedUrl = await handleUploadFile();
      if (!uploadedUrl) return;
      finalVideoUrl = uploadedUrl;
    }

    if (!finalVideoUrl?.trim()) {
      toast.error(language === 'he' ? 'אנא בחר קובץ וידאו או הזן קישור' : 'Please upload a video or provide a video URL');
      return;
    }

    saveMutation.mutate({
      ...formData,
      videoUrl: finalVideoUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeaderBanner
        badgeIcon={Video}
        badgeText={language === 'he' ? 'סרטוני מורים ופרופילים' : isAr ? 'فيديوهات المعلمين' : 'Teacher Video Showcase'}
        statusText="Landing Page Active"
        title={
          language === 'he'
            ? 'פרסום סרטוני מורים לדף הבית'
            : isAr
            ? 'نشر واستعراض فيديوهات المعلمين'
            : 'Post Teacher Video & Landing Showcase'
        }
        description={
          language === 'he'
            ? 'העלה סרטוני היכרות קצרים של המורים המוסמכים, הצג את המומחיות והדירוג שלהם ישירות בדף הנחיתה לשיפור ההמרות וקביעת שיעורים.'
            : isAr
            ? 'ارفع فيديوهات تعريفية قصيرة للمعلمين المعتمدين واعرض تخصصاتهم وتقييماتهم في الصفحة الرئيسية لجذب الطلاب وحجز الحصص.'
            : 'Upload short introduction videos of certified teachers to showcase their accents, credentials, and teaching style on the public landing page.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/#teachers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-brand-teal-300" />
              <span>{language === 'he' ? 'צפה בדף הבית' : 'View on Landing'}</span>
            </a>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{language === 'he' ? 'הוסף סרטון מורה חדש' : isAr ? '+ إضافة فيديو معلم' : '+ Post Teacher Video'}</span>
            </button>
          </div>
        }
      />

      {/* Videos Grid */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-teal-500 animate-spin" />
          <span className="text-xs text-slate-500 font-bold">
            {language === 'he' ? 'טוען סרטוני מורים...' : 'Loading teacher videos...'}
          </span>
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-600 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {language === 'he' ? 'טרם פורסמו סרטוני מורים' : 'No teacher videos posted yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {language === 'he'
                ? 'פרסם את הסרטון הראשון להצגת המורים בדף הבית עם ניגון מהיר ואופטימיזציה מלאה לרשת.'
                : 'Upload your first teacher video to showcase certified native mentors on the public landing page.'}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'he' ? 'העלה סרטון ראשון' : 'Post First Video'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                vid.isActive
                  ? 'border-slate-200/90 dark:border-slate-800'
                  : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Video Thumbnail with Play Button */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden group/thumb">
                  {vid.thumbnailUrl ? (
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.teacherName}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-teal-950 to-slate-900">
                      <Film className="w-12 h-12 text-teal-700/60" />
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(vid.videoUrl)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={language === 'he' ? 'נגן סרטון תצוגה' : 'Play video preview'}
                  >
                    <Play className="w-5 h-5 fill-slate-950 ms-0.5" />
                  </button>

                  {/* Duration Pill */}
                  {vid.duration && (
                    <span className="absolute bottom-2.5 end-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                      {vid.duration}
                    </span>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2.5 start-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: vid.id, isActive: !vid.isActive })
                      }
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow-xs cursor-pointer ${
                        vid.isActive
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-700/80 text-slate-200'
                      }`}
                    >
                      {vid.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{vid.isActive ? (language === 'he' ? 'מוצג באתר' : 'Active') : (language === 'he' ? 'מוסתר' : 'Hidden')}</span>
                    </button>
                  </div>
                </div>

                {/* Teacher Info */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(vid.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={vid.teacherName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-teal-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {language === 'he' && vid.teacherNameHe ? vid.teacherNameHe : isAr && vid.teacherNameAr ? vid.teacherNameAr : vid.teacherName}
                      </h4>
                      <p className="text-[11px] text-brand-teal-700 dark:text-teal-400 font-bold truncate">
                        {language === 'he' && vid.specialtyHe ? vid.specialtyHe : isAr && vid.specialtyAr ? vid.specialtyAr : vid.specialtyEn}
                      </p>
                    </div>
                    {vid.rating && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{vid.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Video Title */}
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {language === 'he' && vid.titleHe ? vid.titleHe : isAr && vid.titleAr ? vid.titleAr : vid.title}
                  </h5>

                  {/* Badges */}
                  {vid.badges && vid.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {vid.badges.map((b, bIdx) => (
                        <span
                          key={bIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewVideoUrl(vid.videoUrl)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{language === 'he' ? 'צפה' : 'Preview'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(vid)}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-teal-600 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                    title={language === 'he' ? 'ערוך סרטון' : 'Edit video'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const teacherDisplayName =
                        language === 'he' && vid.teacherNameHe
                          ? vid.teacherNameHe
                          : isAr && vid.teacherNameAr
                          ? vid.teacherNameAr
                          : vid.teacherName;
                      const confirmed = await confirmDialog({
                        title: 'Delete Teacher Video',
                        titleHe: 'מחיקת סרטון מורה',
                        message: `Are you sure you want to permanently remove the video for "${teacherDisplayName}"? It will no longer appear on the landing page showcase.`,
                        messageHe: `האם אתה בטוח שברצונך למחוק לצמיתות את סרטון ההיכרות של "${teacherDisplayName}"? הוא יוסר מדף הבית.`,
                        confirmText: 'Delete Video',
                        confirmTextHe: 'מחק סרטון',
                        variant: 'danger',
                      });
                      if (confirmed) {
                        deleteMutation.mutate(vid.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title={language === 'he' ? 'מחק סרטון' : 'Delete video'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-olive-500/20 border border-brand-olive-400/30 text-brand-olive-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingVideo
                      ? language === 'he'
                        ? 'עריכת סרטון מורה'
                        : 'Edit Teacher Video'
                      : language === 'he'
                      ? 'הוספת סרטון מורה חדש'
                      : 'Post New Teacher Video'}
                  </h3>
                  <p className="text-xs text-brand-teal-200">
                    {language === 'he'
                      ? 'הסרטון יוצג ישירות בדף הבית עם ניגון מהיר ואיכותי'
                      : 'The video will be displayed in the teacher showcase on the landing page'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Source Type Selector: Upload vs Direct URL */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'he' ? 'מקור הסרטון' : 'Video Source'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      sourceType === 'upload'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'העלאת קובץ וידאו לשרת' : 'Upload Video File to Server'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('url')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      sourceType === 'url'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'קישור וידאו ישיר / יוטיוב' : 'Direct Video URL / Embed'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Input Area */}
              {sourceType === 'upload' ? (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-brand-teal-500/40 hover:border-brand-teal-500 bg-brand-teal-50/20 dark:bg-brand-teal-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-brand-teal-500/10 text-brand-teal-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    {videoFile ? (
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          {videoFile.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {formData.duration || 'Ready to upload'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          {language === 'he'
                            ? 'לחץ לבחירת קובץ וידאו מהמחשב'
                            : 'Click to select video file (MP4, WebM, MOV, MKV...)'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'he'
                            ? 'הקובץ נשמר בשרת engrew.com ומותאם לנגינה חלקה באתר'
                            : 'Stored on engrew.com storage, web-optimized for fast response'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar when uploading */}
                  {isUploading && uploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{language === 'he' ? 'מעלה סרטון לשרת...' : 'Uploading video to server...'}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-teal-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {formData.videoUrl && (
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 break-all">
                      ✓ Current URL: {formData.videoUrl}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'כתובת וידאו ישירה (URL / MP4 / WebM / Drive / YouTube)' : 'Direct Video URL / Embed'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://... or https://engrew.com/uploads/videos/..."
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-brand-teal-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Choose from Platform Teachers Card */}
              <div className="p-4 rounded-2xl bg-brand-teal-50/70 dark:bg-brand-teal-950/30 border border-brand-teal-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-teal-700 dark:text-teal-300" />
                    <label className="block text-xs font-black uppercase tracking-wider text-brand-teal-950 dark:text-teal-200">
                      {language === 'he'
                        ? 'בחר מורה קיים מהפלטפורמה'
                        : isAr
                        ? 'اختر معلماً مسجلاً في المنصة'
                        : 'Choose from Platform Teachers'}
                    </label>
                  </div>
                  {formData.teacherId && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ✓ {language === 'he' ? 'מקושר לחשבון מורה' : isAr ? 'مرتبط بحساب المعلم' : 'Linked to Platform Teacher'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-brand-teal-500/30 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    {formData.avatarUrl ? (
                      <img
                        src={getAvatarUrl(formData.avatarUrl)}
                        alt={formData.teacherName || 'Teacher'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Users className="w-6 h-6 text-brand-teal-600 dark:text-teal-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <select
                      value={formData.teacherId || (editingVideo && !formData.teacherId ? 'custom' : '')}
                      onChange={(e) => handleSelectTeacher(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-teal-500 focus:outline-none"
                    >
                      <option value="">
                        {isLoadingTeachers
                          ? language === 'he'
                            ? 'טוען רשימת מורים...'
                            : 'Loading teachers...'
                          : language === 'he'
                          ? '-- בחר מורה מתוך המערכת (מילוי פרטים אוטומטי) --'
                          : isAr
                          ? '-- اختر معلماً مسجلاً في المنصة (تعبئة تلقائية) --'
                          : '-- Select registered teacher from platform (Auto-fills) --'}
                      </option>
                      {teachers.map((t: any) => {
                        const tName =
                          `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() ||
                          t.user?.email ||
                          'Teacher';
                        return (
                          <option key={t.id} value={t.id}>
                            {tName} {t.user?.email ? `(${t.user.email})` : ''}
                          </option>
                        );
                      })}
                      <option value="custom">
                        {language === 'he'
                          ? '✏️ הזנה ידנית / מורה מותאם אישית'
                          : isAr
                          ? '✏️ إدخال يدوي / معلم مخصص'
                          : '✏️ Custom / Manual Teacher Entry'}
                      </option>
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'he'
                        ? 'בחירת מורה תייבא באופן אוטומטי את השם, תמונת הפרופיל, תחומי המומחיות והדירוג ישירות מהחשבון שלו.'
                        : isAr
                        ? 'اختيار المعلم سيقوم بتعبئة الاسم وصورة البروفايل والتخصص والتقييم تلقائياً من حسابه في المنصة.'
                        : 'Selecting a teacher automatically imports their name, avatar, specialties, and rating from their profile.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Teacher Names (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'שם המורה (אנגלית)' : 'Teacher Name (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Noa Ben-David"
                    value={formData.teacherName || ''}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'שם המורה (עברית)' : 'Teacher Name (Hebrew)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="נועה בן-דוד"
                    value={formData.teacherNameHe || ''}
                    onChange={(e) => setFormData({ ...formData, teacherNameHe: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'שם המורה (ערבית)' : 'Teacher Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="نوعا بن دافيد"
                    value={formData.teacherNameAr || ''}
                    onChange={(e) => setFormData({ ...formData, teacherNameAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Video Title (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'כותרת הסרטון (אנגלית)' : 'Video Title (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Modern Conversational Hebrew with Native Fluency"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'כותרת הסרטון (עברית)' : 'Video Title (Hebrew)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="עברית מדוברת יומיומית בביטחון מלא"
                    value={formData.titleHe || ''}
                    onChange={(e) => setFormData({ ...formData, titleHe: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* Specialty & Duration & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'מומחיות / תחום (Specialty)' : 'Specialty'}
                  </label>
                  <input
                    type="text"
                    placeholder="Conversational & Accent"
                    value={formData.specialtyEn || ''}
                    onChange={(e) => setFormData({ ...formData, specialtyEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'אורך הסרטון (Duration)' : 'Duration'}
                  </label>
                  <input
                    type="text"
                    placeholder="0:45"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'דירוג מורה (Rating)' : 'Rating'}
                  </label>
                  <input
                    type="text"
                    placeholder="5.0"
                    value={formData.rating || ''}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Avatar & Thumbnail URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'he' ? 'תמונת פרופיל מורה (Avatar URL)' : 'Teacher Avatar URL'}
                    </label>
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="text-[10px] font-bold text-brand-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{language === 'he' ? 'העלאת תמונה' : isAr ? 'رفع صورة' : 'Upload photo'}</span>
                    </button>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {formData.avatarUrl ? (
                        <img
                          src={getAvatarUrl(formData.avatarUrl)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Users className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="https://... or upload photo"
                      value={formData.avatarUrl || ''}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'he' ? 'תמונת שער לסרטון (Thumbnail Poster)' : 'Video Poster / Thumbnail URL'}
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.thumbnailUrl || ''}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-teal-600 focus:ring-brand-teal-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'הצג סרטון זה כפעיל בדף הבית' : 'Display this teacher video on public landing page'}
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saveMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'he' ? 'שומר סרטון...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{editingVideo ? (language === 'he' ? 'עדכן סרטון' : 'Update Video') : (language === 'he' ? 'שמור ופרסם סרטון' : 'Post Video')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-3 end-3 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
