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
  text: string;
  textMuted: string;
  accentText: string;
  button: string;
  buttonPressed: string;
  /** Tree line colour (branches and ground). */
  line: string;
  canopy: string;
  statusBar: 'dark' | 'light';
};

const light: SceneInk = {
  text: colors.text,
  textMuted: colors.textMuted,
  accentText: colors.primary,
  button: colors.primary,
  buttonPressed: colors.primaryPressed,
  line: colors.primary,
  canopy: 'rgba(188, 222, 176, 0.8)',
  statusBar: 'dark',
};

export const sceneInk: Record<Scene, SceneInk> = {
  morning: light,
  day: light,
  night: {
    text: '#F3F1EA',
    textMuted: '#C8D0C9',
    accentText: '#B5DFA8',
    button: '#3D8A47',
    buttonPressed: '#2E6C34',
    line: '#8CC98F',
    canopy: 'rgba(78, 132, 88, 0.6)',
    statusBar: 'light',
  },
};
