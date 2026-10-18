import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format as dateFnsFormat } from 'date-fns';
import { es as dateFnsEs } from 'date-fns/locale/es';
import { enUS as dateFnsEn } from 'date-fns/locale/en-US';
import { es, Translations } from './translations/es';
import { en } from './translations/en';

export type SupportedLanguage = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'secret_santa_language';

const translationsMap: Record<SupportedLanguage, Translations> = {
  es,
  en,
};

const dateLocales: Record<SupportedLanguage, any> = {
  es: dateFnsEs,
  en: dateFnsEn,
};

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, formatStr: string) => string;
  dateLocale: any;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: async () => {},
  t: (path: string) => path,
  formatDate: (date) => String(date),
  dateLocale: dateFnsEs,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'es' || saved === 'en') {
          setLanguageState(saved);
        } else {
          // Spanish by default
          setLanguageState('es');
        }
      } catch (err) {
        console.warn('Failed to load language preference:', err);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('Failed to persist language preference:', err);
    }
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    const activeDict = translationsMap[language] || translationsMap.es;

    let value: any = activeDict;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to Spanish if key missing in active translation
        let fallbackValue: any = translationsMap.es;
        for (const fbKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fbKey in fallbackValue) {
            fallbackValue = fallbackValue[fbKey];
          } else {
            fallbackValue = path;
            break;
          }
        }
        value = fallbackValue;
        break;
      }
    }

    if (typeof value !== 'string') {
      return path;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, value);
    }

    return value;
  };

  const formatDate = (date: Date | string | number, formatStr: string): string => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return dateFnsFormat(d, formatStr, {
        locale: dateLocales[language] || dateFnsEs,
      });
    } catch (err) {
      console.warn('Error formatting date:', err);
      return String(date);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatDate,
        dateLocale: dateLocales[language] || dateFnsEs,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
