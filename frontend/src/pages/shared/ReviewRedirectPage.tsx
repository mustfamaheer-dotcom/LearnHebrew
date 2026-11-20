import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reviewLinksApi } from '../../lib/enterpriseApi';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { triggerConfetti } from '../../utils/confetti';
import {
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Loader2,
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Send,
  Languages,
  BookOpen,
} from 'lucide-react';

export const ReviewRedirectPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language, setLanguage } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  const isHe = language === 'he';
  const isAr = language === 'ar';
  const isRtl = isHe || isAr;
  const loc = (ar: string, he: string, en: string) => (isAr ? ar : isHe ? he : en);

  // Verification state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<{
    valid: boolean;
    targetUrl: string;
    label?: string;
    usageCount?: number;
    submissionsCount?: number;
  } | null>(null);

  // Form State
  const [reviewerName, setReviewerName] = useState(() => {
    return currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : '';
  });
  const [reviewerEmail, setReviewerEmail] = useState(() => currentUser?.email || '');
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [teachingRating, setTeachingRating] = useState<number>(5);
  const [platformRating, setPlatformRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [recommend, setRecommend] = useState<boolean>(true);
  const [allowPublicShare, setAllowPublicShare] = useState<boolean>(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. Validate Link on Mount
  useEffect(() => {
    if (!token) {
      setError(loc('رابط التقييم غير صالح أو مفقود.', 'קישור משוב אינו תקין או חסר.', 'Invalid or missing review link invitation.'));
      setLoading(false);
      return;
    }

    reviewLinksApi
      .redeem(token)
      .then((res) => {
        setLinkData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            loc(
              'تعذر التحقق من رابط التقييم. قد يكون منتهي الصلاحية.',
              'לא ניתן לאמת את קישור המשוב. ייתכן שפג תוקפו.',
              'Unable to verify this review link invitation. It may have expired.'
            )
        );
        setLoading(false);
      });
  }, [token]);

  // Star Rating Text Helper
  const getRatingFeedback = (stars: number) => {
    switch (stars) {
      case 5:
        return loc('⭐⭐⭐⭐⭐ 5 من 5 - تجربة استثنائية وممتازة!', '⭐⭐⭐⭐⭐ 5 מתוך 5 - חוויה יוצאת דופן ומצוינת!', '⭐⭐⭐⭐⭐ 5 of 5 - Outstanding & Exceptional Experience!');
      case 4:
        return loc('⭐⭐⭐⭐ 4 من 5 - تجربة رائعة ودروس مفيدة جداً', '⭐⭐⭐⭐ 4 מתוך 5 - חוויה נהדרת ושיעורים מועילים מאוד', '⭐⭐⭐⭐ 4 of 5 - Very Good & Highly Beneficial');
      case 3:
        return loc('⭐⭐⭐ 3 من 5 - جيدة، تلبي التوقعات الأساسية', '⭐⭐⭐ 3 מתוך 5 - טובה, עמדה בציפיות', '⭐⭐⭐ 3 of 5 - Good, Met Expectations');
      case 2:
        return loc('⭐⭐ 2 من 5 - مقبولة، تحتاج إلى بعض التحسينات', '⭐⭐ 2 מתוך 5 - סבירה, דורשת שיפור', '⭐⭐ 2 of 5 - Fair, Needs Some Improvements');
      case 1:
        return loc('⭐ 1 من 5 - غير راضٍ عن التجربة', '⭐ 1 מתוך 5 - לא מרוצה מהחוויה', '⭐ 1 of 5 - Unsatisfied with Experience');
      default:
        return '';
    }
  };

  // Submit Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!overallRating || overallRating < 1) {
      toast.warning(loc('يرجى اختيار التقييم العام (1-5 نجوم).', 'אנא בחר דירוג כללי (1–5 כוכבים).', 'Please select an overall rating (1–5 stars).'));
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewLinksApi.submit(token, {
        reviewerName: reviewerName.trim() || 'Verified Student',
        reviewerEmail: reviewerEmail.trim() || undefined,
        rating: overallRating,
        teachingRating,
        platformRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim() || undefined,
        recommend,
        allowPublicShare,
      });

      triggerConfetti.celebrate();
      setIsSubmitted(true);
      toast.success(
        loc('شكراً لك! تم تسجيل تقييمك المعتمد بنجاح.', 'תודה רבה! המשוב המאומת שלך נרשם בהצלחה.', 'Thank you! Your verified review has been submitted successfully.')
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          loc('حدث خطأ أثناء إرسال التقييم. يرجى المحاولة مرة أخرى.', 'שגיאה בשמירת המשוב. אנא נסה שוב.', 'Failed to submit review. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Brand Bar */}
      <header className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-brand-olive-300" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-base tracking-tight block">Engrew</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold -mt-1 block">
                {loc('أكاديمية اللغة العبرية والإنجليزية', 'האקדמיה לעברית ואנגלית', 'Hebrew & English Academy')}
              </span>
            </div>
          </Link>

          {/* Language Switcher Pill */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${isAr ? 'bg-white dark:bg-slate-700 text-brand-teal-700 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLanguage('he')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${isHe ? 'bg-white dark:bg-slate-700 text-brand-teal-700 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              עברית
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-colors {!isAr && !isHe ? 'bg-white dark:bg-slate-700 text-brand-teal-700 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 py-8 sm:py-12">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-teal-700 animate-spin mx-auto" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {loc('جارٍ التحقق من دعوة التقييم المعتمدة...', 'מאמת הזמנת משוב מאובטחת...', 'Verifying Verified Review Invitation...')}
            </h2>
            <p className="text-xs text-slate-500">
              {loc('تأمين الوصول المعتمد لإرسال رأيك وملاحظاتك بأمان.', 'מאבטח גישה ישירה להגשת משוב אמין באקדמיה.', 'Securing authenticated access to submit authentic feedback.')}
            </p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/70 text-red-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-500/10">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {loc('رابط التقييم غير متاح حالياً', 'קישור המשוב אינו זמין', 'Review Link Unavailable')}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{error}</p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <span>{loc('العودة إلى الصفحة الرئيسية', 'חזרה לדף הבית', 'Return to Homepage')}</span>
              </Link>
            </div>
          </div>
        ) : isSubmitted ? (
          /* SUCCESS STATE */
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-block">
                {loc('تم تسجيل التقييم بنجاح', 'המשוב נרשם בהצלחה', 'Verified Review Recorded')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {loc('شكراً لك على تقييمك القيّم!', 'תודה רבה על המשוב החשוב שלך!', 'Thank You for Your Valuable Feedback!')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {loc(
                  'تساعد ملاحظاتك الصادقة فريق معلمين إنجرو المعتمدين على تحسين تجربة التعليم باستمرار.',
                  'המשוב הכן שלך מסייע למורי האקדמיה המוסמכים לשפר את חוויית הלמידה עבור כל התלמידים.',
                  'Your authentic review helps certified Engrew tutors continuously elevate language fluency for learners everywhere.'
                )}
              </p>
            </div>

            {/* If targetUrl is an external review site like Trustpilot or Google Reviews */}
            {linkData?.targetUrl && !linkData.targetUrl.includes('localhost') && !linkData.targetUrl.endsWith('/reviews') && (
              <div className="pt-2">
                <a
                  href={linkData.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold hover:opacity-90 shadow-sm transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{loc('مشاركة التقييم أيضاً عبر المنصة الخارجية', 'שתף את הביקורת גם באתר החיצוני', 'Also Share on External Review Site')}</span>
                </a>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setReviewTitle('');
                  setReviewComment('');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition"
              >
                {loc('إرسال تقييم إضافي', 'שלח משוב נוסף', 'Submit Another Response')}
              </button>
              <Link
                to="/"
                className="px-6 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {loc('الانتقال إلى الأكاديمية', 'מעבר לאקדמיה', 'Go to Engrew Academy')}
              </Link>
            </div>
          </div>
        ) : (
          /* ACTIVE REVIEW SUBMISSION FORM */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-brand-teal-800 via-brand-teal-900 to-slate-900 text-white space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-olive-300">
                <ShieldCheck className="w-4 h-4 text-brand-olive-300 shrink-0" />
                <span>{loc('دعوة تقييم معتمدة • رابط متعدد الاستخدام', 'הזמנת משוב מאומתת • קישור רב-פעמי פעיל', 'Verified Review Invitation • Multi-Use Link')}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {loc('شارك تجربتك مع أكاديمية إنجرو', 'שתף את חוות דעתך על אקדמיית Engrew', 'Share Your Experience with Engrew Academy')}
              </h1>
              <p className="text-xs text-brand-teal-100 max-w-lg leading-relaxed">
                {linkData?.label || loc(
                  'رأيك الصادق يساعدنا في تطوير مناهج المحادثة وجودة التدريس الفردي.',
                  'דעתך הכנה מסייעת לנו לשפר את שיעורי השיחה הפרטיים ומערך ההוראה.',
                  'Your authentic feedback directly helps our coaching staff calibrate 1-on-1 lessons and personalized learning.'
                )}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReview} className="p-6 sm:p-8 space-y-6">
              {/* 1. Reviewer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    {loc('اسم الطالب / المراجع:', 'שם התלמיד / הכותב:', 'Your Name:')}
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder={loc('مثال: مصطفى كمال', 'לדוגמה: יונתן כהן', 'e.g. Alex Johnson')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    {loc('البريد الإلكتروني (اختياري):', 'דוא״ל (אופציונלי):', 'Email Address (Optional):')}
                  </label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Primary 5-Star Rating Card */}
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-center space-y-2">
                <label className="block text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  {loc('التقييم الإجمالي للتجربة الأكاديمية (1–5 نجوم)', 'דירוג החוויה הכללית באקדמיה (1–5 כוכבים)', 'Overall Academy Experience Rating (1–5 Stars)')}
                </label>

                {/* Stars */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeVal = hoverRating || overallRating;
                    const isFilled = star <= activeVal;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        title={`${star} Stars`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                            isFilled
                              ? 'text-amber-500 fill-amber-500 drop-shadow-sm'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 pt-1">
                  {getRatingFeedback(hoverRating || overallRating)}
                </p>
              </div>

              {/* 3. Secondary Criteria (Teaching & Platform) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                {/* Teaching Quality */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {loc('جودة التدريس وصبر المعلم:', 'איכות ההוראה וסבלנות המורה:', 'Teaching Quality & Tutor Patience:')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTeachingRating(s)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-colors ${
                          teachingRating === s
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s}★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform & Scheduling Ease */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {loc('سهولة الحجز واستخدام المنصة:', 'נוחות השימוש ומערכת ההזמנות:', 'Platform Ease of Use & Booking:')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPlatformRating(s)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-colors ${
                          platformRating === s
                            ? 'bg-brand-teal-700 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s}★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Review Title & Detailed Comments */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    {loc('عنوان التقييم في جملة موجزة:', 'כותרת המשוב במשפט קצר:', 'Review Headline (In one sentence):')}
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder={loc(
                      'مثال: دروس محادثة ممتازة ومعلمون رائعون وصبورون جداً',
                      'לדוגמה: שיעורי שיחה מצוינים ומורים מקצועיים וסבלניים',
                      'e.g. Exceptional Hebrew conversational practice with dedicated tutors'
                    )}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    {loc('تفاصيل التجربة ورأيك الكامل:', 'פירוט מלא על החוויה שלך באקדמיה:', 'Detailed Review & Testimonial:')}
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={loc(
                      'ما أكثر ما أعجبك في الدروس؟ كيف ساعدتك الحصص الفردية في تحقيق الطلاقة في المحادثة؟...',
                      'מה הכי אהבת בשיעורים? כיצד השיעורים הפרטיים תרמו לביטחון שלך בשיחה בעברית?...',
                      'What stood out most during your lessons? How did 1-on-1 sessions improve your confidence in speaking?...'
                    )}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-teal-700 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 5. Recommendation & Consent */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {loc('هل توصي بأكاديمية إنجرو للآخرين؟', 'האם תמליץ על אקדמיית Engrew לאחרים?', 'Would you recommend Engrew Academy?')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        recommend
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{loc('نعم، بالتأكيد! 👍', 'כן, בהחלט! 👍', 'Yes, definitely! 👍')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        !recommend
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{loc('محايد', 'ניטרלי', 'Neutral')}</span>
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allowPublicShare}
                    onChange={(e) => setAllowPublicShare(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-teal-800 focus:ring-brand-teal-800 border-slate-300 dark:border-slate-700 mt-0.5"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {loc(
                      'أوافق على عرض هذا التقييم في قسم آراء الطلاب المعتمدة بالموقع.',
                      'אני מאשר להציג משוב זה במאגר הביקורות המאומתות של האקדמיה.',
                      'I allow displaying this verified testimonial in the student reviews showcase.'
                    )}
                  </span>
                </label>
              </div>

              {/* 6. Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{loc('جارٍ إرسال التقييم...', 'שומר משוב...', 'Submitting Review...')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>{loc('إرسال التقييم المعتمد', 'שלח משוב מאומת', 'Submit Verified Review')}</span>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-800/80">
        <p>© 2026 Engrew Academy. {loc('جميع الحقوق محفوظة.', 'כל הזכויות שמורות.', 'All rights reserved.')}</p>
      </footer>
    </div>
  );
};

export default ReviewRedirectPage;
