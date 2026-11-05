// Read-aloud with the phone's built-in voices (works offline). If the phone has no voice
// for the current language, `canSpeak` is false and speaker buttons are hidden.
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

import { speechLocale, type Language } from '@/i18n';

const cache = new Map<Language, boolean>();

async function hasVoice(lang: Language): Promise<boolean> {
  if (cache.has(lang)) return cache.get(lang)!;
  let ok = false;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    ok = voices.some((v) => v.language?.toLowerCase().replace('_', '-').startsWith(lang));
    // Some Android engines report no voices list but still speak the default language.
    if (!ok && voices.length === 0) ok = lang === 'en';
  } catch {
    ok = false;
  }
  cache.set(lang, ok);
  return ok;
}

export function useCanSpeak(lang: Language): boolean {
  const [ok, setOk] = useState(cache.get(lang) ?? false);
  useEffect(() => {
    let alive = true;
    hasVoice(lang).then((v) => alive && setOk(v));
    return () => {
      alive = false;
    };
  }, [lang]);
  return ok;
}

export function say(text: string, lang: Language) {
  Speech.stop();
  Speech.speak(text, { language: speechLocale[lang], rate: lang === 'th' ? 0.9 : 0.85 });
}

export function stopSpeaking() {
  Speech.stop();
}
