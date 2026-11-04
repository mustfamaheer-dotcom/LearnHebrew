import { useAuthStore } from '../store/authStore';
import { translations } from '../locales/translations';

export function useTranslation() {
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);

  function t(path: string, params?: Record<string, string | number>): string {
    const keys = path.split('.');
    let current: any = translations[language] || translations.en;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback: any = translations.en;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current === 'string' && params) {
      let result = current;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
      return result;
    }

    return typeof current === 'string' ? current : path;
  }

  return { t, language, setLanguage, isRtl: language === 'he' };
}

