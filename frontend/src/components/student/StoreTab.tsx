import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  Sparkles,
  ShoppingBag,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  PackageOpen,
  TrendingUp,
  TrendingDown,
  History,
  X,
  CheckCircle2,
  Loader2,
  Crown,
  Frame,
  Type as TypeIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import { triggerConfetti } from '../../utils/confetti';
import { haptics } from '../../utils/haptics';
import { AvatarWithFrame } from '../common/AvatarWithFrame';
import { StyledNickname } from '../common/StyledNickname';
import {
  StoreItem,
  StoreItemRarity,
  StoreItemType,
  CoinTransactionType,
  useStoreItems,
  useMyCoins,
  useMyInventory,
  useRedeemItem,
  useEquipItem,
} from '../../hooks/useStore';

const RARITY_STYLES: Record<
  StoreItemRarity,
  { badge: string; border: string; labelEn: string; labelHe: string; labelAr: string }
> = {
  COMMON: {
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    border: 'border-slate-200/80 dark:border-slate-800',
    labelEn: 'Common',
    labelHe: 'נפוץ',
    labelAr: 'عادي',
  },
  RARE: {
    badge: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    border: 'border-sky-200/80 dark:border-sky-800/60',
    labelEn: 'Rare',
    labelHe: 'נדיר',
    labelAr: 'نادر',
  },
  EPIC: {
    badge: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    border: 'border-purple-200/80 dark:border-purple-800/60',
    labelEn: 'Epic',
    labelHe: 'אפי',
    labelAr: 'ملحمي',
  },
  LEGENDARY: {
    badge:
      'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-400 shadow-xs animate-pulse',
    border: 'border-amber-300/90 dark:border-amber-600/70 shadow-amber-500/10',
    labelEn: 'Legendary',
    labelHe: 'אגדי',
    labelAr: 'أسطوري',
  },
};

function useAnimatedNumber(target: number, durationMs = 450): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return display;
}

