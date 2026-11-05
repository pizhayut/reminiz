// Quick Eye difficulty. A 3-down / 1-up staircase settles near 79% first-try accuracy,
// inside the 75–85% target from the plan. Only the picture's display time is limited;
// answering is never timed.

export type Level = { displayMs: number; options: 2 | 3 | 4; sameCategory: boolean };

export const LEVELS: readonly Level[] = [
  { displayMs: 1500, options: 2, sameCategory: false },
  { displayMs: 1200, options: 2, sameCategory: false },
  { displayMs: 1000, options: 3, sameCategory: false },
  { displayMs: 850, options: 3, sameCategory: false },
  { displayMs: 700, options: 3, sameCategory: true },
  { displayMs: 600, options: 4, sameCategory: false },
  { displayMs: 500, options: 4, sameCategory: true },
  { displayMs: 420, options: 4, sameCategory: true },
  { displayMs: 350, options: 4, sameCategory: true },
  { displayMs: 300, options: 4, sameCategory: true },
];

export const STEPS_DOWN = 3;

export type Staircase = { level: number; streak: number };

export function clampLevel(level: number): number {
  return Math.max(0, Math.min(LEVELS.length - 1, Math.round(level)));
}

/** Update after one picture. `firstTry` is whether the first tap was correct. */
export function step(s: Staircase, firstTry: boolean): Staircase {
  if (!firstTry) return { level: clampLevel(s.level - 1), streak: 0 };
  const streak = s.streak + 1;
  if (streak >= STEPS_DOWN) return { level: clampLevel(s.level + 1), streak: 0 };
  return { level: s.level, streak };
}
