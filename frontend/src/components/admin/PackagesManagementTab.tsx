import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { api } from '../../lib/api';
import { sessionTypesApi } from '../../lib/enterpriseApi';
import { Package } from '../../types';
import { PriceDisplay } from '../common/PriceDisplay';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';

export const PackagesManagementTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);

  // Platform currency query
  const { data: currencyData } = useQuery({
    queryKey: ['platform-currency'],
    queryFn: async () => {
      const res = await api.get('/settings/currency');
      return res.data;
    },
  });

  const platformCurrency = currencyData?.currency || 'USD';

  const updateCurrencyMutation = useMutation({
    mutationFn: async (curr: 'USD' | 'ILS') => {
      const res = await api.put('/settings/currency', { currency: curr });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-currency'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success(`Platform default currency set to ${data.currency} (${data.symbol})`);
    },
  });

  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data?.packages || res.data || [];
    },
  });

  const { data: sessionTypes = [] } = useQuery({
    queryKey: ['session-types'],
    queryFn: sessionTypesApi.list,
  });

  // Form state
  const [form, setForm] = useState({
    name: '',
    nameHe: '',
    description: '',
    descriptionHe: '',
    price: 100,
    originalPrice: '' as string | number,
    onSale: false,
    isPopular: false,
    currency: platformCurrency,
    validityDays: 30,
    sessionItems: [] as Array<{ sessionTypeId: string; quantity: number }>,
  });

  const openCreateModal = () => {
    setEditingPkg(null);
    setForm({
      name: '',
      nameHe: '',
      description: '',
      descriptionHe: '',
      price: 100,
      originalPrice: '',
      onSale: false,
      isPopular: false,
      currency: platformCurrency,
      validityDays: 30,
      sessionItems: sessionTypes.map((st) => ({ sessionTypeId: st.id, quantity: 0 })),
    });
    setIsCreating(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      nameHe: pkg.nameHe,
      description: pkg.description || '',
      descriptionHe: pkg.descriptionHe || '',
      price: Number(pkg.price),
      originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : '',
      onSale: Boolean(pkg.onSale),
      isPopular: Boolean(pkg.isPopular),
      currency: pkg.currency || platformCurrency,
      validityDays: pkg.validityDays || 30,
      sessionItems: sessionTypes.map((st) => {
        const found = pkg.sessionItems?.find((si) => si.sessionTypeId === st.id);
        return { sessionTypeId: st.id, quantity: found ? found.quantity : 0 };
      }),
    });
    setIsCreating(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        onSale: Boolean(form.onSale),
        isPopular: Boolean(form.isPopular),
        sessionItems: form.sessionItems.filter((si) => si.quantity > 0),
      };

      if (editingPkg) {
        return api.patch(`/packages/${editingPkg.id}`, payload);
      } else {
        return api.post('/packages', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success(editingPkg ? 'Package updated successfully' : 'New package created');
      setIsCreating(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save package'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/packages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
      queryClient.invalidateQueries({ queryKey: ['landingPackages'] });
      toast.success(language === 'he' ? 'החבילה נמחקה בהצלחה' : 'Package deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה במחיקת החבילה' : 'Failed to delete package'));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with Currency Switcher & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-teal-800 dark:text-brand-teal-400" />
            {language === 'he' ? 'חבילות שיעורים ומחירון מכירות' : 'Lesson Packages & Promotional Pricing'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'he'
              ? 'יצירת חבילות עם מכסות שיעורים לפי משך, הגדרת מחירי מבצע והנחות, והחלפת מטבע פלטפורמה (USD / ILS).'
              : 'Build packages with session quotas, configure promotional strike-through sales prices, and toggle platform currency (USD / ILS).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => updateCurrencyMutation.mutate('USD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                platformCurrency === 'USD'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => updateCurrencyMutation.mutate('ILS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                platformCurrency === 'ILS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ₪ ILS
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-brand-olive-300" />
            <span>{language === 'he' ? 'צור חבילה חדשה' : 'Create Package'}</span>
          </button>
        </div>
      </div>

      {/* Package Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingPkg ? 'Edit Package & Sale Pricing' : 'Create New Session Package'}
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Package Title (EN)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Conversational Starter Pack"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Package Title (HE)</label>
                  <input
                    type="text"
                    value={form.nameHe}
                    onChange={(e) => setForm({ ...form, nameHe: e.target.value })}
                    placeholder="לדוגמה: ערכת שיחה למתחילים"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Pricing & Sale Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-rose-500" /> Pricing & Sale Strike-Through
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Actual Selling Price ({form.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Original Price (Before Sale Strike)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Currency</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ILS">ILS (₪)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.onSale}
                      onChange={(e) => setForm({ ...form, onSale: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-start">
                      <span className="text-xs font-black text-rose-900 dark:text-rose-200 block">
                        {language === 'he' ? 'מבצע מיוחד (Sale Offer)' : 'Special Promotion (Sale)'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {language === 'he' ? 'מציג תגית מבצע ומחיר קודם מחוק' : 'Displays promo badge and struck-out price'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 cursor-pointer hover:bg-amber-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.isPopular}
                      onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 accent-amber-600"
                    />
                    <div className="text-start">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-200 block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{language === 'he' ? 'הבחירה הפופולרית ביותר (Most Popular)' : 'Most Popular Choice'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {language === 'he' ? 'תגית זהב יוקרתית והדגשת החבילה' : 'Golden highlight badge & featured styling'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Session Items Quotas */}
              <div className="p-4 rounded-2xl bg-brand-teal-50/40 dark:bg-brand-teal-950/20 border border-brand-teal-200/60 dark:border-brand-teal-800/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                    <label className="text-xs font-black uppercase tracking-wider text-brand-teal-900 dark:text-brand-teal-200">
                      {language === 'he' ? 'מכסות שיעורים לפי משך וסוג' : 'Session Types & Durations Quotas'}
                    </label>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-850 text-brand-teal-800 dark:text-brand-teal-300 font-black text-xs border border-brand-teal-200 dark:border-brand-teal-800 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {language === 'he'
                        ? `סה״כ: ${form.sessionItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} שיעורים בחבילה`
                        : `Total: ${form.sessionItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} Sessions in Package`}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {sessionTypes.map((st) => {
                    const item = form.sessionItems.find((si) => si.sessionTypeId === st.id);
                    const qty = item ? item.quantity : 0;
                    const hasQuantity = qty > 0;
                    return (
                      <div
                        key={st.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          hasQuantity
                            ? 'border-brand-teal-400 dark:border-brand-teal-600 bg-white dark:bg-slate-850 shadow-xs ring-1 ring-brand-teal-400/30'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-300 font-mono font-black text-xs border border-brand-teal-200/60 dark:border-brand-teal-800/60">
                            {st.durationMinutes} {language === 'he' ? 'דק׳' : 'min'}
                          </span>
                          {hasQuantity && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </div>

                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                            {language === 'he' && st.labelHe ? st.labelHe : st.labelEn}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {language === 'he' ? st.labelEn : st.labelHe}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = Math.max(0, qty - 1);
                              const updated = form.sessionItems.map((si) =>
                                si.sessionTypeId === st.id ? { ...si, quantity: nextVal } : si
                              );
                              setForm({ ...form, sessionItems: updated });
                            }}
                            disabled={qty <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 font-bold flex items-center justify-center transition-colors active:scale-95"
                          >
                            -
                          </button>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                const updated = form.sessionItems.map((si) =>
                                  si.sessionTypeId === st.id ? { ...si, quantity: val } : si
                                );
                                setForm({ ...form, sessionItems: updated });
                              }}
                              className="w-14 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center text-slate-900 dark:text-white"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">
                              {language === 'he' ? 'שיעורים' : 'slots'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = qty + 1;
                              const updated = form.sessionItems.map((si) =>
                                si.sessionTypeId === st.id ? { ...si, quantity: nextVal } : si
                              );
                              setForm({ ...form, sessionItems: updated });
                            }}
                            className="w-7 h-7 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-800 dark:text-brand-teal-300 hover:bg-brand-teal-200 dark:hover:bg-brand-teal-900 font-bold flex items-center justify-center transition-colors active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description (EN)</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description (HE)</label>
                  <textarea
                    rows={2}
                    value={form.descriptionHe}
                    onChange={(e) => setForm({ ...form, descriptionHe: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || saveMutation.isPending}
                className="px-6 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`p-6 rounded-3xl border shadow-xs flex flex-col justify-between transition-all relative overflow-hidden bg-white dark:bg-slate-900 ${
              pkg.isPopular
                ? 'border-amber-400 dark:border-amber-500/80 ring-2 ring-amber-400/30 shadow-md'
                : pkg.onSale
                ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {/* Most Popular Badge */}
            {pkg.isPopular && (
              <div className="absolute top-0 start-0 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-ee-2xl shadow-sm flex items-center gap-1.5 z-10">
                <Sparkles className="w-3 h-3 text-white fill-white shrink-0" />
                <span>{language === 'he' ? 'הבחירה הפופולרית ביותר' : 'Most Popular Choice'}</span>
              </div>
            )}

            {/* Sale Offer Badge */}
            {pkg.onSale && (
              <span className="absolute top-0 end-0 bg-gradient-to-l from-rose-600 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-es-2xl shadow-xs z-10">
                {language === 'he' ? 'מבצע מיוחד' : 'Sale Offer'}
              </span>
            )}

            <div>
              <div className="flex items-baseline justify-between mb-3 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-teal-800 dark:text-brand-teal-400">
                  {pkg.sessionItems?.length
                    ? pkg.sessionItems.map((si) => `${si.quantity}x ${si.sessionType?.name}`).join(', ')
                    : `${pkg.totalLessons} Lessons`}
                </span>
              </div>

              <div className="mb-4">
                <PriceDisplay
                  price={pkg.price}
                  originalPrice={pkg.originalPrice}
                  onSale={pkg.onSale}
                  currency={pkg.currency || platformCurrency}
                  size="lg"
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5" dir="rtl">{pkg.nameHe}</p>
              {pkg.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">{pkg.description}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Valid {pkg.validityDays} days</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(pkg)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    const confirmed = await confirmDialog({
                      title: 'Delete Package',
                      titleHe: 'מחיקת חבילת שיעורים',
                      message: `Are you sure you want to permanently delete package "${pkg.name}"? It will be removed from all catalogs and the landing page.`,
                      messageHe: `האם אתה בטוח שברצונך למחוק לצמיתות את החבילה "${pkg.nameHe || pkg.name}"? היא תוסר מכל הקטלוגים ומדף הנחיתה.`,
                      confirmText: 'Delete Package',
                      confirmTextHe: 'מחק חבילה',
                      variant: 'danger',
                    });
                    if (confirmed) {
                      deleteMutation.mutate(pkg.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={language === 'he' ? 'מחק חבילה' : 'Delete Package'}
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
