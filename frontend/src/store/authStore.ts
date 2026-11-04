import { create } from 'zustand';
import { User, LanguagePref } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  language: LanguagePref;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setLanguage: (lang: LanguagePref) => void;
  logout: () => void;
}

const savedLang = (localStorage.getItem('learnhebrew_lang') as LanguagePref) || 'en';
const savedToken = localStorage.getItem('learnhebrew_token') || null;
const savedUser = localStorage.getItem('learnhebrew_user')
  ? JSON.parse(localStorage.getItem('learnhebrew_user')!)
  : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  accessToken: savedToken,
  language: savedLang,

  setAuth: (user, token) => {
    localStorage.setItem('learnhebrew_token', token);
    localStorage.setItem('learnhebrew_user', JSON.stringify(user));
    set({ user, accessToken: token });
  },

  setUser: (user) => {
    localStorage.setItem('learnhebrew_user', JSON.stringify(user));
    set({ user });
  },

  setLanguage: (language) => {
    localStorage.setItem('learnhebrew_lang', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    set({ language });
  },

  logout: () => {
    localStorage.removeItem('learnhebrew_token');
    localStorage.removeItem('learnhebrew_user');
    set({ user: null, accessToken: null });
  },
}));

