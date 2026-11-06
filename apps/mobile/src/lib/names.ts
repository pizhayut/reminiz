import type { TFunction } from 'i18next';

import type { Language } from '@/i18n';
import type { Scene } from '@/lib/scene';

/** Name choices shown on the welcome screen, per language (Thai separates maternal and paternal grandparents). */
export const CALL_NAME_OPTIONS: Record<Language, string[]> = {
  en: ['mum', 'dad', 'grandma', 'grandpa'],
  th: ['mum', 'dad', 'yai', 'ya', 'ta', 'pu'],
};

export function displayName(callName: string | null, t: TFunction): string | null {
  if (!callName || callName === 'none') return null;
  return t(`callName.${callName}`, { defaultValue: '' }) || null;
}

/** Greeting that matches the home screen's sky. */
export function greetingKey(scene: Scene): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' {
  if (scene === 'morning') return 'greeting_morning';
  if (scene === 'day') return 'greeting_afternoon';
  return 'greeting_evening';
}
