// Everything the app remembers lives on this device only (AsyncStorage). Nothing is sent anywhere.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import i18n, { deviceLanguage, type Language } from '@/i18n';
import { clampLevel } from '@/lib/staircase';
import { localDay } from '@/lib/tree';

const KEY = 'reminiz.v1';

/** A key of `callName` in the strings, or 'none' when the person chose to skip. */
export type CallName = string;

type Saved = {
  callName: CallName | null;
  language: Language | null; // null = follow the device
  playDays: string[];
  level: number;
};

const initial: Saved = { callName: null, language: null, playDays: [], level: 0 };

type Store = Saved & {
  loaded: boolean;
  language: Language;
  setCallName: (name: CallName) => void;
  setLanguage: (lang: Language) => void;
  /** Record a finished round; returns true when this was the first round today. */
  finishRound: (level: number) => boolean;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Saved>;
        setSaved({
          callName: parsed.callName ?? null,
          language: parsed.language ?? null,
          playDays: Array.isArray(parsed.playDays) ? parsed.playDays : [],
          level: clampLevel(parsed.level ?? 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const language = saved.language ?? deviceLanguage();

  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language]);

  const update = useCallback((fn: (s: Saved) => Saved) => {
    setSaved((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...saved,
      loaded,
      language,
      setCallName: (callName) => update((s) => ({ ...s, callName })),
      setLanguage: (lang) => update((s) => ({ ...s, language: lang })),
      finishRound: (level) => {
        const today = localDay();
        const first = !saved.playDays.includes(today);
        update((s) => ({
          ...s,
          level: clampLevel(level),
          playDays: s.playDays.includes(today) ? s.playDays : [...s.playDays, today],
        }));
        return first;
      },
    }),
    [saved, loaded, language, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
