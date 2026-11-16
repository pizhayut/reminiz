// The home screen follows the phone's clock: a sunrise in the morning, plain daylight,
// and a dark sky with fireflies at night.
import { colors } from '@/theme/tokens';

export type Scene = 'morning' | 'day' | 'night';

export function sceneFor(d: Date = new Date()): Scene {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 18) return 'day';
  return 'night';
}

export type SceneInk = {
  /** Greeting and status at the top of the screen, over the sky. */
  text: string;
  textMuted: string;
  accentText: string;
  /** Link under the Play button, over the paper-coloured bottom. */
  footerLink: string;
  button: string;
  buttonPressed: string;
  /** Ground line and grass. */
  line: string;
  /** Round tree: crown shadow, middle and highlight greens, and the trunk. */
  tree: { back: string; mid: string; front: string; trunk: string };
  statusBar: 'dark' | 'light';
};

const light: SceneInk = {
  text: colors.text,
  textMuted: colors.textMuted,
  accentText: colors.primary,
  footerLink: colors.primary,
  button: colors.primary,
  buttonPressed: colors.primaryPressed,
  line: colors.primary,
  tree: { back: '#4F9156', mid: '#76B470', front: '#A8D696', trunk: '#6B4E37' },
  statusBar: 'dark',
};

export const sceneInk: Record<Scene, SceneInk> = {
  morning: light,
  day: light,
  night: {
    text: '#F3F1EA',
    textMuted: '#C8D0C9',
    accentText: '#B5DFA8',
    // The night sky fades to paper at the bottom, so the button and link keep their day colours.
    footerLink: colors.primary,
    button: colors.primary,
    buttonPressed: colors.primaryPressed,
    line: '#5FA866',
    tree: { back: '#2C5536', mid: '#3F7449', front: '#558D5E', trunk: '#6E8F70' },
    statusBar: 'light',
  },
};
