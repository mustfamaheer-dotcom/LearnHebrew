import { create } from 'zustand';
import { User, LanguagePref } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  language: LanguagePref;
  isProfileModalOpen: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setLanguage: (lang: LanguagePref) => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  logout: () => void;
}

/**
 * Returns a user-specific storage key so user preferences never collide
 * or bleed into other accounts on shared computers/devices.
 */
export function getUserLanguageKey(userId: string): string {
  return `engrew_lang_user_${userId}`;
}

/**
 * Resolves the active language preference:
 * - If user is logged in: user's personal choice (local or DB profile) > native language > platform default
 * - If guest: guest preference > browser language > platform default
 */
export function resolveUserLanguage(user: User | null): LanguagePref {
  if (user && user.id) {
    // 1. Highest priority for logged-in user: Explicit preference saved specifically for this user ID
    if (typeof window !== 'undefined') {
      const userStored = localStorage.getItem(getUserLanguageKey(user.id)) as LanguagePref;
      if (userStored && ['en', 'he', 'ar'].includes(userStored)) {
        return userStored;
      }
    }

    // 2. Database preferred language stored on user profile record
    if (user.languagePref && ['en', 'he', 'ar'].includes(user.languagePref)) {
      return user.languagePref as LanguagePref;
    }

    // 3. Fallback to native language if specified
    const nativeCode = user.nativeLanguage?.code?.toLowerCase();
    const nativeLabel = user.nativeLanguage?.labelEn?.toLowerCase();
    if (nativeCode === 'ar' || nativeLabel === 'arabic') {
      return 'ar';
    }
    if (nativeCode === 'he' || nativeLabel === 'hebrew') {
      return 'he';
    }
    if (nativeCode === 'en' || nativeLabel === 'english') {
      return 'en';
    }
  }

  // 4. Anonymous Guest User (landing page, public placement test)
  if (typeof window !== 'undefined') {
    const guestLang = localStorage.getItem('engrew_guest_lang') as LanguagePref;
    if (guestLang && ['en', 'he', 'ar'].includes(guestLang)) {
      return guestLang;
    }

    // Browser locale detection
    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('he')) return 'he';
    if (browserLang.startsWith('ar')) return 'ar';
  }

  // 5. Default platform language
  return 'he';
}

function getSafeStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('learnhebrew_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('learnhebrew_user');
    return null;
  }
}

// Clean up legacy keys on boot that previously caused global cross-account collisions
if (typeof window !== 'undefined') {
  localStorage.removeItem('learnhebrew_lang_manual');
}

const savedToken = typeof window !== 'undefined' ? (localStorage.getItem('learnhebrew_token') || null) : null;
const savedUser: User | null = getSafeStoredUser();
const initialLang = resolveUserLanguage(savedUser);

// Apply initial document direction and language code immediately before React renders
if (typeof document !== 'undefined') {
  document.documentElement.dir = (initialLang === 'he' || initialLang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLang;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: savedUser,
  accessToken: savedToken,
  language: initialLang,
  isProfileModalOpen: false,

  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),

  setAuth: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnhebrew_token', token);
      localStorage.setItem('learnhebrew_user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('learnhebrew_refresh_token', refreshToken);
      }
      localStorage.removeItem('learnhebrew_lang_manual');
    }

    // Resolve THIS specific user's preferred language without interference from any other user
    const lang = resolveUserLanguage(user);

    if (typeof window !== 'undefined') {
      localStorage.setItem(getUserLanguageKey(user.id), lang);
      localStorage.setItem('learnhebrew_lang', lang);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }

    set({ user, accessToken: token, language: lang });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnhebrew_user', JSON.stringify(user));
    }

    // If the user's languagePref changed in the updated user object, sync it
    if (user.languagePref && ['en', 'he', 'ar'].includes(user.languagePref)) {
      const currentLang = get().language;
      if (user.languagePref !== currentLang) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(getUserLanguageKey(user.id), user.languagePref);
          localStorage.setItem('learnhebrew_lang', user.languagePref);
        }
        if (typeof document !== 'undefined') {
          document.documentElement.dir = (user.languagePref === 'he' || user.languagePref === 'ar') ? 'rtl' : 'ltr';
          document.documentElement.lang = user.languagePref;
        }
        set({ user, language: user.languagePref });
        return;
      }
    }

    set({ user });
  },

  setLanguage: (newLang: LanguagePref) => {
    if (!['en', 'he', 'ar'].includes(newLang)) return;

    // Apply document layout and language tags immediately
    if (typeof document !== 'undefined') {
      document.documentElement.dir = (newLang === 'he' || newLang === 'ar') ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
    }

    const currentUser = get().user;

    if (currentUser && currentUser.id) {
      // Per-user isolated storage: will never conflict with other users
      if (typeof window !== 'undefined') {
        localStorage.setItem(getUserLanguageKey(currentUser.id), newLang);
        localStorage.setItem('learnhebrew_lang', newLang);
        localStorage.removeItem('learnhebrew_lang_manual');
      }

      // Update in-memory user object and persisted user JSON
      const updatedUser: User = { ...currentUser, languagePref: newLang };
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnhebrew_user', JSON.stringify(updatedUser));
      }

      set({ language: newLang, user: updatedUser });

      // Automatically sync with backend DB asynchronously so it follows the user everywhere
      import('../lib/api')
        .then(({ api }) => {
          api.patch('/auth/profile', { languagePref: newLang }).catch((err) => {
            console.warn('[authStore] Failed to sync languagePref to backend:', err?.message);
          });
        })
        .catch(() => {});
    } else {
      // Guest user preference on landing / public pages
      if (typeof window !== 'undefined') {
        localStorage.setItem('engrew_guest_lang', newLang);
        localStorage.setItem('learnhebrew_lang', newLang);
        localStorage.removeItem('learnhebrew_lang_manual');
      }
      set({ language: newLang });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('learnhebrew_token');
      localStorage.removeItem('learnhebrew_user');
      localStorage.removeItem('learnhebrew_refresh_token');
      localStorage.removeItem('learnhebrew_lang_manual');
    }

    // Restore guest language preference cleanly without user conflicts
    const guestLang = (typeof window !== 'undefined' ? (localStorage.getItem('engrew_guest_lang') as LanguagePref) : null) || 'he';
    if (typeof document !== 'undefined') {
      document.documentElement.dir = (guestLang === 'he' || guestLang === 'ar') ? 'rtl' : 'ltr';
      document.documentElement.lang = guestLang;
    }

    set({ user: null, accessToken: null, language: guestLang });
  },
}));
