import React from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  User,
  Mail,
  GraduationCap,
} from 'lucide-react';
import { ReceiptData, printReceipt, downloadReceiptHtml } from '../../utils/receiptGenerator';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
  language: 'en' | 'he' | 'ar';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
  language,
}) => {
  if (!isOpen || !data) return null;

  const isHe = language === 'he';
  const isAr = language === 'ar';
  const isRtl = isHe || isAr;
  const isPackage = data.type === 'PACKAGE_ACTIVATION';
  const isBooking = data.type === 'SESSION_BOOKING';
  const isRefund = data.type === 'SESSION_REFUND';

  const titleEn = isPackage
    ? 'Official Payment Receipt & Invoice'
    : isBooking
    ? 'Lesson Booking Confirmation & Voucher'
    : isRefund
    ? 'Session Restored Receipt'
    : 'Account Balance Adjustment';

  const titleHe = isPackage
    ? 'קבלה ואישור תשלום חבילה'
    : isBooking
    ? 'שובר ואישור הזמנת שיעור'
    : isRefund
    ? 'אישור החזרת שיעור לחבילה'
    : 'שובר עדכון יתרת שיעורים';

  const titleAr = isPackage
    ? 'إيصال وفاتورة دفع الحزمة'
    : isBooking
    ? 'تأكيد وقسيمة حجز الدرس'
    : isRefund
    ? 'إيصال استرجاع رصيد الحصة'
    : 'إيصال تسوية رصيد الحساب';

  const docTitle = isAr ? titleAr : isHe ? titleHe : titleEn;

  const dateFormatted = new Date(data.createdAt).toLocaleDateString(isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const packageName = isHe && data.packageDetails?.nameHe
    ? data.packageDetails.nameHe
    : (data.packageDetails?.name || 'Hebrew Session Package');

  const sessionLabel = isHe && data.sessionType?.labelHe
    ? data.sessionType.labelHe
    : (data.sessionType?.labelEn || `${data.sessionType?.durationMinutes || 25}-Min Session`);

  const currency = data.packageDetails?.currency || 'USD';
  const priceDisplay = data.packageDetails?.price ? `$${Number(data.packageDetails.price).toFixed(2)} ${currency}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Floating Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                {docTitle}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                #{data.receiptNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printReceipt(data, language)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              title={isHe ? 'הדפס או שמור כ-PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-3.5 h-3.5 text-brand-olive-300" />
              <span>{isHe ? 'הדפס / שמור כ-PDF' : 'Print / Save as PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadReceiptHtml(data, language)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={isHe ? 'הורד קובץ קבלה' : 'Download Receipt File'}
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body (Clean Paper Layout) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 text-xs">
          
          {/* Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-brand-teal-700/80 gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Engrew Logo"
                className="w-12 h-12 object-contain rounded-xl"
              />
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-brand-teal-900 dark:text-brand-teal-200">
                  Engrew
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isHe ? 'האקדמיה המוסמכת ללימודי עברית אונליין' : 'Certified Online Hebrew Academy'}
                </p>
              </div>
            </div>

            <div className="text-start sm:text-end space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                {isHe ? 'קבלה מאומתת' : 'Official Receipt'}
              </span>
              <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                #{data.receiptNumber}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {dateFormatted}
              </p>
            </div>
          </div>

          {/* Student & Transaction Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                <User className="w-3.5 h-3.5 text-brand-teal-600" />
                <span>{isHe ? 'פרטי התלמיד (חיוב עבור)' : 'Student Details (Billed To)'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 dark:text-slate-400">{isHe ? 'שם מלא:' : 'Full Name:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.studentDetails.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{isHe ? 'דוא״ל:' : 'Email:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{data.studentDetails.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{isHe ? 'רמת לימוד:' : 'Level:'}</span>
                <span className="font-bold text-brand-teal-800 dark:text-brand-teal-300">
                  {data.studentDetails.level || 'Intermediate Hebrew'}
                </span>
              </div>
            </div>

            {/* Transaction Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                <Clock className="w-3.5 h-3.5 text-brand-teal-600" />
                <span>{isHe ? 'פרטי אימות העסקה' : 'Transaction & Verification'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 dark:text-slate-400">{isHe ? 'סוג פעולה:' : 'Action Type:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isPackage
                    ? (isHe ? 'הפעלת חבילה' : 'Package Activation')
                    : isBooking
                    ? (isHe ? 'הזמנת שיעור' : 'Lesson Booking')
                    : (isHe ? 'עדכון מכסה' : 'Balance Quota')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{isHe ? 'אמצעי פעולה:' : 'Payment / Source:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {data.packageDetails?.paymentMethod || (isBooking ? (isHe ? 'ניכוי מחבילה' : 'Package Deduction') : (isHe ? 'העברה מאושרת' : 'Verified'))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{isHe ? 'סטטוס אישור:' : 'Auth Status:'}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isHe ? 'מאושר והושלם' : 'VERIFIED & PAID'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-start">
              <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-start">{isHe ? 'תיאור השירות' : 'Description / Service Item'}</th>
                  <th className="py-3 px-4 text-start">{isHe ? 'פרטים' : 'Type / Schedule'}</th>
                  <th className="py-3 px-4 text-end">{isHe ? 'שינוי מכסה / סכום' : 'Quota Change / Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {isPackage ? (
                  <tr>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-0.5">
                        {packageName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {isHe
                          ? `חבילת לימוד מובנית של ${data.packageDetails?.lessonsTotal || data.amount} שיעורים עם מורים מוסמכים דוברי שפת אם.`
                          : `Comprehensive Hebrew package of ${data.packageDetails?.lessonsTotal || data.amount} 1-on-1 sessions with certified instructors.`}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{sessionLabel}</div>
                      <div className="text-[10px] text-slate-400">
                        {isHe ? `תוקף: ${data.packageDetails?.validityDays || 30} יום` : `Valid for ${data.packageDetails?.validityDays || 30} days`}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-end whitespace-nowrap">
                      <div className="font-black text-sm text-brand-teal-800 dark:text-brand-teal-300">
                        +{data.amount} {isHe ? 'שיעורים' : 'Sessions'}
                      </div>
                      {priceDisplay && (
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {priceDisplay}
                        </div>
                      )}
                    </td>
                  </tr>
                ) : isBooking ? (
                  <tr>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-0.5">
                        {isHe ? 'שיעור פרטי 1-על-1 בעברית' : '1-on-1 Private Hebrew Lesson'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHe ? `מורה מוסמך: ${data.lessonDetails?.teacherName || 'מורה מוסמך לעברית'}` : `Certified Instructor: ${data.lessonDetails?.teacherName || 'Certified Hebrew Teacher'}`}
                      </div>
                      {data.lessonDetails?.meetingUrl && (
                        <div className="text-[10px] text-brand-teal-800 dark:text-brand-teal-300 font-mono mt-1 truncate max-w-xs">
                          Zoom: {data.lessonDetails.meetingUrl}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{sessionLabel}</div>
                      <div className="text-[10px] text-slate-400">
                        {data.lessonDetails?.scheduledAt
                          ? new Date(data.lessonDetails.scheduledAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : (isHe ? 'מועד נקבע' : 'Scheduled')}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-end whitespace-nowrap">
                      <div className="font-black text-sm text-rose-600 dark:text-rose-400">
                        -1 {isHe ? 'שיעור' : 'Session'}
                      </div>
                      <div className="text-[10px] text-slate-400">{isHe ? 'ניכוי מחבילה' : 'Package Quota'}</div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-0.5">
                        {data.description || (isHe ? 'עדכון מכסת שיעורים' : 'Session Quota Adjustment')}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{sessionLabel}</div>
                    </td>
                    <td className="py-4 px-4 text-end whitespace-nowrap">
                      <div className={`font-black text-sm ${data.amount > 0 ? 'text-brand-teal-800 dark:text-brand-teal-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {data.amount > 0 ? `+${data.amount}` : data.amount} {isHe ? 'שיעורים' : 'Sessions'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary & Seal Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4 pt-1">
            {/* Digital Seal */}
            <div className="flex-1 p-4 rounded-2xl bg-brand-teal-50/50 dark:bg-brand-teal-950/30 border border-brand-teal-200/70 dark:border-brand-teal-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-teal-800 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs ring-2 ring-brand-teal-400/40">
                ✓
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-teal-900 dark:text-brand-teal-200">
                  {isHe ? 'חותמת אימות דיגיטלית - Engrew' : 'Engrew Official Digital Seal'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {isHe
                    ? 'עסקה זו אומתה ונרשמה בספר הפעולות הראשי של Engrew Academy. המסמך תקף כאישור רשמי.'
                    : 'This transaction is cryptographically logged and authenticated by Engrew Academy. Valid as official proof.'}
                </p>
              </div>
            </div>

            {/* Totals Box */}
            <div className="w-full sm:w-72 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>{isHe ? 'שינוי מכסה:' : 'Transaction Delta:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {data.amount > 0 ? `+${data.amount}` : data.amount} {isHe ? 'שיעורים' : 'Sessions'}
                </span>
              </div>
              {priceDisplay && (
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>{isHe ? 'סך הכל שולם:' : 'Total Amount Paid:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{priceDisplay}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-black">
                <span className="text-slate-700 dark:text-slate-200">{isHe ? 'סטטוס פעולה:' : 'Status:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {isHe ? 'הושלם בהצלחה ✓' : 'COMPLETED ✓'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-[11px] font-black text-emerald-900 dark:text-emerald-200">
                <span>{isHe ? 'יתרת שיעורים לאחר פעולה:' : 'Balance After:'}</span>
                <span>{data.balanceAfter} {isHe ? 'שיעורים' : 'units'}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Notice */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200 font-bold block mb-0.5">
              {isHe ? 'נוהל שיעורים ומדיניות ביטולים:' : 'Session Guidelines & Cancellation Policy:'}
            </strong>
            {isHe
              ? 'ביטול שיעור ללא חיוב אפשרי עד 12 שעות לפני המועד המתוזמן והשיעור יוחזר אוטומטית ליתרת החבילה שלך. מומלץ להתחבר לקישור ה-Zoom כ-2 דקות לפני תחילת השיעור עם מיקרופון ומצלמה פעילים.'
              : 'Cancellations made at least 12 hours prior to scheduled lesson time restore your session unit automatically. Please join the live Zoom link 2 minutes prior to session start.'}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
            <div>Engrew Academy Ltd. • Global Online Hebrew Education • support@engrew.com</div>
            <div>{isHe ? 'אישור ממוחשב - כל הזכויות שמורות' : 'Official computer-generated receipt'}</div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isHe ? 'סגור' : 'Close'}
          </button>

          <button
            type="button"
            onClick={() => printReceipt(data, language)}
            className="px-5 py-2 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-brand-olive-300" />
            <span>{isHe ? 'הדפס / שמור כ-PDF' : 'Print / Save as PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
