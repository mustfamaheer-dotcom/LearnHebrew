import { create } from 'zustand';
import { User, LanguagePref } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  language: LanguagePref;
  isProfileModalOpen: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setLanguage: (lang: LanguagePref) => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  logout: () => void;
}

function resolveUserLanguage(user: User | null): LanguagePref {
  const manual = localStorage.getItem('learnhebrew_lang_manual') as LanguagePref;
  if (manual && ['en', 'he', 'ar'].includes(manual)) {
    return manual;
  }

  if (user) {
    const nativeCode = user.nativeLanguage?.code?.toLowerCase();
    const nativeLabel = user.nativeLanguage?.labelEn?.toLowerCase();
    const isArabic = nativeCode === 'ar' || nativeLabel === 'arabic' || user.languagePref === 'ar';
    if (isArabic) {
      return 'ar';
    }
    if (nativeCode === 'he' || nativeLabel === 'hebrew' || user.languagePref === 'he') {
      return 'he';
    }
    if (user.languagePref && ['en', 'he', 'ar'].includes(user.languagePref)) {
      return user.languagePref;
    }
  }

  const saved = localStorage.getItem('learnhebrew_lang') as LanguagePref;
  if (saved && ['en', 'he', 'ar'].includes(saved)) {
    return saved;
  }

  return 'en';
}

const savedToken = localStorage.getItem('learnhebrew_token') || null;
const savedUser: User | null = localStorage.getItem('learnhebrew_user')
  ? JSON.parse(localStorage.getItem('learnhebrew_user')!)
  : null;
const initialLang = resolveUserLanguage(savedUser);

// Apply initial document direction and language code
if (typeof document !== 'undefined') {
  document.documentElement.dir = (initialLang === 'he' || initialLang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLang;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  accessToken: savedToken,
  language: initialLang,
  isProfileModalOpen: false,

  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),

  setAuth: (user, token) => {
    localStorage.setItem('learnhebrew_token', token);
    localStorage.setItem('learnhebrew_user', JSON.stringify(user));
    const lang = resolveUserLanguage(user);
    localStorage.setItem('learnhebrew_lang', lang);
    document.documentElement.dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    set({ user, accessToken: token, language: lang });
  },

  setUser: (user) => {
    localStorage.setItem('learnhebrew_user', JSON.stringify(user));
    set({ user });
  },

  setLanguage: (language) => {
    localStorage.setItem('learnhebrew_lang', language);
    localStorage.setItem('learnhebrew_lang_manual', language);
    document.documentElement.dir = (language === 'he' || language === 'ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    set({ language });
  },

  logout: () => {
    localStorage.removeItem('learnhebrew_token');
    localStorage.removeItem('learnhebrew_user');
    localStorage.removeItem('learnhebrew_lang_manual');
    set({ user: null, accessToken: null });
  },
}));

