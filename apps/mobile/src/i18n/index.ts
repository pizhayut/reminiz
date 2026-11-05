import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en, { type Strings } from './en';
import th from './th';

export type Language = 'en' | 'th';
export const languages: Language[] = ['th', 'en'];

// Type check: Thai must provide every key English has (plural keys aside).
const _thCheck: Omit<Strings, 'home'> = th;
void _thCheck;

export function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'th' ? 'th' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, th: { translation: th } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** BCP-47 tag used for text-to-speech. */
export const speechLocale: Record<Language, string> = { en: 'en-US', th: 'th-TH' };

export default i18n;
