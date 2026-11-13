import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { sessionTypesApi } from '../../lib/enterpriseApi';
import { Package } from '../../types';
import { PriceDisplay } from '../common/PriceDisplay';
import { toast } from '../../store/toastStore';
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
      toast.success('Package deactivated');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with Currency Switcher & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-teal-800 dark:text-brand-teal-400" />
            Lesson Packages & Promotional Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build packages with session quotas, configure promotional strike-through sales prices, and toggle platform currency (USD / ILS).
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
            <span>Create Package</span>
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

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.onSale}
                    onChange={(e) => setForm({ ...form, onSale: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Flag this package as "On Sale" (displays promo badge and crossed-out old price)
                  </span>
                </label>
              </div>

              {/* Session Items Quotas */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Included Sessions in Package (By Duration)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {sessionTypes.map((st) => {
                    const item = form.sessionItems.find((si) => si.sessionTypeId === st.id);
                    const qty = item ? item.quantity : 0;
                    return (
                      <div key={st.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.labelEn}</div>
                        <div className="text-[10px] text-slate-400">{st.durationMinutes} minutes</div>
                        <div className="flex items-center gap-2 mt-2">
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
                            className="w-20 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-center"
                          />
                          <span className="text-xs text-slate-500">sessions</span>
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
              pkg.onSale
                ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {pkg.onSale && (
              <span className="absolute top-0 end-0 bg-gradient-to-l from-rose-600 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl shadow-xs">
                Sale Offer
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
                  onClick={() => {
                    if (confirm(`Deactivate package ${pkg.name}?`)) deleteMutation.mutate(pkg.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
