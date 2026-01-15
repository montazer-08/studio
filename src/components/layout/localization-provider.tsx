'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDictionary, Locale } from '@/lib/dictionaries';

type Dictionary = ReturnType<typeof getDictionary>;

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  isLocaleLoading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [isLocaleLoading, setIsLocaleLoading] = useState(true);

  // Effect to load locale from localStorage on initial client-side render
  useEffect(() => {
    const savedLocale = localStorage.getItem('omnicore-locale') as Locale | null;
    if (savedLocale && ['en', 'ar'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
    setIsLocaleLoading(false);
  }, []);
  
  const dictionary = getDictionary(locale);
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Effect to update document attributes and save locale to localStorage
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    localStorage.setItem('omnicore-locale', locale);
  }, [direction, locale]);

  const value = {
    locale,
    setLocale,
    t: dictionary,
    isLocaleLoading,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

    