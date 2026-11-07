import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Languages,
  Check,
  Sparkles,
  Lock,
} from 'lucide-react';

export const ProfileSettingsModal: React.FC = () => {
  const { user, setUser, setLanguage, language, isProfileModalOpen, closeProfileModal } =
    useAuthStore();
  const { t } = useTranslation();
  const isHe = language === 'he';

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Form states - Info
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [selectedLang, setSelectedLang] = useState<'en' | 'he'>(
    user?.languagePref === 'he' ? 'he' : 'en'
  );
  const [infoError, setInfoError] = useState<string | null>(null);

  // Form states - Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setSelectedLang(user.languagePref === 'he' ? 'he' : 'en');
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { firstName: string; lastName: string; languagePref: 'en' | 'he' }) => {
      const res = await api.patch('/auth/profile', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      if (selectedLang !== language) {
        setLanguage(selectedLang);
      }
      toast.success(
        isHe ? 'פרטי הפרופיל עודכנו בהצלחה!' : 'Profile details updated successfully!'
      );
      closeProfileModal();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isHe ? 'שגיאה בעדכון הפרופיל' : 'Failed to update profile');
      setInfoError(msg);
      toast.error(msg);
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { oldPassword: string; newPassword: string }) => {
      const res = await api.post('/auth/change-password', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        isHe ? 'הסיסמה שונתה בהצלחה!' : 'Password changed successfully!'
      );
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      closeProfileModal();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isHe ? 'שגיאה בשינוי הסיסמה' : 'Failed to change password');
      setPassError(msg);
      toast.error(msg);
    },
  });

  if (!isProfileModalOpen || !user) return null;

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setInfoError(isHe ? 'שם פרטי ושם משפחה הם שדות חובה' : 'First and last name are required');
      return;
    }
    setInfoError(null);
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      languagePref: selectedLang,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!oldPassword) {
      setPassError(isHe ? 'אנא הזן את הסיסמה הנוכחית' : 'Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPassError(
        isHe
          ? 'הסיסמה החדשה חייבת להכיל לפחות 8 תווים'
          : 'New password must be at least 8 characters'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError(isHe ? 'הסיסמאות אינן תואמות' : 'Passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      oldPassword,
      newPassword,
    });
  };

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col text-start">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Elegant Initials Avatar Badge - No image used */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal-500 via-teal-600 to-indigo-700 text-white font-black text-base flex items-center justify-center shadow-md ring-2 ring-teal-400/30 shrink-0">
              {initials || 'U'}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {user.email}
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800 uppercase tracking-wider">
                {user.role === 'SUPER_ADMIN' ? 'Platform Owner' : user.role}
              </span>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-brand-teal-600 text-brand-teal-600 dark:text-brand-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isHe ? 'פרטים אישיים' : 'Personal Details'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'password'
                ? 'border-brand-teal-600 text-brand-teal-600 dark:text-brand-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isHe ? 'שינוי סיסמה' : 'Change Password'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' ? (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              {infoError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{infoError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isHe ? 'שם פרטי' : 'First Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isHe ? 'שם משפחה' : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'כתובת אימייל (קבועה)' : 'Email Address (Read-only)'}
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'שפת ממשק מועדפת' : 'Preferred Language'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLang('en')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedLang === 'en'
                        ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-400 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>English</span>
                    {selectedLang === 'en' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLang('he')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedLang === 'he'
                        ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-400 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>עברית (Hebrew)</span>
                    {selectedLang === 'he' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {updateProfileMutation.isPending
                      ? isHe ? 'שומר...' : 'Saving...'
                      : isHe ? 'שמור שינויים' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'סיסמה נוכחית' : 'Current Password'}
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 pe-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'סיסמה חדשה (לפחות 8 תווים)' : 'New Password (min 8 characters)'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pe-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'אימות סיסמה חדשה' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {changePasswordMutation.isPending
                      ? isHe ? 'מעדכן סיסמה...' : 'Updating password...'
                      : isHe ? 'עדכן סיסמה' : 'Update Password'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
