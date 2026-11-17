// Everything the app remembers lives on this device only (AsyncStorage). Nothing is sent anywhere.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import i18n, { deviceLanguage, type Language } from '@/i18n';
import { makeDemoData } from '@/checkin/demo';
import type { FamilyReport } from '@/checkin/family';
import type { CheckIn } from '@/checkin/scoring';
import { clampLevel } from '@/lib/staircase';
import { localDay } from '@/lib/tree';

const KEY = 'reminiz.v1';

/** A key of `callName` in the strings, or 'none' when the person chose to skip. */
export type CallName = string;

type Data = {
  callName: CallName | null;
  language: Language | null; // null = follow the device
  playDays: string[];
  level: number;
  /** Monthly check-ins, oldest first. */
  checkIns: CheckIn[];
  /** Answers to the family questions, oldest first. */
  familyReports: FamilyReport[];
};

type Saved = Data & {
  /** True while the synthetic demo data is loaded (every screen showing it says "Demo data"). */
  demo: boolean;
  /** The person's own data, put aside while the demo is loaded and restored when it is cleared. */
  beforeDemo: Data | null;
};

const empty: Data = { callName: null, language: null, playDays: [], level: 0, checkIns: [], familyReports: [] };
const initial: Saved = { ...empty, demo: false, beforeDemo: null };

type Store = Saved & {
  loaded: boolean;
  language: Language;
  setCallName: (name: CallName) => void;
  setLanguage: (lang: Language) => void;
  /** Record a finished round; returns true when this was the first round today. */
  finishRound: (level: number) => boolean;
  addCheckIn: (checkIn: CheckIn) => void;
  addFamilyReport: (report: FamilyReport) => void;
  /** Load 6 months of synthetic data; the person's own data is kept aside. */
  loadDemo: (opts?: { english?: boolean }) => void;
  /** In demo: remove the demo and bring back the person's own data. Otherwise: erase everything. */
  clearData: () => void;
};

const Ctx = createContext<Store | null>(null);

function dataOf(s: Partial<Data> | null | undefined): Data {
  return {
    callName: s?.callName ?? null,
    language: s?.language ?? null,
    playDays: Array.isArray(s?.playDays) ? s.playDays : [],
    level: clampLevel(s?.level ?? 0),
    checkIns: Array.isArray(s?.checkIns) ? s.checkIns : [],
    familyReports: Array.isArray(s?.familyReports) ? s.familyReports : [],
  };
}

function withDemo(s: Saved, english?: boolean): Saved {
  const own = s.demo ? s.beforeDemo ?? empty : dataOf(s);
  const demo = makeDemoData();
  return {
    ...own,
    callName: own.callName && own.callName !== 'none' ? own.callName : 'mum',
    language: english ? 'en' : own.language,
    playDays: demo.playDays,
    checkIns: demo.checkIns,
    familyReports: demo.familyReports,
    demo: true,
    beforeDemo: own,
  };
}

/**
 * Web demo link: /?demo=1 skips the welcome screen, loads the demo and switches to English.
 * Applied once per browser tab, so a reload keeps whatever the judge did next.
 */
function demoLinkRequested(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('demo') !== '1') return false;
  try {
    if (window.sessionStorage.getItem('reminiz.demoLink')) return false;
    window.sessionStorage.setItem('reminiz.demoLink', '1');
  } catch {
    // Private mode without sessionStorage: load the demo every time.
  }
  return true;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const demoLink = demoLinkRequested();
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as Partial<Saved>) : null;
        let next: Saved = {
          ...dataOf(parsed),
          demo: !!parsed?.demo,
          beforeDemo: parsed?.beforeDemo ? dataOf(parsed.beforeDemo) : null,
        };
        if (demoLink) {
          next = withDemo(next, true);
          AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
        }
        setSaved(next);
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
      addCheckIn: (checkIn) => update((s) => ({ ...s, checkIns: [...s.checkIns, checkIn] })),
      addFamilyReport: (report) => update((s) => ({ ...s, familyReports: [...s.familyReports, report] })),
      loadDemo: (opts) => update((s) => withDemo(s, opts?.english)),
      clearData: () =>
        update((s) =>
          s.demo
            ? // Everything back as it was, including the language the demo link switched to English.
              { ...(s.beforeDemo ?? empty), demo: false, beforeDemo: null }
            : { ...empty, language: s.language, demo: false, beforeDemo: null },
        ),
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
