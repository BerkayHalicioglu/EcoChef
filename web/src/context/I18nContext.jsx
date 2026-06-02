import { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import tr from '../i18n/tr.json';

const LOCALES = { en, tr };
const STORAGE_KEY = 'ecochef_web_lang';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'tr' || stored === 'en') return stored;
    return navigator.language?.startsWith('tr') ? 'tr' : 'en';
  });

  const setLocale = (l) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = LOCALES[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
