import type { TFunction } from 'i18next';

import type { Language } from '@/i18n';

/** Name choices shown on the welcome screen, per language (Thai separates maternal and paternal grandparents). */
export const CALL_NAME_OPTIONS: Record<Language, string[]> = {
  en: ['mum', 'dad', 'grandma', 'grandpa'],
  th: ['mum', 'dad', 'yai', 'ya', 'ta', 'pu'],
};

export function displayName(callName: string | null, t: TFunction): string | null {
  if (!callName || callName === 'none') return null;
  return t(`callName.${callName}`, { defaultValue: '' }) || null;
}

export function greetingKey(d: Date = new Date()): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' {
  const h = d.getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 17) return 'greeting_afternoon';
  return 'greeting_evening';
}
