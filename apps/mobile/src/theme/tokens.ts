// Colors and sizes from design/source/*.dc.html. Older adult screens use large type and tap targets.
export const colors = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  primary: '#1D6B63',
  primaryPressed: '#134C46',
  primarySoft: '#E3EFEC',
  accent: '#E07A3F',
  warmSoft: '#FBEBDD',
  warmBorder: '#E8C3A0',
  text: '#1E2422',
  textMuted: '#4F5753',
  border: '#D9D5CC',
  trunk: '#8A6A4E',
  onPrimary: '#FFFFFF',
} as const;

export const space = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 } as const;

export const radius = { md: 20, lg: 28, pill: 999 } as const;

/** Minimum height of tappable controls on older adult screens (CLAUDE.md asks for ≥ 56pt). */
export const tapTarget = { primary: 76, secondary: 60, icon: 64 } as const;

export const type = {
  display: 34,
  title: 28,
  body: 22,
  small: 18,
} as const;

/** Cap Dynamic Type growth so layouts stay intact while still honouring large text settings. */
export const maxFontScale = 1.6;
