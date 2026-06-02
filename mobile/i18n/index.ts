import tr from '../locales/tr.json';
import en from '../locales/en.json';

export type Locale = 'tr' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['tr', 'en'];

const translations: Record<Locale, Record<string, any>> = { tr, en };

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  // Fallback to Turkish if key missing in selected locale
  if (typeof value !== 'string') {
    let fallback: any = translations['tr'];
    for (const k of keys) {
      fallback = fallback?.[k];
      if (fallback === undefined) break;
    }
    value = typeof fallback === 'string' ? fallback : key;
  }
  if (params) {
    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
      value as string
    );
  }
  return value as string;
}
