import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Coins,
  History,
  Plus,
  Edit3,
  Power,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Frame,
  Type,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  UserCheck,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { usePermissions } from '../../hooks/usePermissions';
import { api } from '../../lib/api';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';
import { PageHeaderBanner } from '../common/PageHeaderBanner';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { StyledNickname } from '../common/StyledNickname';
import {
  StoreItem,
  StoreItemType,
  StoreItemRarity,
  CoinTransactionType,
  CreateStoreItemPayload,
  useStoreItems,
  useCreateStoreItem,
  useUpdateStoreItem,
  useDeleteStoreItem,
  useGrantCoins,
  useStoreTransactions,
  useStudentTransactions,
  STORE_QUERY_KEYS,
} from '../../hooks/useStore';

type AdminStoreSubView = 'items' | 'transactions' | 'grant_coins';
type SortField = 'sortOrder' | 'name' | 'type' | 'rarity' | 'coinCost' | 'isActive';

const RARITY_ORDER: Record<StoreItemRarity, number> = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

const RARITY_BADGE_CLASSES: Record<StoreItemRarity, string> = {
  COMMON: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  RARE: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  EPIC: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  LEGENDARY: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
};

const FRAME_CSS_PRESETS = [
  { value: '', label: 'None (Custom Border)' },
  { value: 'frame-gold-glow', label: 'Gold Glow' },
  { value: 'frame-neon-cyan', label: 'Neon Cyan' },
  { value: 'frame-emerald-pulse', label: 'Emerald Pulse' },
  { value: 'frame-royal-purple', label: 'Royal Purple' },
  { value: 'frame-crimson-flame', label: 'Crimson Flame' },
  { value: 'frame-silver-frost', label: 'Silver Frost' },
  { value: 'frame-bronze-classic', label: 'Bronze Classic' },
  { value: 'frame-rainbow-legendary', label: 'Rainbow Legendary' },
];

const NICKNAME_CSS_PRESETS = [
  { value: '', label: 'None (Custom Style)' },
  { value: 'nickname-gold-legendary', label: 'Gold Legendary' },
  { value: 'nickname-purple-glow', label: 'Purple Glow' },
  { value: 'nickname-emerald-bold', label: 'Emerald Bold' },
  { value: 'nickname-crimson-fire', label: 'Crimson Fire' },
  { value: 'nickname-ocean-gradient', label: 'Ocean Gradient' },
  { value: 'nickname-rainbow-legendary', label: 'Rainbow Legendary' },
  { value: 'nickname-neon-cyan', label: 'Neon Cyan' },
];

const NICKNAME_FONT_OPTIONS = [
  { value: 'font-normal', label: 'Normal' },
  { value: 'font-semibold', label: 'Semi-Bold' },
  { value: 'font-bold', label: 'Bold' },
  { value: 'font-extrabold', label: 'Extra Bold' },
  { value: 'font-black', label: 'Black' },
  { value: 'font-mono font-bold', label: 'Mono Bold' },
  { value: 'italic font-bold', label: 'Italic Bold' },
];

const BORDER_RADIUS_OPTIONS = [
  { value: '50%', label: 'Circle (50%)' },
  { value: '24px', label: 'Squircle (24px)' },
  { value: '16px', label: 'Rounded (16px)' },
  { value: '10px', label: 'Soft (10px)' },
  { value: '0px', label: 'Square (0px)' },
];

const BADGE_EMOJI_PRESETS = ['', '👑', '🔥', '⚡', '🌟', '💎', '🏆', '🦊', '🚀', '🎯', '✨', '🎓'];

const INITIAL_FORM_STATE: CreateStoreItemPayload = {
  type: 'AVATAR_FRAME',
  rarity: 'COMMON',
  isActive: true,
  sortOrder: 0,
  coinCost: 100,
  nameEn: '',
  nameHe: '',
  nameAr: '',
  descEn: '',
  descHe: '',
  descAr: '',
  frameImageUrl: '',
  frameAnimated: false,
  frameCssClass: 'frame-gold-glow',
  frameBorderColor: '#ffd700',
  frameBorderRadius: '50%',
  nicknameColor: '#f59e0b',
  nicknameGlow: false,
  nicknameGlowColor: '#9333ea',
  nicknameFont: 'font-bold',
  nicknameBadgeIcon: '',
  nicknameCssClass: '',
};