export const StoreTab: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { language, isRtl } = useTranslation();
  const isHe = language === 'he';
  const isAr = language === 'ar';
  const loc = (ar: string, he: string, en: string) => (isAr ? ar : isHe ? he : en);
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<'ALL' | StoreItemType>('ALL');
  const [rarityFilter, setRarityFilter] = useState<'ALL' | StoreItemRarity>('ALL');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<StoreItem | null>(null);

  const studentName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    loc('طالب', 'תלמיד', 'Student');

  const { data: items = [], isLoading: itemsLoading } = useStoreItems({
    activeOnly: true,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    rarity: rarityFilter === 'ALL' ? undefined : rarityFilter,
  });

  const { data: myCoinsData, isLoading: coinsLoading } = useMyCoins();
  const { data: inventory = [], isLoading: inventoryLoading } = useMyInventory();

  const redeemMutation = useRedeemItem();
  const equipMutation = useEquipItem();

  const coins = myCoinsData?.coins ?? 0;
  const animatedCoins = useAnimatedNumber(coins);
  const transactions = myCoinsData?.transactions ?? [];

  const { totalEarned, totalSpent } = useMemo(() => {
    if (
      typeof myCoinsData?.totalEarned === 'number' &&
      typeof myCoinsData?.totalSpent === 'number'
    ) {
      return {
        totalEarned: myCoinsData.totalEarned,
        totalSpent: myCoinsData.totalSpent,
      };
    }
    let earned = 0;
    let spent = 0;
    for (const tx of transactions) {
      if (tx.amount > 0) earned += tx.amount;
      else if (tx.amount < 0) spent += Math.abs(tx.amount);
    }
    return { totalEarned: earned, totalSpent: spent };
  }, [myCoinsData, transactions]);

  const inventoryByItemId = useMemo(() => {
    const map = new Map<string, (typeof inventory)[number]>();
    for (const entry of inventory) {
      map.set(entry.storeItemId, entry);
    }
    return map;
  }, [inventory]);

  const getLocalizedName = (item: StoreItem) =>
    isAr ? item.nameAr || item.nameEn : isHe ? item.nameHe || item.nameEn : item.nameEn;

  const getLocalizedDesc = (item: StoreItem) =>
    isAr
      ? item.descAr || item.descEn || ''
      : isHe
      ? item.descHe || item.descEn || ''
      : item.descEn || '';

  const getRarityLabel = (rarity: StoreItemRarity) => {
    const cfg = RARITY_STYLES[rarity];
    return isAr ? cfg.labelAr : isHe ? cfg.labelHe : cfg.labelEn;
  };

  const getTxTypeLabel = (type: CoinTransactionType) => {
    switch (type) {
      case 'EARNED_FROM_POINTS':
        return loc('مكافأة نقاط', 'רווח מנקודות', 'Points Milestone');
      case 'REDEEMED_ITEM':
        return loc('شراء عنصر', 'מימוש פריט', 'Item Redeemed');
      case 'ADMIN_GRANT':
        return loc('منحة إدارية', 'הענקת מנהל', 'Admin Grant');
      case 'ADMIN_DEDUCT':
        return loc('خصم إداري', 'ניכוי מנהל', 'Admin Deduct');
      default:
        return type;
    }
  };

  const handleConfirmRedeem = async () => {
    if (!redeemTarget) return;
    try {
      await redeemMutation.mutateAsync({ storeItemId: redeemTarget.id });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      haptics.success();
      triggerConfetti.celebrate();
      toast.success(
        loc(
          `تم استبدال "${getLocalizedName(redeemTarget)}" بنجاح!`,
          `הפריט "${getLocalizedName(redeemTarget)}" נרכש בהצלחה!`,
          `Successfully redeemed "${getLocalizedName(redeemTarget)}"!`
        )
      );
      setRedeemTarget(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        loc('تعذر إتمام عملية الاستبدال.', 'מימוש הפריט נכשל.', 'Failed to redeem item.');
      toast.error(msg);
    }
  };

  const handleToggleEquip = async (storeItemId: string, currentlyEquipped: boolean, itemName: string) => {
    try {
      await equipMutation.mutateAsync({
        storeItemId,
        equip: !currentlyEquipped,
      });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      haptics.tap();
      toast.success(
        !currentlyEquipped
          ? loc(`تم تجهيز "${itemName}"!`, `"${itemName}" צויד בהצלחה!`, `Equipped "${itemName}"!`)
          : loc(`تم إلغاء تجهيز "${itemName}".`, `"${itemName}" הוסר.`, `Unequipped "${itemName}".`)
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        loc('تعذر تحديث حالة التجهيز.', 'עדכון הציוד נכשל.', 'Failed to update equipped item.');
      toast.error(msg);
    }
  };

  const renderItemPreview = (item: StoreItem) => {
    if (item.type === 'AVATAR_FRAME') {
      return (
        <AvatarWithFrame
          avatarUrl={user?.avatarUrl}
          studentName={studentName}
          frameItem={item}
          size="lg"
        />
      );
    }
    return (
      <div className="px-3 py-2 rounded-2xl bg-slate-900/5 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 max-w-full overflow-hidden">
        <StyledNickname
          name={studentName}
          nicknameItem={item}
          className="text-base font-extrabold"
          truncate
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Coin Balance Header */}
      <div className="bg-gradient-to-r from-brand-teal-900 via-brand-teal-800 to-brand-olive-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-amber-300 backdrop-blur-md">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{loc('متجر المكافآت والمظاهر', 'חנות הפרסים והעיצובים', 'Rewards & Cosmetics Store')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {loc('متجر إنجرو للطلاب', 'חנות התלמידים של Engrew', 'Engrew Student Store')}
            </h2>
            <p className="text-xs sm:text-sm text-brand-teal-100 max-w-xl leading-relaxed">
              {loc(
                'اكسب 10 عملات تلقائياً مقابل كل 100 نقطة XP تحصل عليها، واستبدلها بإطارات صور وألقاب مميزة تظهر في لوحة الصدارة!',
                'צבור 10 מטבעות אוטומטית על כל 100 נקודות XP, והחלף אותם במסגרות אווטאר וכינויים מעוצבים שיופיעו בלוח המובילים!',
                'Earn 10 coins automatically for every 100 XP points you gain, and redeem exclusive avatar frames and styled nicknames shown across the leaderboard!'
              )}
            </p>
          </div>

          {/* Coin Stats Cards */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            {/* Main Balance */}
            <div className="bg-white/15 backdrop-blur-md border border-amber-300/40 rounded-2xl px-5 py-3.5 min-w-[140px] text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-2xl sm:text-3xl">
                <Coins className="w-6 h-6 text-amber-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                <span>{coinsLoading ? '—' : animatedCoins.toLocaleString()}</span>
              </div>
              <p className="text-[11px] font-bold text-amber-100 uppercase tracking-wider mt-0.5">
                {loc('رصيد العملات', 'יתרת מטבעות', 'Coin Balance')}
              </p>
            </div>

            {/* Total Earned */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 min-w-[115px] text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-extrabold text-lg">
                <TrendingUp className="w-4 h-4" />
                <span>+{totalEarned.toLocaleString()}</span>
              </div>
              <p className="text-[10px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                {loc('إجمالي المكتسب', 'סה״כ נצברו', 'Total Earned')}
              </p>
            </div>

            {/* Total Spent */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 min-w-[115px] text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-extrabold text-lg">
                <TrendingDown className="w-4 h-4" />
                <span>-{totalSpent.toLocaleString()}</span>
              </div>
              <p className="text-[10px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                {loc('إجمالي المنفق', 'סה״כ הוצאו', 'Total Spent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'ALL' as const, label: loc('الكل', 'הכל', 'All'), icon: Sparkles },
            { id: 'AVATAR_FRAME' as const, label: loc('إطارات الصور', 'מסגרות אווטאר', 'Avatar Frames'), icon: Frame },
            { id: 'NICKNAME' as const, label: loc('الألقاب المميزة', 'כינויים מעוצבים', 'Nicknames'), icon: TypeIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  active
                    ? 'bg-brand-teal-800 text-white border-brand-teal-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rarity Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setRarityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              rarityFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {loc('كل الندرات', 'כל הרמות', 'All Rarities')}
          </button>
          {(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as StoreItemRarity[]).map((rarity) => {
            const active = rarityFilter === rarity;
            return (
              <button
                key={rarity}
                type="button"
                onClick={() => setRarityFilter(rarity)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                  active
                    ? `${RARITY_STYLES[rarity].badge} ring-2 ring-brand-teal-500/30`
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {getRarityLabel(rarity)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Store Item Grid */}
      {itemsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {loc('لا توجد عناصر مطابقة للتصفية الحالية.', 'לא נמצאו פריטים התואמים לסינון.', 'No store items match your current filters.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const ownedEntry = inventoryByItemId.get(item.id);
            const isOwned = Boolean(ownedEntry);
            const isEquipped = Boolean(ownedEntry?.isEquipped);
            const canAfford = coins >= item.coinCost;
            const rarityStyle = RARITY_STYLES[item.rarity] || RARITY_STYLES.COMMON;
            const localizedName = getLocalizedName(item);
            const localizedDesc = getLocalizedDesc(item);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${rarityStyle.border} shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4`}
              >
                {/* Top Row: Rarity Badge + Coin Cost */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${rarityStyle.badge}`}
                  >
                    {item.rarity === 'LEGENDARY' && <Crown className="w-3 h-3" />}
                    <span>{getRarityLabel(item.rarity)}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{item.coinCost.toLocaleString()}</span>
                  </span>
                </div>

                {/* Live Preview Box */}
                <div className="h-28 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center p-4">
                  {renderItemPreview(item)}
                </div>

                {/* Item Title & Description */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {localizedName}
                  </h3>
                  {localizedDesc && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {localizedDesc}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div>
                  {isOwned ? (
                    <button
                      type="button"
                      disabled={equipMutation.isPending}
                      onClick={() => handleToggleEquip(item.id, isEquipped, localizedName)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-brand-teal-800 hover:bg-brand-teal-700 text-white shadow-xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {isEquipped
                          ? loc('مجهز حالياً · إزالة', 'מצויד · הסר', 'Equipped · Unequip')
                          : loc('مملوك · تجهيز', 'בבעלותך · צייד', 'Owned · Equip')}
                      </span>
                    </button>
                  ) : canAfford ? (
                    <button
                      type="button"
                      onClick={() => setRedeemTarget(item)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {loc(
                          `استبدال بـ ${item.coinCost} عملة`,
                          `רכוש ב-${item.coinCost} מטבעות`,
                          `Redeem for ${item.coinCost} Coins`
                        )}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {loc(
                          `تحتاج ${item.coinCost - coins} عملة إضافية`,
                          `חסרים ${item.coinCost - coins} מטבעות`,
                          `Need ${item.coinCost - coins} more coins`
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. My Inventory Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-700 dark:text-brand-teal-300">
              <PackageOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {loc('مقتنياتي', 'המלאי שלי', 'My Inventory')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loc(
                  'قم بتجهيز أو إزالة الإطارات والألقاب التي قمت بشرائها.',
                  'צייד או הסר מסגרות וכינויים שרכשת.',
                  'Equip or unequip your purchased frames and nicknames.'
                )}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {inventory.length} {loc('عناصر', 'פריטים', 'items')}
          </span>
        </div>

        {inventoryLoading ? (
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : inventory.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <Sparkles className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {loc(
                'مخزونك فارغ حالياً. ابدأ بجمع العملات وشراء أول عنصر لك!',
                'המלאי שלך ריק. התחל לאסוף פריטים מהחנות!',
                'Your inventory is empty. Start collecting!'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((entry) => {
              const item = entry.storeItem;
              const localizedName = getLocalizedName(item);
              const rarityStyle = RARITY_STYLES[item.rarity] || RARITY_STYLES.COMMON;

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    entry.isEquipped
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {item.type === 'AVATAR_FRAME' ? (
                        <AvatarWithFrame
                          avatarUrl={user?.avatarUrl}
                          studentName={studentName}
                          frameItem={item}
                          size="md"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-slate-950/60 flex items-center justify-center">
                          <TypeIcon className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      {item.type === 'NICKNAME' ? (
                        <StyledNickname
                          name={localizedName}
                          nicknameItem={item}
                          className="text-xs font-extrabold"
                          truncate
                        />
                      ) : (
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {localizedName}
                        </p>
                      )}
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${rarityStyle.badge}`}
                      >
                        {getRarityLabel(item.rarity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={equipMutation.isPending}
                    onClick={() => handleToggleEquip(item.id, entry.isEquipped, localizedName)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold shrink-0 cursor-pointer transition-all ${
                      entry.isEquipped
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {entry.isEquipped
                      ? loc('إزالة', 'הסר', 'Unequip')
                      : loc('تجهيز', 'צייד', 'Equip')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Coin Transaction History Accordion */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setHistoryOpen((prev) => !prev)}
          className="w-full px-6 py-5 flex items-center justify-between gap-4 text-start hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {loc('سجل معاملات العملات', 'היסטוריית תנועות מטבעות', 'Coin Transaction History')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loc(
                  `${transactions.length} معاملات مسجلة`,
                  `${transactions.length} תנועות מתועדות`,
                  `${transactions.length} recorded transactions`
                )}
              </p>
            </div>
          </div>
          {historyOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {historyOpen && (
          <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {loc('لا توجد معاملات عملات بعد.', 'אין תנועות מטבעות עדיין.', 'No coin transactions yet.')}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => {
                  const isPositive = tx.amount >= 0;
                  return (
                    <div
                      key={tx.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                            isPositive
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <Coins className="w-3 h-3" />
                          <span>
                            {isPositive ? `+${tx.amount}` : tx.amount}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.description || getTxTypeLabel(tx.type)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {getTxTypeLabel(tx.type)} •{' '}
                            {new Date(tx.createdAt).toLocaleDateString(
                              isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        {loc('الرصيد بعد:', 'יתרה אחרי:', 'Balance:')}{' '}
                        <span className="text-slate-900 dark:text-white font-black">
                          {tx.coinsAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Custom RedeemConfirmModal (Never browser alert/confirm) */}
      {redeemTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {loc('تأكيد الاستبدال', 'אישור רכישה', 'Confirm Redemption')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRedeemTarget(null)}
                disabled={redeemMutation.isPending}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center gap-3 text-center">
              {renderItemPreview(redeemTarget)}
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {getLocalizedName(redeemTarget)}
                </p>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    (RARITY_STYLES[redeemTarget.rarity] || RARITY_STYLES.COMMON).badge
                  }`}
                >
                  {getRarityLabel(redeemTarget.rarity)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  {loc('التكلفة:', 'עלות:', 'Cost:')}
                </span>
                <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> {redeemTarget.coinCost.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  {loc('رصيدك الحالي:', 'יתרה נוכחית:', 'Current Balance:')}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {coins.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-200 font-bold">
                  {loc('الرصيد بعد الاستبدال:', 'יתרה לאחר הרכישה:', 'Balance After:')}
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {(coins - redeemTarget.coinCost).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={redeemMutation.isPending}
                onClick={() => setRedeemTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                {loc('إلغاء', 'ביטול', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={redeemMutation.isPending}
                onClick={handleConfirmRedeem}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-teal-700 to-brand-teal-800 hover:from-brand-teal-600 hover:to-brand-teal-700 text-white text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {redeemMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{loc('تأكيد الاستبدال', 'אשר רכישה', 'Confirm Redeem')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreTab;
