import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate, type Locale, SUPPORTED_LOCALES } from '@/i18n';

const LOCALE_KEY = 'ecochef_dil';

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** true until the stored locale is loaded from AsyncStorage */
  loading: boolean;
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'tr',
  setLocale: () => {},
  t: (key) => key,
  loading: true,
});

function detectDeviceLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'tr';
  return SUPPORTED_LOCALES.includes(tag as Locale) ? (tag as Locale) : 'tr';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then((stored) => {
      if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
        setLocaleState(stored as Locale);
      } else {
        setLocaleState(detectDeviceLocale());
      }
      setLoading(false);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(LOCALE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t, loading }), [locale, setLocale, t, loading]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  return useContext(I18nContext);
}

export { LOCALE_KEY };