export const StoreManagementTab: React.FC = () => {
  const { language, isRtl } = useTranslation();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const tr = (en: string, he: string, ar: string) =>
    language === 'he' ? he : language === 'ar' ? ar : en;

  const [subView, setSubView] = useState<AdminStoreSubView>('items');

  // ---------------------------------------------------------------------------
  // Items Panel State & Queries
  // ---------------------------------------------------------------------------
  const [itemSearch, setItemSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | StoreItemType>('ALL');
  const [itemRarityFilter, setItemRarityFilter] = useState<'ALL' | StoreItemRarity>('ALL');
  const [itemStatusFilter, setItemStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortField, setSortField] = useState<SortField>('sortOrder');
  const [sortAsc, setSortAsc] = useState(true);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [formState, setFormState] = useState<CreateStoreItemPayload>(INITIAL_FORM_STATE);

  const { data: items = [], isLoading: itemsLoading } = useStoreItems({ activeOnly: false });
  const createItemMutation = useCreateStoreItem();
  const updateItemMutation = useUpdateStoreItem();
  const deleteItemMutation = useDeleteStoreItem();

  // ---------------------------------------------------------------------------
  // Transactions Panel State & Queries
  // ---------------------------------------------------------------------------
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(20);
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState<'ALL' | CoinTransactionType>('ALL');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');

  const { data: txData, isLoading: txLoading } = useStoreTransactions(
    {
      page: txPage,
      limit: txLimit,
      search: txSearch.trim() || undefined,
      type: txType === 'ALL' ? undefined : txType,
      startDate: txStartDate || undefined,
      endDate: txEndDate || undefined,
    },
    subView === 'transactions'
  );

  // ---------------------------------------------------------------------------
  // Grant Coins Panel State & Queries
  // ---------------------------------------------------------------------------
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentUser, setSelectedStudentUser] = useState<any | null>(null);
  const [coinDelta, setCoinDelta] = useState<number>(50);
  const [grantReason, setGrantReason] = useState('');
  const grantCoinsMutation = useGrantCoins();

  const getStudentProfile = (u: any) => u?.studentProfile || u?.student;
  const selectedStudentId = getStudentProfile(selectedStudentUser)?.id as string | undefined;
  const { data: selectedStudentTxs = [] } = useStudentTransactions(selectedStudentId);
  const selectedStudentCoins =
    getStudentProfile(selectedStudentUser)?.coins ??
    selectedStudentTxs[0]?.coinsAfter ??
    0;

  const { data: usersData = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-store-students'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'STUDENT' } });
      return Array.isArray(res.data) ? res.data : res.data?.users ?? [];
    },
    enabled: subView === 'grant_coins',
  });

  const filteredStudents = useMemo(() => {
    const students = (usersData || []).filter(
      (u: any) => u.role === 'STUDENT' && Boolean(getStudentProfile(u)?.id)
    );
    if (!studentSearch.trim()) return students.slice(0, 30);
    const q = studentSearch.trim().toLowerCase();
    return students
      .filter((u: any) => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      })
      .slice(0, 30);
  }, [usersData, studentSearch]);

  // ---------------------------------------------------------------------------
  // Items Filtering & Sorting
  // ---------------------------------------------------------------------------
  const filteredAndSortedItems = useMemo(() => {
    let list = [...items];

    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase();
      list = list.filter(
        (it) =>
          it.nameEn.toLowerCase().includes(q) ||
          it.nameHe.toLowerCase().includes(q) ||
          it.nameAr.toLowerCase().includes(q) ||
          (it.frameCssClass || '').toLowerCase().includes(q) ||
          (it.nicknameCssClass || '').toLowerCase().includes(q)
      );
    }

    if (itemTypeFilter !== 'ALL') {
      list = list.filter((it) => it.type === itemTypeFilter);
    }

    if (itemRarityFilter !== 'ALL') {
      list = list.filter((it) => it.rarity === itemRarityFilter);
    }

    if (itemStatusFilter !== 'ALL') {
      const wantActive = itemStatusFilter === 'ACTIVE';
      list = list.filter((it) => it.isActive === wantActive);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.nameEn.localeCompare(b.nameEn);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'rarity':
          cmp = (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
          break;
        case 'coinCost':
          cmp = a.coinCost - b.coinCost;
          break;
        case 'isActive':
          cmp = Number(a.isActive) - Number(b.isActive);
          break;
        case 'sortOrder':
        default:
          cmp = a.sortOrder - b.sortOrder;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [items, itemSearch, itemTypeFilter, itemRarityFilter, itemStatusFilter, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" /> : <ArrowDown className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />;
  };

  // ---------------------------------------------------------------------------
  // Modal Open / Save / Toggle Active Handlers
  // ---------------------------------------------------------------------------
  const openCreateModal = () => {
    setEditingItem(null);
    setFormState({ ...INITIAL_FORM_STATE, sortOrder: items.length + 1 });
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: StoreItem) => {
    setEditingItem(item);
    setFormState({
      type: item.type,
      rarity: item.rarity,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      coinCost: item.coinCost,
      nameEn: item.nameEn,
      nameHe: item.nameHe,
      nameAr: item.nameAr,
      descEn: item.descEn ?? '',
      descHe: item.descHe ?? '',
      descAr: item.descAr ?? '',
      frameImageUrl: item.frameImageUrl ?? '',
      frameAnimated: item.frameAnimated,
      frameCssClass: item.frameCssClass ?? '',
      frameBorderColor: item.frameBorderColor ?? '#ffd700',
      frameBorderRadius: item.frameBorderRadius ?? '50%',
      nicknameColor: item.nicknameColor ?? '#f59e0b',
      nicknameGlow: item.nicknameGlow,
      nicknameGlowColor: item.nicknameGlowColor ?? '#9333ea',
      nicknameFont: item.nicknameFont ?? 'font-bold',
      nicknameBadgeIcon: item.nicknameBadgeIcon ?? '',
      nicknameCssClass: item.nicknameCssClass ?? '',
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nameEn.trim() || !formState.nameHe.trim() || !formState.nameAr.trim()) {
      toast.error(tr('Please fill EN, HE, and AR names', 'יש למלא שמות באנגלית, עברית וערבית', 'يرجى تعبئة الأسماء بالإنجليزية والعبرية والعربية'));
      return;
    }
    if (formState.coinCost < 1) {
      toast.error(tr('Coin cost must be at least 1', 'עלות המטבעות חייבת להיות לפחות 1', 'يجب أن تكون تكلفة العملات 1 على الأقل'));
      return;
    }

    const payload: CreateStoreItemPayload = {
      ...formState,
      coinCost: Number(formState.coinCost),
      sortOrder: Number(formState.sortOrder ?? 0),
      descEn: formState.descEn?.trim() || null,
      descHe: formState.descHe?.trim() || null,
      descAr: formState.descAr?.trim() || null,
      frameImageUrl: formState.type === 'AVATAR_FRAME' ? formState.frameImageUrl?.trim() || null : null,
      frameCssClass: formState.type === 'AVATAR_FRAME' ? formState.frameCssClass?.trim() || null : null,
      frameBorderColor: formState.type === 'AVATAR_FRAME' ? formState.frameBorderColor?.trim() || null : null,
      frameBorderRadius: formState.type === 'AVATAR_FRAME' ? formState.frameBorderRadius || '50%' : null,
      frameAnimated: formState.type === 'AVATAR_FRAME' ? Boolean(formState.frameAnimated) : false,
      nicknameColor: formState.type === 'NICKNAME' ? formState.nicknameColor?.trim() || null : null,
      nicknameGlow: formState.type === 'NICKNAME' ? Boolean(formState.nicknameGlow) : false,
      nicknameGlowColor: formState.type === 'NICKNAME' ? formState.nicknameGlowColor?.trim() || null : null,
      nicknameFont: formState.type === 'NICKNAME' ? formState.nicknameFont || null : null,
      nicknameBadgeIcon: formState.type === 'NICKNAME' ? formState.nicknameBadgeIcon?.trim() || null : null,
      nicknameCssClass: formState.type === 'NICKNAME' ? formState.nicknameCssClass?.trim() || null : null,
    };

    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({ id: editingItem.id, data: payload });
        toast.success(tr('Store item updated', 'פריט החנות עודכן בהצלחה', 'تم تحديث عنصر المتجر بنجاح'));
      } else {
        await createItemMutation.mutateAsync(payload);
        toast.success(tr('Store item created', 'פריט החנות נוצר בהצלחה', 'تم إنشاء عنصر المتجر بنجاح'));
      }
      setIsItemModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tr('Failed to save item', 'שמירת הפריט נכשלה', 'فشل حفظ العنصر'));
    }
  };

  const handleToggleItemActive = async (item: StoreItem) => {
    const nextActive = !item.isActive;
    const confirmed = await confirmDialog({
      title: nextActive ? 'Activate Store Item' : 'Deactivate Store Item',
      titleHe: nextActive ? 'הפעלת פריט בחנות' : 'השבתת פריט בחנות',
      message: nextActive
        ? `Make "${item.nameEn}" visible and redeemable in the student store again?`
        : `Hide "${item.nameEn}" from the student store? Students who already own it will keep it.`,
      messageHe: nextActive
        ? `להחזיר את "${item.nameHe}" לחנות התלמידים?`
        : `להסתיר את "${item.nameHe}" מחנות התלמידים? תלמידים שכבר רכשו אותו ישמרו עליו.`,
      confirmText: nextActive ? 'Activate' : 'Deactivate',
      confirmTextHe: nextActive ? 'הפעל' : 'השבת',
      variant: nextActive ? 'info' : 'warning',
    });
    if (!confirmed) return;

    try {
      if (!nextActive) {
        await deleteItemMutation.mutateAsync(item.id);
      } else {
        await updateItemMutation.mutateAsync({ id: item.id, data: { isActive: true } });
      }
      toast.success(
        nextActive
          ? tr('Item activated', 'הפריט הופעל', 'تم تفعيل العنصر')
          : tr('Item deactivated', 'הפריט הושבת', 'تم تعطيل العنصر')
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tr('Action failed', 'הפעולה נכשלה', 'فشل الإجراء'));
    }
  };

  // ---------------------------------------------------------------------------
  // Grant / Deduct Coins Handler
  // ---------------------------------------------------------------------------
  const handleGrantCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error(tr('Please select a student', 'יש לבחור תלמיד', 'يرجى اختيار طالب'));
      return;
    }
    if (!coinDelta || coinDelta === 0) {
      toast.error(tr('Amount must be non-zero', 'הסכום חייב להיות שונה מ-0', 'يجب أن يكون المبلغ غير صفري'));
      return;
    }
    if (!grantReason.trim()) {
      toast.error(tr('Reason is required for audit log', 'סיבה הינה שדה חובה ליומן הביקורת', 'السبب مطلوب لسجل التدقيق'));
      return;
    }

    const fullName = `${selectedStudentUser.firstName} ${selectedStudentUser.lastName}`;
    const isGrant = coinDelta > 0;
    const confirmed = await confirmDialog({
      title: isGrant ? 'Confirm Coin Grant' : 'Confirm Coin Deduction',
      titleHe: isGrant ? 'אישור הענקת מטבעות' : 'אישור הפחתת מטבעות',
      message: `${isGrant ? 'Grant' : 'Deduct'} ${Math.abs(coinDelta)} coins ${isGrant ? 'to' : 'from'} ${fullName}? Reason: "${grantReason.trim()}"`,
      messageHe: `${isGrant ? 'להעניק' : 'להפחית'} ${Math.abs(coinDelta)} מטבעות ${isGrant ? 'ל' : 'מ'}${fullName}? סיבה: "${grantReason.trim()}"`,
      confirmText: isGrant ? `Grant +${coinDelta}` : `Deduct ${coinDelta}`,
      confirmTextHe: isGrant ? `הענק +${coinDelta}` : `הפחת ${coinDelta}`,
      variant: isGrant ? 'info' : 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await grantCoinsMutation.mutateAsync({
        studentId: selectedStudentId,
        amount: Number(coinDelta),
        reason: grantReason.trim(),
      });
      toast.success(
        tr(
          `Updated ${fullName}'s balance to ${res.coinsAfter} coins`,
          `היתרה של ${fullName} עודכנה ל-${res.coinsAfter} מטבעות`,
          `تم تحديث رصيد ${fullName} إلى ${res.coinsAfter} عملة`
        )
      );
      setGrantReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-store-students'] });
      queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.studentTransactions(selectedStudentId) });
      setSelectedStudentUser((prev: any) =>
        prev
          ? {
              ...prev,
              studentProfile: prev.studentProfile ? { ...prev.studentProfile, coins: res.coinsAfter } : prev.studentProfile,
              student: prev.student ? { ...prev.student, coins: res.coinsAfter } : prev.student,
            }
          : null
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || tr('Failed to update coins', 'עדכון המטבעות נכשל', 'فشل تحديث العملات'));
    }
  };

  // ---------------------------------------------------------------------------
  // CSV Export Handler
  // ---------------------------------------------------------------------------
  const handleExportCsv = () => {
    const rows = txData?.transactions || [];
    if (rows.length === 0) {
      toast.info(tr('No transactions to export', 'אין עסקאות לייצוא', 'لا توجد معاملات للتصدير'));
      return;
    }

    const headers = ['Date', 'Student Name', 'Student Email', 'Type', 'Amount', 'Balance After', 'Item', 'Description'];
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((tx) => {
        const studentName = tx.student?.user
          ? `${tx.student.user.firstName} ${tx.student.user.lastName}`
          : tx.studentId;
        const studentEmail = tx.student?.user?.email ?? '';
        const itemName = tx.storeItem ? tx.storeItem.nameEn : '';
        return [
          new Date(tx.createdAt).toISOString(),
          studentName,
          studentEmail,
          tx.type,
          tx.amount,
          tx.coinsAfter,
          itemName,
          tx.description ?? '',
        ]
          .map(escapeCsv)
          .join(',');
      }),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `engrew-coin-transactions-page-${txPage}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(tr('CSV exported', 'קובץ CSV יוצא בהצלחה', 'تم تصدير ملف CSV بنجاح'));
  };

  const getLocalizedItemName = (item: StoreItem) =>
    language === 'he' ? item.nameHe : language === 'ar' ? item.nameAr : item.nameEn;

  const getTxTypeBadge = (type: CoinTransactionType) => {
    switch (type) {
      case 'EARNED_FROM_POINTS':
        return {
          label: tr('Points Milestone', 'המרת נקודות', 'مكافأة النقاط'),
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'REDEEMED_ITEM':
        return {
          label: tr('Item Redeemed', 'רכישת פריט', 'استبدال عنصر'),
          cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
        };
      case 'ADMIN_GRANT':
        return {
          label: tr('Admin Grant', 'מענק מנהל', 'منحة المشرف'),
          cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        };
      case 'ADMIN_DEDUCT':
        return {
          label: tr('Admin Deduct', 'הפחתת מנהל', 'خصم المشرف'),
          cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        };
    }
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeaderBanner
        badgeIcon={ShoppingBag}
        badgeText={tr('Gamification Store & Coin Economy', 'חנות המשחקים וכלכלת המטבעות', 'متجر التلعيب واقتصاد العملات')}
        statusText={tr('Live', 'פעיל', 'نشط')}
        title={tr('Store Management & Coin Ledger', 'ניהול חנות התלמידים ויומן המטבעות', 'إدارة المتجر وسجل العملات')}
        description={tr(
          'Design avatar frames and styled nicknames with live previews, audit student coin transactions, and grant or deduct coins.',
          'עצב מסגרות אווטאר וכינויים מעוצבים עם תצוגה מקדימה חיה, עקוב אחר תנועות מטבעות והענק מטבעות לתלמידים.',
          'صمم إطارات الصور والأسماء المستعارة مع معاينة حية، وراجع معاملات العملات، وامنح أو اخصم العملات للطلاب.'
        )}
        action={
          subView === 'items' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-olive-400 hover:bg-brand-olive-300 text-brand-teal-950 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{tr('Create Item', 'פריט חדש', 'إنشاء عنصر')}</span>
            </button>
          )
        }
      />

      {/* Sub-view Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setSubView('items')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subView === 'items'
              ? 'bg-brand-teal-900 text-white dark:bg-brand-teal-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{tr('Store Items', 'פריטי החנות', 'عناصر المتجر')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 dark:bg-white/15">
            {items.length}
          </span>
        </button>

        {(can('store:view_transactions') || can('store:manage_items')) && (
          <button
            type="button"
            onClick={() => setSubView('transactions')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subView === 'transactions'
                ? 'bg-brand-teal-900 text-white dark:bg-brand-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{tr('Transactions Audit', 'יומן עסקאות', 'سجل المعاملات')}</span>
          </button>
        )}

        {(can('store:grant_coins') || can('store:manage_items')) && (
          <button
            type="button"
            onClick={() => setSubView('grant_coins')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subView === 'grant_coins'
                ? 'bg-brand-teal-900 text-white dark:bg-brand-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{tr('Grant / Deduct Coins', 'הענקת מטבעות', 'منح / خصم العملات')}</span>
          </button>
        )}
      </div>

      {/* =====================================================================
          SUB-VIEW 1: ITEMS PANEL
          ===================================================================== */}
      {subView === 'items' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center gap-3 shadow-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder={tr('Search items (EN / HE / AR / CSS)...', 'חיפוש פריטים...', 'البحث عن العناصر...')}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-700"
              />
            </div>

            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{tr('All Types', 'כל הסוגים', 'كل الأنواع')}</option>
              <option value="AVATAR_FRAME">{tr('Avatar Frames', 'מסגרות אווטאר', 'إطارات الصور')}</option>
              <option value="NICKNAME">{tr('Nicknames', 'כינויים מעוצבים', 'الأسماء المستعارة')}</option>
            </select>

            <select
              value={itemRarityFilter}
              onChange={(e) => setItemRarityFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{tr('All Rarities', 'כל הנדירויות', 'كل الندرة')}</option>
              <option value="COMMON">COMMON</option>
              <option value="RARE">RARE</option>
              <option value="EPIC">EPIC</option>
              <option value="LEGENDARY">LEGENDARY</option>
            </select>

            <select
              value={itemStatusFilter}
              onChange={(e) => setItemStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{tr('All Status', 'כל הסטטוסים', 'كل الحالات')}</option>
              <option value="ACTIVE">{tr('Active Only', 'פעילים בלבד', 'النشطة فقط')}</option>
              <option value="INACTIVE">{tr('Inactive Only', 'מושבתים בלבד', 'المعطلة فقط')}</option>
            </select>
          </div>

          {/* Sortable Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="px-4 py-3.5 text-start">{tr('Preview', 'תצוגה', 'معاينة')}</th>
                    <th className="px-4 py-3.5 text-start">
                      <button type="button" onClick={() => handleSort('name')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white">
                        <span>{tr('Names (EN / HE / AR)', 'שמות הפריט', 'الأسماء')}</span>
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-start">
                      <button type="button" onClick={() => handleSort('type')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white">
                        <span>{tr('Type', 'סוג', 'النوع')}</span>
                        {renderSortIcon('type')}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-start">
                      <button type="button" onClick={() => handleSort('rarity')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white">
                        <span>{tr('Rarity', 'נדירות', 'الندرة')}</span>
                        {renderSortIcon('rarity')}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-start">
                      <button type="button" onClick={() => handleSort('coinCost')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white">
                        <span>{tr('Cost', 'מחיר', 'التكلفة')}</span>
                        {renderSortIcon('coinCost')}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-start">
                      <button type="button" onClick={() => handleSort('isActive')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white">
                        <span>{tr('Status', 'סטטוס', 'الحالة')}</span>
                        {renderSortIcon('isActive')}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-end">{tr('Actions', 'פעולות', 'إجراءات')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {itemsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        {tr('Loading store items...', 'טוען פריטי חנות...', 'جاري تحميل عناصر المتجر...')}
                      </td>
                    </tr>
                  ) : filteredAndSortedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        {tr('No store items match your filters.', 'לא נמצאו פריטים תואמים.', 'لا توجد عناصر مطابقة.')}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          !item.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          {item.type === 'AVATAR_FRAME' ? (
                            <AvatarWithFrame studentName="Engrew Star" frameItem={item} size="md" />
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 inline-block max-w-[160px]">
                              <StyledNickname name="Engrew Star" nicknameItem={item} className="text-xs" truncate />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{item.nameEn}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2">
                            <span>HE: {item.nameHe}</span>
                            <span>•</span>
                            <span>AR: {item.nameAr}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                            {item.type === 'AVATAR_FRAME' ? <Frame className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
                            {item.type === 'AVATAR_FRAME' ? tr('Frame', 'מסגרת', 'إطار') : tr('Nickname', 'כינוי', 'لقب')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-black border ${RARITY_BADGE_CLASSES[item.rarity]}`}>
                            {item.rarity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-black text-amber-600 dark:text-amber-400">
                            <Coins className="w-3.5 h-3.5" />
                            {item.coinCost}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              {tr('Active', 'פעיל', 'نشط')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <XCircle className="w-3 h-3" />
                              {tr('Inactive', 'מושבת', 'معطل')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                              title={tr('Edit', 'עריכה', 'تعديل')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleItemActive(item)}
                              className={`p-2 rounded-xl transition-colors ${
                                item.isActive
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-400'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-400'
                              }`}
                              title={item.isActive ? tr('Deactivate', 'השבתה', 'تعطيل') : tr('Activate', 'הפעלה', 'تفعيل')}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 2: TRANSACTIONS PANEL
          ===================================================================== */}
      {subView === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center gap-3 shadow-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
                placeholder={tr('Search student name or email...', 'חיפוש לפי שם תלמיד או אימייל...', 'ابحث باسم الطالب أو البريد...')}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-700"
              />
            </div>

            <select
              value={txType}
              onChange={(e) => {
                setTxType(e.target.value as any);
                setTxPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{tr('All Transaction Types', 'כל סוגי העסקאות', 'كل أنواع المعاملات')}</option>
              <option value="EARNED_FROM_POINTS">{tr('Earned from Points', 'המרת נקודות', 'مكتسبة من النقاط')}</option>
              <option value="REDEEMED_ITEM">{tr('Redeemed Item', 'רכישת פריט', 'استبدال عنصر')}</option>
              <option value="ADMIN_GRANT">{tr('Admin Grant', 'מענק מנהל', 'منحة المشرف')}</option>
              <option value="ADMIN_DEDUCT">{tr('Admin Deduct', 'הפחתת מנהל', 'خصم المشرف')}</option>
            </select>

            <input
              type="date"
              value={txStartDate}
              onChange={(e) => {
                setTxStartDate(e.target.value);
                setTxPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            />
            <input
              type="date"
              value={txEndDate}
              onChange={(e) => {
                setTxEndDate(e.target.value);
                setTxPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            />

            {(txSearch || txType !== 'ALL' || txStartDate || txEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setTxSearch('');
                  setTxType('ALL');
                  setTxStartDate('');
                  setTxEndDate('');
                  setTxPage(1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{tr('Reset', 'איפוס', 'إعادة تعيين')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-teal-900 hover:bg-brand-teal-800 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white text-xs font-bold shadow-xs transition-colors ms-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{tr('Export CSV', 'ייצוא CSV', 'تصدير CSV')}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="px-4 py-3.5 text-start">{tr('Student', 'תלמיד', 'الطالب')}</th>
                    <th className="px-4 py-3.5 text-start">{tr('Amount', 'סכום', 'المبلغ')}</th>
                    <th className="px-4 py-3.5 text-start">{tr('Type', 'סוג', 'النوع')}</th>
                    <th className="px-4 py-3.5 text-start">{tr('Item / Reason', 'פריט / סיבה', 'العنصر / السبب')}</th>
                    <th className="px-4 py-3.5 text-start">{tr('Balance After', 'יתרה אחרי', 'الرصيد بعد')}</th>
                    <th className="px-4 py-3.5 text-end">{tr('Date', 'תאריך', 'التاريخ')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        {tr('Loading transactions...', 'טוען עסקאות...', 'جاري تحميل المعاملات...')}
                      </td>
                    </tr>
                  ) : !txData || txData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        {tr('No transactions found.', 'לא נמצאו עסקאות.', 'لا توجد معاملات.')}
                      </td>
                    </tr>
                  ) : (
                    txData.transactions.map((tx) => {
                      const badge = getTxTypeBadge(tx.type);
                      const isPositive = tx.amount >= 0;
                      const studentName = tx.student?.user
                        ? `${tx.student.user.firstName} ${tx.student.user.lastName}`
                        : tx.studentId;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">{studentName}</div>
                            {tx.student?.user?.email && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{tx.student.user.email}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 font-black ${
                                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isPositive ? `+${tx.amount}` : tx.amount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {tx.storeItem && (
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {getLocalizedItemName(tx.storeItem)}
                              </div>
                            )}
                            {tx.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={tx.description}>
                                {tx.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              {tx.coinsAfter}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-end text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString(
                              language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-EG' : 'en-US'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {txData && txData.totalPages > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  {tr(
                    `Page ${txData.page} of ${txData.totalPages} (${txData.total} total)`,
                    `עמוד ${txData.page} מתוך ${txData.totalPages} (סה״כ ${txData.total})`,
                    `صفحة ${txData.page} من ${txData.totalPages} (الإجمالي ${txData.total})`
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={txLimit}
                    onChange={(e) => {
                      setTxLimit(Number(e.target.value));
                      setTxPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <button
                    type="button"
                    disabled={txPage <= 1}
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    disabled={txPage >= txData.totalPages}
                    onClick={() => setTxPage((p) => Math.min(txData.totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 3: GRANT / DEDUCT COINS PANEL
          ===================================================================== */}
      {subView === 'grant_coins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Student Search & Selector */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
                <span>{tr('1. Select Student', '1. בחר תלמיד', '1. اختر الطالب')}</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredStudents.length} {tr('shown', 'מוצגים', 'معروض')}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={tr('Search student by name or email...', 'חפש תלמיד לפי שם או אימייל...', 'ابحث عن طالب بالاسم أو البريد...')}
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-700"
              />
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {usersLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {tr('Loading students...', 'טוען תלמידים...', 'جاري تحميل الطلاب...')}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {tr('No students matched your search.', 'לא נמצאו תלמידים.', 'لم يتم العثور على طلاب.')}
                </div>
              ) : (
                filteredStudents.map((u: any) => {
                  const isSelected = selectedStudentUser?.id === u.id;
                  const fullName = `${u.firstName} ${u.lastName}`;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedStudentUser(u)}
                      className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-start transition-colors ${
                        isSelected
                          ? 'bg-brand-teal-50 dark:bg-brand-teal-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarWithFrame avatarUrl={u.avatarUrl} studentName={fullName} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                        </div>
                      </div>
                      {typeof getStudentProfile(u)?.coins === 'number' && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black shrink-0">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{getStudentProfile(u).coins}</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Grant / Deduct Form */}
          <form
            onSubmit={handleGrantCoinsSubmit}
            className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{tr('2. Adjust Coin Balance', '2. עדכון יתרת מטבעות', '2. تعديل رصيد العملات')}</span>
              </h3>

              {selectedStudentUser ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarWithFrame
                      avatarUrl={selectedStudentUser.avatarUrl}
                      studentName={`${selectedStudentUser.firstName} ${selectedStudentUser.lastName}`}
                      size="md"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedStudentUser.firstName} {selectedStudentUser.lastName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{selectedStudentUser.email}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {tr('Current Coins', 'יתרה נוכחית', 'الرصيد الحالي')}
                    </div>
                    <div className="font-black text-base text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                      <Coins className="w-4 h-4" />
                      {selectedStudentCoins}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  {tr('Select a student from the list on the left.', 'בחר תלמיד מהרשימה.', 'اختر طالباً من القائمة.')}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {tr('Coin Amount (positive to grant, negative to deduct)', 'כמות מטבעות (חיובי להענקה, שלילי להפחתה)', 'كمية العملات (موجب للمنح، سالب للخصم)')}
                </label>
                <input
                  type="number"
                  value={coinDelta}
                  onChange={(e) => setCoinDelta(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-700"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[25, 50, 100, 250, 500, -50, -100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCoinDelta(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        coinDelta === preset
                          ? 'bg-brand-teal-900 text-white border-brand-teal-900 dark:bg-brand-teal-600 dark:border-brand-teal-600'
                          : preset > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {preset > 0 ? `+${preset}` : preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {tr('Reason (Required for Audit Log)', 'סיבה (חובה ליומן הביקורת)', 'السبب (مطلوب لسجل التدقيق)')} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder={tr('e.g. Monthly speaking competition winner!', 'לדוגמה: זכייה באתגר הדיבור החודשי!', 'مثال: الفائز في تحدي التحدث الشهري!')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedStudentUser || !grantReason.trim() || coinDelta === 0 || grantCoinsMutation.isPending}
              className={`w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 ${
                coinDelta >= 0
                  ? 'bg-brand-teal-900 hover:bg-brand-teal-800 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-500'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {coinDelta >= 0
                  ? tr(`Grant +${coinDelta} Coins`, `הענק +${coinDelta} מטבעות`, `منح +${coinDelta} عملة`)
                  : tr(`Deduct ${coinDelta} Coins`, `הפחת ${coinDelta} מטבעות`, `خصم ${coinDelta} عملة`)}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          CREATE / EDIT STORE ITEM MODAL WITH LIVE STUDIOS
          ===================================================================== */}
      {isItemModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsItemModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {editingItem
                      ? tr('Edit Store Item', 'עריכת פריט חנות', 'تعديل عنصر المتجر')
                      : tr('Create Store Item', 'יצירת פריט חדש לחנות', 'إنشاء عنصر جديد للمتجر')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tr('Configure item metadata and preview live cosmetic styling', 'הגדר פרטי פריט וצפה בתצוגה מקדימה חיה', 'اضبط بيانات العنصر وشاهد المعاينة الحية')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-6">
              {/* Top Row: Type, Rarity, Coin Cost, Sort Order, Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tr('Item Type', 'סוג פריט', 'نوع العنصر')}
                  </label>
                  <select
                    value={formState.type}
                    disabled={Boolean(editingItem)}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value as StoreItemType })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-60"
                  >
                    <option value="AVATAR_FRAME">{tr('Avatar Frame', 'מסגרת אווטאר', 'إطار الصورة')}</option>
                    <option value="NICKNAME">{tr('Styled Nickname', 'כינוי מעוצב', 'الاسم المستعار')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tr('Rarity', 'נדירות', 'الندرة')}
                  </label>
                  <select
                    value={formState.rarity}
                    onChange={(e) => setFormState({ ...formState, rarity: e.target.value as StoreItemRarity })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="COMMON">COMMON</option>
                    <option value="RARE">RARE</option>
                    <option value="EPIC">EPIC</option>
                    <option value="LEGENDARY">LEGENDARY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tr('Coin Cost', 'מחיר במטבעות', 'التكلفة بالعملات')} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formState.coinCost}
                    onChange={(e) => setFormState({ ...formState, coinCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tr('Sort Order', 'סדר תצוגה', 'ترتيب العرض')}
                  </label>
                  <input
                    type="number"
                    value={formState.sortOrder ?? 0}
                    onChange={(e) => setFormState({ ...formState, sortOrder: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-full justify-center">
                    <input
                      type="checkbox"
                      checked={Boolean(formState.isActive)}
                      onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                      className="rounded text-brand-teal-700"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {tr('Active', 'פעיל', 'نشط')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Multilingual Names & Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.nameEn}
                    onChange={(e) => setFormState({ ...formState, nameEn: e.target.value })}
                    placeholder="e.g. Golden Halo"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={formState.descEn ?? ''}
                    onChange={(e) => setFormState({ ...formState, descEn: e.target.value })}
                    placeholder="English description (optional)"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-2" dir="rtl">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    שם בעברית *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.nameHe}
                    onChange={(e) => setFormState({ ...formState, nameHe: e.target.value })}
                    placeholder="לדוגמה: הילת זהב"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={formState.descHe ?? ''}
                    onChange={(e) => setFormState({ ...formState, descHe: e.target.value })}
                    placeholder="תיאור בעברית (אופציונלי)"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-2" dir="rtl">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    الاسم بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.nameAr}
                    onChange={(e) => setFormState({ ...formState, nameAr: e.target.value })}
                    placeholder="مثال: هالة ذهبية"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={formState.descAr ?? ''}
                    onChange={(e) => setFormState({ ...formState, descAr: e.target.value })}
                    placeholder="وصف بالعربية (اختياري)"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* ===============================================================
                  AVATAR FRAME STUDIO
                  =============================================================== */}
              {formState.type === 'AVATAR_FRAME' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="lg:col-span-8 space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-brand-teal-700 dark:text-brand-teal-300 flex items-center gap-1.5">
                      <Frame className="w-4 h-4" />
                      <span>{tr('Avatar Frame Studio', 'סטודיו מסגרת אווטאר', 'استوديو إطار الصورة')}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Preset CSS Class', 'תבנית CSS מוכנה', 'فئة CSS جاهزة')}
                        </label>
                        <select
                          value={FRAME_CSS_PRESETS.some((p) => p.value === (formState.frameCssClass || '')) ? (formState.frameCssClass || '') : ''}
                          onChange={(e) => setFormState({ ...formState, frameCssClass: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          {FRAME_CSS_PRESETS.map((p) => (
                            <option key={p.label} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Custom CSS Class', 'מחלקת CSS מותאמת', 'فئة CSS مخصصة')}
                        </label>
                        <input
                          type="text"
                          value={formState.frameCssClass ?? ''}
                          onChange={(e) => setFormState({ ...formState, frameCssClass: e.target.value })}
                          placeholder="frame-gold-glow"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Border Color', 'צבע מסגרת', 'لون الإطار')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formState.frameBorderColor || '#ffd700'}
                            onChange={(e) => setFormState({ ...formState, frameBorderColor: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formState.frameBorderColor ?? ''}
                            onChange={(e) => setFormState({ ...formState, frameBorderColor: e.target.value })}
                            placeholder="#ffd700"
                            className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Border Radius', 'עיגול פינות', 'استدارة الحواف')}
                        </label>
                        <select
                          value={formState.frameBorderRadius || '50%'}
                          onChange={(e) => setFormState({ ...formState, frameBorderRadius: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          {BORDER_RADIUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Overlay Frame Image URL (Optional)', 'כתובת תמונת מסגרת (אופציונלי)', 'رابط صورة الإطار (اختياري)')}
                        </label>
                        <input
                          type="text"
                          value={formState.frameImageUrl ?? ''}
                          onChange={(e) => setFormState({ ...formState, frameImageUrl: e.target.value })}
                          placeholder="https://... or /assets/frames/..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(formState.frameAnimated)}
                            onChange={(e) => setFormState({ ...formState, frameAnimated: e.target.checked })}
                            className="rounded text-brand-teal-700"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {tr('Enable Frame Animation (Pulse / Glow)', 'הפעל אנימציית מסגרת', 'تفعيل حركة الإطار')}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* LIVE Avatar Frame Preview */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {tr('Live Preview', 'תצוגה חיה', 'معاينة حية')}
                    </span>
                    <AvatarWithFrame
                      studentName={formState.nameEn || 'Noam Levi'}
                      frameItem={{
                        frameImageUrl: formState.frameImageUrl || null,
                        frameAnimated: Boolean(formState.frameAnimated),
                        frameCssClass: formState.frameCssClass || null,
                        frameBorderColor: formState.frameBorderColor || null,
                        frameBorderRadius: formState.frameBorderRadius || '50%',
                      }}
                      size="xl"
                    />
                    <div className="flex items-center gap-3">
                      <AvatarWithFrame
                        studentName="Noam Levi"
                        frameItem={{
                          frameImageUrl: formState.frameImageUrl || null,
                          frameAnimated: Boolean(formState.frameAnimated),
                          frameCssClass: formState.frameCssClass || null,
                          frameBorderColor: formState.frameBorderColor || null,
                          frameBorderRadius: formState.frameBorderRadius || '50%',
                        }}
                        size="md"
                      />
                      <AvatarWithFrame
                        studentName="Maya Cohen"
                        frameItem={{
                          frameImageUrl: formState.frameImageUrl || null,
                          frameAnimated: Boolean(formState.frameAnimated),
                          frameCssClass: formState.frameCssClass || null,
                          frameBorderColor: formState.frameBorderColor || null,
                          frameBorderRadius: formState.frameBorderRadius || '50%',
                        }}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  NICKNAME STUDIO
                  =============================================================== */}
              {formState.type === 'NICKNAME' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="lg:col-span-8 space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-brand-teal-700 dark:text-brand-teal-300 flex items-center gap-1.5">
                      <Type className="w-4 h-4" />
                      <span>{tr('Nickname Studio', 'סטודיו כינוי מעוצב', 'استوديو الاسم المستعار')}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Preset CSS Class', 'תבנית CSS מוכנה', 'فئة CSS جاهزة')}
                        </label>
                        <select
                          value={NICKNAME_CSS_PRESETS.some((p) => p.value === (formState.nicknameCssClass || '')) ? (formState.nicknameCssClass || '') : ''}
                          onChange={(e) => setFormState({ ...formState, nicknameCssClass: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          {NICKNAME_CSS_PRESETS.map((p) => (
                            <option key={p.label} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Custom CSS Class', 'מחלקת CSS מותאמת', 'فئة CSS مخصصة')}
                        </label>
                        <input
                          type="text"
                          value={formState.nicknameCssClass ?? ''}
                          onChange={(e) => setFormState({ ...formState, nicknameCssClass: e.target.value })}
                          placeholder="nickname-gold-legendary"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Text Color / Gradient', 'צבע טקסט', 'لون النص')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formState.nicknameColor?.startsWith('#') ? formState.nicknameColor : '#f59e0b'}
                            onChange={(e) => setFormState({ ...formState, nicknameColor: e.target.value })}
                            className="w-10 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formState.nicknameColor ?? ''}
                            onChange={(e) => setFormState({ ...formState, nicknameColor: e.target.value })}
                            placeholder="#f59e0b"
                            className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Font Weight & Style', 'סגנון גופן', 'نمط الخط')}
                        </label>
                        <select
                          value={formState.nicknameFont || 'font-bold'}
                          onChange={(e) => setFormState({ ...formState, nicknameFont: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          {NICKNAME_FONT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {tr('Badge Icon (Emoji)', 'אייקון תג (אימוג׳י)', 'أيقونة الشارة (إيموجي)')}
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {BADGE_EMOJI_PRESETS.map((emoji) => (
                            <button
                              key={emoji || 'none'}
                              type="button"
                              onClick={() => setFormState({ ...formState, nicknameBadgeIcon: emoji })}
                              className={`px-2 py-1 rounded-lg text-xs border ${
                                (formState.nicknameBadgeIcon || '') === emoji
                                  ? 'bg-brand-teal-900 text-white border-brand-teal-900 dark:bg-brand-teal-600'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {emoji || '∅'}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={formState.nicknameBadgeIcon ?? ''}
                          onChange={(e) => setFormState({ ...formState, nicknameBadgeIcon: e.target.value })}
                          placeholder="👑"
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none mt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(formState.nicknameGlow)}
                            onChange={(e) => setFormState({ ...formState, nicknameGlow: e.target.checked })}
                            className="rounded text-brand-teal-700"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {tr('Enable Text Glow', 'הפעל זוהר טקסט', 'تفعيل توهج النص')}
                          </span>
                        </label>
                        {formState.nicknameGlow && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formState.nicknameGlowColor || '#9333ea'}
                              onChange={(e) => setFormState({ ...formState, nicknameGlowColor: e.target.value })}
                              className="w-10 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formState.nicknameGlowColor ?? ''}
                              onChange={(e) => setFormState({ ...formState, nicknameGlowColor: e.target.value })}
                              placeholder="#9333ea"
                              className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LIVE Nickname Preview */}
                  <div className="lg:col-span-4 flex flex-col justify-center gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {tr('Light Surface Preview', 'תצוגה על רקע בהיר', 'معاينة فاتحة')}
                      </div>
                      <StyledNickname
                        name="Noam Levi"
                        nicknameItem={{
                          nicknameColor: formState.nicknameColor || null,
                          nicknameGlow: Boolean(formState.nicknameGlow),
                          nicknameGlowColor: formState.nicknameGlowColor || null,
                          nicknameFont: formState.nicknameFont || null,
                          nicknameBadgeIcon: formState.nicknameBadgeIcon || null,
                          nicknameCssClass: formState.nicknameCssClass || null,
                        }}
                        className="text-lg"
                      />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {tr('Dark Surface Preview', 'תצוגה על רקע כהה', 'معاينة داكنة')}
                      </div>
                      <StyledNickname
                        name="Noam Levi"
                        nicknameItem={{
                          nicknameColor: formState.nicknameColor || null,
                          nicknameGlow: Boolean(formState.nicknameGlow),
                          nicknameGlowColor: formState.nicknameGlowColor || null,
                          nicknameFont: formState.nicknameFont || null,
                          nicknameBadgeIcon: formState.nicknameBadgeIcon || null,
                          nicknameCssClass: formState.nicknameCssClass || null,
                        }}
                        className="text-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  {tr('Cancel', 'ביטול', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-brand-teal-900 hover:bg-brand-teal-800 dark:bg-brand-teal-600 dark:hover:bg-brand-teal-500 text-white text-xs sm:text-sm font-black shadow-md disabled:opacity-50"
                >
                  {editingItem ? tr('Save Changes', 'שמור שינויים', 'حفظ التغييرات') : tr('Create Item', 'צור פריט', 'إنشاء العنصر')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagementTab;
