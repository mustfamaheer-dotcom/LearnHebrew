import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import confetti from 'canvas-confetti';
import {
  Clock,
  FileText,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Globe,
  Award,
  Sparkles,
  Phone,
  Mail,
  User,
  ShieldAlert,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface Question {
  id: string;
  orderNumber: number;
  questionText: string;
  questionTextHe?: string;
  questionTextAr?: string;
  optionA: string;
  optionAHe?: string;
  optionAAr?: string;
  optionB: string;
  optionBHe?: string;
  optionBAr?: string;
  optionC: string;
  optionCHe?: string;
  optionCAr?: string;
  optionD: string;
  optionDHe?: string;
  optionDAr?: string;
  level: string;
  explanation?: string;
  explanationHe?: string;
  explanationAr?: string;
}

type Lang = 'he' | 'en' | 'ar';

export const PlacementTestPage: React.FC = () => {
  const [lang, setLang] = useState<Lang>('he');
  const [step, setStep] = useState<'instructions' | 'welcome' | 'exam' | 'result'>('instructions');

  // Candidate Registration Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [previousSubmission, setPreviousSubmission] = useState<any>(null);

  // Exam Questions & State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; orderNumber: number; selectedOption: string }>>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);

  // Timer Ref
  const timerRef = useRef<any>(null);

  const isRTL = lang === 'he' || lang === 'ar';

  // Apply direction to HTML element on change
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  // Load questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const res = await api.get('/placement-test/config');
        if (res.data?.questions) {
          setQuestions(res.data.questions);
        }
      } catch (err) {
        console.error('Failed to load placement questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, []);

  // Timer Countdown in Exam Step
  useEffect(() => {
    if (step === 'exam') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, answers]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 1: Validate Registration & Check Eligibility
  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setFormError(
        lang === 'he'
          ? 'נא למלא את כל השדות כדי להמשיך'
          : lang === 'ar'
          ? 'يرجى ملء جميع الحقول للمتابعة'
          : 'Please fill in all fields to proceed'
      );
      return;
    }

    setCheckingEligibility(true);
    try {
      const res = await api.post('/placement-test/check-eligibility', {
        email: email.trim(),
        phone: phone.trim(),
      });

      if (!res.data.eligible) {
        setPreviousSubmission(res.data.submission);
        setFormError(
          lang === 'he'
            ? `כבר ביצעת את המבחן בעבר. הרמה שנקבעה: ${res.data.submission?.evaluatedLevel || 'A1'}. מותר ניסיון אחד בלבד.`
            : lang === 'ar'
            ? `لقد أجريت هذا الاختبار مسبقاً. المستوى المقيّم: ${res.data.submission?.evaluatedLevel || 'A1'}. يُسمح بمحاولة واحدة فقط.`
            : `You have already completed this test. Evaluated Level: ${res.data.submission?.evaluatedLevel || 'A1'}. Only 1 attempt is allowed.`
        );
        return;
      }

      // Proceed to Welcome Screen (Image 2)
      setStep('welcome');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Validation error. Please verify your details.');
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Step 2 -> Step 3: Advance to Exam
  const handleLaunchExam = () => {
    setStep('exam');
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setWrongCount(0);
    setTimeLeft(20 * 60);
  };

  // Step 3: Handle Answer Option Selection & Next
  const handleAnswerQuestion = (optionKey: string) => {
    setSelectedOption(optionKey);
  };

  const handleNextQuestion = () => {
    if (!selectedOption) return;

    const currentQ = questions[currentIndex];
    const newAnswers = [
      ...answers,
      {
        questionId: currentQ.id,
        orderNumber: currentQ.orderNumber,
        selectedOption,
      },
    ];
    setAnswers(newAnswers);

    // Advance or Finish
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Completed all 36 questions!
      submitFinalTest(newAnswers);
    }
  };

  const handleAutoSubmit = () => {
    submitFinalTest(answers);
  };

  const submitFinalTest = async (collectedAnswers: typeof answers) => {
    setSubmitting(true);
    try {
      const res = await api.post('/placement-test/submit', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nativeLanguage: lang,
        timeSpentSeconds: 20 * 60 - timeLeft,
        answers: collectedAnswers,
      });

      setExamResult(res.data);
      setStep('result');

      // Trigger Celebration Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(err.response?.data?.message || 'Failed to submit test. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  // Translations Map
  const t = {
    he: {
      navTitle: 'מבחן רמה באנגלית • Engrew Academy',
      instructionsTitle: 'הוראות למבחן:',
      instructions: [
        'ענו על כל השאלות: בסך הכל ישנן 36 שאלות, שבהן יש לבחור תשובה אחת בלבד.',
        'היו כנים: כדי להפיק את המרב מהמבחן, הקפידו שהתשובות שלכם ישקפו את המציאות. אם אינכם יודעים את התשובה, בחרו באפשרות "אינני יודע". איש אינו שופט אתכם!',
        'קראו את השאלות בעיון: אל תמהרו בקריאת השאלות, וודאו שאתם מבינים אותן היטב לפני שאתם עונים.',
        'בדקו את התוצאות: לאחר סיום המבחן, תקבלו הערכה משוערת של הרמה הנוכחית שלכם.',
      ],
      highlights: {
        noFees: 'בלי תשלום',
        results: 'התוצאות מיידיות',
        questions: '36 שאלות',
        time: '20 דקות',
      },
      form: {
        title: 'פרטים אישיים לפני תחילת המבחן',
        subtitle: 'התוצאות וההמלצות יישלחו גם לכתובת האימייל והוואטסאפ שלך.',
        firstName: 'שם פרטי',
        lastName: 'שם משפחה',
        email: 'כתובת אימייל',
        phone: 'מספר טלפון / וואטסאפ',
        startBtn: 'התחלת המבחן',
        checking: 'בודק זכאות...',
      },
      welcome: {
        quote: 'ברוכים הבאים למבחן הרמה באנגלית!',
        subtitle: 'מבחן זה בוחן את הידע שלכם בדקדוק אנגלי.',
        levelNote: 'השאלות מתחילות ברמה בסיסית (A1) והופכות לקשות יותר בהדרגה.',
        b1: 'ענו על כל השאלות.',
        b2: 'המבחן מסתיים לאחר 4 תשובות שגויות.',
        b3: 'אם אינכם יודעים את התשובה, בחרו באפשרות "I don\'t know."',
        letsStart: 'בואו נתחיל!',
      },
      exam: {
        questionOf: 'שאלה',
        of: 'מתוך',
        dontKnow: "אינני יודע / I don't know",
        next: 'השאלה הבאה',
        finish: 'סיום והגשת המבחן',
        levelBadge: 'רמת קושי:',
        timeRemaining: 'זמן נותר:',
      },
      result: {
        congrats: 'כל הכבוד! סיימת את מבחן הרמה',
        evaluatedLevel: 'רמת האנגלית המשוערת שלך:',
        scoreLabel: 'ציון:',
        correctAnswers: 'תשובות נכונות מתוך 36',
        ctaTitle: 'רוצה להתקדם לרמה הבאה עם מורה פרטי שפת אם?',
        ctaDesc: 'האקדמיה של Engrew מציעה שיעורים פרטיים מותאמים אישית של 25 דקות בשיטת ה-Micro-learning לתוצאות מהירות.',
        bookBtn: 'בדיקת חבילות ומבצעים',
        whatsappBtn: 'ייעוץ אישי בוואטסאפ',
      },
    },
    en: {
      navTitle: 'English Placement Test • Engrew Academy',
      instructionsTitle: 'Test instructions:',
      instructions: [
        'Answer all questions: There are 36 single-select questions in total.',
        "Be honest: To get the most out of the test, make sure your answers are real. If you don't know the answer, select “I don't know”. No one is judging you!",
        "Read questions carefully: Don't rush when you read the questions and make sure you understand them before answering.",
        "Check your results: After the test, you'll get an approximate evaluation of your current level.",
      ],
      highlights: {
        noFees: 'No fees',
        results: 'Immediate results',
        questions: '36 questions',
        time: '20 minutes',
      },
      form: {
        title: 'Candidate Information Before Starting',
        subtitle: 'Your evaluation results and personalized learning path will be saved.',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        phone: 'Phone / WhatsApp',
        startBtn: 'Start the test',
        checking: 'Verifying eligibility...',
      },
      welcome: {
        quote: 'Welcome to the English level test!',
        subtitle: 'This test evaluates your knowledge on English grammar.',
        levelNote: 'The questions start at Elementary (A1) level and become gradually more difficult.',
        b1: 'Answer all the questions.',
        b2: 'The test stops after 4 wrong answers.',
        b3: 'If you don\'t know the answer, choose "I don\'t know."',
        letsStart: "Let's start!",
      },
      exam: {
        questionOf: 'Question',
        of: 'of',
        dontKnow: "I don't know",
        next: 'Next Question',
        finish: 'Finish & Submit Test',
        levelBadge: 'Difficulty:',
        timeRemaining: 'Time Left:',
      },
      result: {
        congrats: 'Congratulations! You have completed the test',
        evaluatedLevel: 'Your Evaluated English Level:',
        scoreLabel: 'Score:',
        correctAnswers: 'correct answers out of 36',
        ctaTitle: 'Ready to master English with certified native teachers?',
        ctaDesc: 'Engrew Academy provides high-intensity 25-minute 1-on-1 private lessons designed for busy professionals.',
        bookBtn: 'Explore Learning Packages',
        whatsappBtn: 'Chat with Academic Advisor on WhatsApp',
      },
    },
    ar: {
      navTitle: 'اختبار تحديد مستوى اللغة الإنجليزية • أكاديمية إنجرو',
      instructionsTitle: 'تعليمات الاختبار:',
      instructions: [
        'أجب عن جميع الأسئلة: يتكون الاختبار من 36 سؤالاً، ولكل سؤال إجابة واحدة صحيحة.',
        'كن صادقاً: للحصول على أدق تقييم ممكن، تأكد من أن إجاباتك تعبر عن واقعك. إذا كنت لا تعرف الإجابة، فاختر "لا أعرف". لا أحد يقيّمك أو يحكم عليك!',
        'اقرأ الأسئلة بعناية: لا تتسرع في قراءة الأسئلة، وتأكد من فهمها جيداً قبل تقديم إجابتك.',
        'اطلع على نتائجك: بعد الانتهاء من الاختبار، ستحصل على تقييم تقريبي لمستواك الحالي.',
      ],
      highlights: {
        noFees: 'بدون أي رسوم',
        results: 'نتائج فورية',
        questions: '36 سؤالاً',
        time: '20 دقيقة',
      },
      form: {
        title: 'البيانات الشخصية قبل بدء الاختبار',
        subtitle: 'سيتم إرسال نتيجتك وخطة التطوير الموصى بها إلى بريدك ورقم الواتساب.',
        firstName: 'الاسم الأول',
        lastName: 'اسم العائلة',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف / الواتساب',
        startBtn: 'ابدأ الاختبار',
        checking: 'جاري التحقق...',
      },
      welcome: {
        quote: 'مرحباً بك في اختبار تحديد مستوى اللغة الإنجليزية!',
        subtitle: 'يقيم هذا الاختبار معرفتك في قواعد اللغة الإنجليزية.',
        levelNote: 'تبدأ الأسئلة من المستوى التأسيسي (A1) وتزداد صعوبة بالتدريج.',
        b1: 'أجب عن جميع الأسئلة.',
        b2: 'ينتهي الاختبار تلقائياً بعد 4 إجابات خاطئة.',
        b3: 'إذا كنت لا تعرف الإجابة، اختر "I don\'t know".',
        letsStart: 'لنبدأ الآن!',
      },
      exam: {
        questionOf: 'السؤال',
        of: 'من',
        dontKnow: "لا أعرف / I don't know",
        next: 'السؤال التالي',
        finish: 'إنهاء وتسليم الاختبار',
        levelBadge: 'مستوى الصعوبة:',
        timeRemaining: 'الوقت المتبقي:',
      },
      result: {
        congrats: 'أحسنت! لقد أكملت اختبار تحديد المستوى بنجاح',
        evaluatedLevel: 'مستواك المقدر في اللغة الإنجليزية:',
        scoreLabel: 'النتيجة:',
        correctAnswers: 'إجابة صحيحة من أصل 36',
        ctaTitle: 'هل ترغب في الانتقال للمستوى التالي مع معلمين ناطقين أصليين؟',
        ctaDesc: 'تقدم أكاديمية إنجرو دروساً خاصة 1-على-1 لمدة 25 دقيقة مصممة لتحقيق الطلاقة السريعة.',
        bookBtn: 'استكشاف باقات الدروس',
        whatsappBtn: 'تواصل مع المستشار الأكاديمي عبر واتساب',
      },
    },
  }[lang];

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-center shadow-xs">
        {/* Native Language Selector Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setLang('he')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              lang === 'he'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🇮🇱</span>
            <span>עברית</span>
          </button>
          <button
            onClick={() => setLang('ar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              lang === 'ar'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🇸🇦</span>
            <span>العربية</span>
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              lang === 'en'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🇺🇸</span>
            <span>English</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* ========================================================================= */}
        {/* STEP 1: INSTRUCTIONS & CANDIDATE REGISTRATION FORM                        */}
        {/* ========================================================================= */}
        {step === 'instructions' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Title */}
            <div className="space-y-3">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.instructionsTitle}
              </h2>
              <div className="space-y-2.5 text-sm lg:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {t.instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">
                      {idx + 1}.
                    </span>
                    <span>{inst}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Feature Badges (Matching User's Uploaded Image 1) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                    Engrew Free
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.highlights.noFees}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                    Questions
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.highlights.questions}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                    Instant CEFR
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.highlights.results}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                    Time Limit
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.highlights.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate Registration Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.form.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.form.subtitle}
                </p>
              </div>

              {formError && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleStartRegistration} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.form.firstName} *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute top-3.5 right-3 rtl:right-3 ltr:left-3" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={lang === 'he' ? 'דוד / יונתן / John' : 'John / David'}
                        className={`w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                          isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.form.lastName} *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute top-3.5 right-3 rtl:right-3 ltr:left-3" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={lang === 'he' ? 'כהן / לוי / Cohen' : 'Smith / Cohen'}
                        className={`w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                          isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.form.email} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 right-3 rtl:right-3 ltr:left-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className={`w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                          isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.form.phone} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute top-3.5 right-3 rtl:right-3 ltr:left-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+972 / +1 / +44 ..."
                        className={`w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                          isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={checkingEligibility}
                    className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {checkingEligibility ? (
                      <span>{t.form.checking}</span>
                    ) : (
                      <>
                        <span>{t.form.startBtn}</span>
                        {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: WELCOME SCREEN (Matching User's Uploaded Image 2)                 */}
        {/* ========================================================================= */}
        {step === 'welcome' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 lg:p-12 shadow-md space-y-8 animate-in zoom-in-95 duration-300">
            {/* Opening quotation mark */}
            <div className="text-4xl lg:text-5xl font-serif text-slate-400 dark:text-slate-600 leading-none select-none">
              &ldquo;
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.welcome.quote}
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 font-medium">
                {t.welcome.subtitle}
              </p>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.welcome.levelNote}
            </p>

            <div className="space-y-3 py-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-base">✅</span>
                <span className="font-semibold">{t.welcome.b1}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base">👀</span>
                <span className="font-semibold">{t.welcome.b2}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base">🤷🏽</span>
                <span className="font-semibold">{t.welcome.b3}</span>
              </div>
            </div>

            {/* Pink Button matching uploaded image */}
            <div className="pt-4">
              <button
                onClick={handleLaunchExam}
                className="px-8 py-3.5 rounded-xl bg-[#ff4d88] hover:bg-[#ff3377] active:scale-98 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                {t.welcome.letsStart}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: EXAM INTERACTIVE EXPERIENCE                                       */}
        {/* ========================================================================= */}
        {step === 'exam' && questions.length > 0 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Sticky Header with Timer & Progress */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  {t.exam.questionOf} {currentIndex + 1} {t.exam.of} {questions.length}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  CEFR: {questions[currentIndex]?.level || 'A1'}
                </span>
              </div>

              {/* 20-min Countdown Timer */}
              <div className="flex items-center gap-2 text-sm font-extrabold text-amber-600 dark:text-amber-400 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="font-mono">{formatTimer(timeLeft)}</span>
              </div>

              {/* Safeguard: 4 Wrong Answers Stop Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Mistake Limit:</span>
                <span className="font-bold text-rose-500">4 Stops Exam</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Current Question Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-10 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  #{questions[currentIndex]?.orderNumber}
                </span>
                <h3 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {lang === 'he' && questions[currentIndex]?.questionTextHe
                    ? questions[currentIndex]?.questionTextHe
                    : lang === 'ar' && questions[currentIndex]?.questionTextAr
                    ? questions[currentIndex]?.questionTextAr
                    : questions[currentIndex]?.questionText}
                </h3>
              </div>

              {/* 4 Standard Options */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  {
                    key: 'A' as const,
                    text:
                      lang === 'he' && questions[currentIndex]?.optionAHe
                        ? questions[currentIndex]?.optionAHe
                        : lang === 'ar' && questions[currentIndex]?.optionAAr
                        ? questions[currentIndex]?.optionAAr
                        : questions[currentIndex]?.optionA,
                  },
                  {
                    key: 'B' as const,
                    text:
                      lang === 'he' && questions[currentIndex]?.optionBHe
                        ? questions[currentIndex]?.optionBHe
                        : lang === 'ar' && questions[currentIndex]?.optionBAr
                        ? questions[currentIndex]?.optionBAr
                        : questions[currentIndex]?.optionB,
                  },
                  {
                    key: 'C' as const,
                    text:
                      lang === 'he' && questions[currentIndex]?.optionCHe
                        ? questions[currentIndex]?.optionCHe
                        : lang === 'ar' && questions[currentIndex]?.optionCAr
                        ? questions[currentIndex]?.optionCAr
                        : questions[currentIndex]?.optionC,
                  },
                  {
                    key: 'D' as const,
                    text:
                      lang === 'he' && questions[currentIndex]?.optionDHe
                        ? questions[currentIndex]?.optionDHe
                        : lang === 'ar' && questions[currentIndex]?.optionDAr
                        ? questions[currentIndex]?.optionDAr
                        : questions[currentIndex]?.optionD,
                  },
                ].map(({ key, text }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAnswerQuestion(key)}
                    className={`w-full p-4 rounded-2xl text-start font-semibold text-sm border transition-all flex items-center justify-between ${
                      selectedOption === key
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/30'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        selectedOption === key
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {key}
                      </span>
                      <span>{text}</span>
                    </div>
                    {selectedOption === key && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* 5th Option: "I don't know" */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleAnswerQuestion('DONT_KNOW')}
                  className={`w-full p-3.5 rounded-2xl text-start font-semibold text-xs border transition-all flex items-center justify-between ${
                    selectedOption === 'DONT_KNOW'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🤷🏽</span>
                    <span>{t.exam.dontKnow}</span>
                  </div>
                  {selectedOption === 'DONT_KNOW' && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  )}
                </button>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-slate-400">
                  {currentIndex + 1} / {questions.length}
                </span>

                <button
                  type="button"
                  disabled={!selectedOption || submitting}
                  onClick={handleNextQuestion}
                  className={`px-7 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    selectedOption && !submitting
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : currentIndex + 1 === questions.length ? (
                    <>
                      <span>{t.exam.finish}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>{t.exam.next}</span>
                      {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: INSTANT RESULTS & CERTIFICATE CARD                                */}
        {/* ========================================================================= */}
        {step === 'result' && examResult && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
            {/* Certificate Card */}
            <div className="bg-white dark:bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-8 lg:p-12 shadow-lg text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

              <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                  Engrew Verified Placement Test
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {t.result.congrats}, {firstName}!
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.result.evaluatedLevel}
                </p>
              </div>

              {/* CEFR Level Highlight */}
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
                <span className="text-4xl font-extrabold tracking-tight">
                  {examResult.evaluatedLevel}
                </span>
                <span className="text-xs font-bold uppercase opacity-90 border-l pl-3 rtl:border-l-0 rtl:border-r rtl:pr-3 rtl:pl-0">
                  CEFR Benchmark
                </span>
              </div>

              {/* Score Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-around text-center">
                <div>
                  <span className="block text-2xl font-extrabold text-slate-900 dark:text-white">
                    {examResult.score} / {examResult.totalQuestions}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t.result.correctAnswers}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <span className="block text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {Math.round((examResult.score / examResult.totalQuestions) * 100)}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Accuracy Rate
                  </span>
                </div>
              </div>

              {/* CEFR Ladder Map */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  CEFR Progression Roadmap
                </span>
                <div className="grid grid-cols-6 gap-1.5 text-center text-xs font-bold">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
                    const isTarget = examResult.evaluatedLevel === lvl;
                    return (
                      <div
                        key={lvl}
                        className={`py-2 rounded-xl transition-all ${
                          isTarget
                            ? 'bg-teal-600 text-white shadow-md scale-105 ring-2 ring-teal-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {lvl}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.result.ctaTitle}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                {t.result.ctaDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href="/#packages"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t.result.bookBtn}</span>
                </a>
                <a
                  href={`https://wa.me/972543402227?text=${encodeURIComponent(
                    `Hello Engrew! I just completed the English Placement Test. My evaluated level is ${examResult.evaluatedLevel} (${examResult.score}/36). I would like to consult about 1-on-1 private lessons.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.result.whatsappBtn}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlacementTestPage;
