import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './en.json';
import rw from './rw.json';

type TranslationKey = string;

interface Translations {
  [key: string]: any;
}

const translations: { [key: string]: Translations } = {
  en,
  rw,
};

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<string>(() => {
    // Try to get from localStorage first
    const saved = localStorage.getItem('amatalink_language');
    if (saved && (saved === 'en' || saved === 'rw')) {
      return saved;
    }
    // Default to English
    return 'en';
  });

  const setLanguage = (lang: string) => {
    if (lang === 'en' || lang === 'rw') {
      setLanguageState(lang);
      localStorage.setItem('amatalink_language', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  useEffect(() => {
    // Also save language preference to user profile if logged in
    const userStr = localStorage.getItem('amatalink_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Could update user profile with language preference here
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nProvider;
