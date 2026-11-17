// Brand green comes from the logo (design/brand/logo.png); the rest from design/source/*.dc.html. Older adult screens use large type and tap targets.
export const colors = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  primary: '#2E6C34',
  primaryPressed: '#1F4D24',
  primarySoft: '#E5EFE2',
  blossom: '#F5B09F',
  /**
   * Flower colour for the weekday it was earned (Thai day colours, Sunday first).
   * A small easter egg: not explained in the app. See docs/mvp0-plan.md.
   */
  dayBlossom: ['#E8574F', '#F5C93E', '#F59BC3', '#62C46A', '#F58A34', '#62A6EC', '#9C7AD6'],
  blossomCenter: '#FFF3C9',
  accent: '#E07A3F',
  warmSoft: '#FBEBDD',
  warmBorder: '#E8C3A0',
  text: '#1E2422',
  textMuted: '#4F5753',
  border: '#D9D5CC',
  trunk: '#8A6A4E',
  onPrimary: '#FFFFFF',
  /** "Demo data" badge: a colour used nowhere else, so it never looks like real data. */
  demo: '#5B3FA0',
  /** Emergency signs only. */
  danger: '#B3261E',
  dangerSoft: '#FCECEA',
  /** Check-in result colours (report and printout). Each passes WCAG AA on white. */
  status: { baseline: '#6B716E', stable: '#2E6C34', repeat: '#A35F00', seeDoctor: '#B4442C' },
} as const;

export const space = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 } as const;

export const radius = { md: 20, lg: 28, pill: 999 } as const;

/** Minimum height of tappable controls on older adult screens (CLAUDE.md asks for ≥ 56pt). */
export const tapTarget = { primary: 76, secondary: 60, icon: 64 } as const;

/** On tablets and desktop browsers the app stays a phone-width column instead of stretching. */
export const contentMaxWidth = 560;

export const type = {
  display: 34,
  title: 28,
  body: 22,
  small: 18,
} as const;

/** Cap Dynamic Type growth so layouts stay intact while still honouring large text settings. */
export const maxFontScale = 1.6;
