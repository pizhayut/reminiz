// Tree growth is computed from the list of days played; nothing about it is stored separately.
// It only grows: no wilting, no resets, no streaks that can be broken.

export type TreeStage = 0 | 1 | 2 | 3 | 4;

/** Care-day thresholds for each stage: seed, sprout, small tree, young tree, big tree. */
export const STAGE_DAYS = [0, 1, 3, 7, 14] as const;
export const DAYS_PER_FLOWER_WEEK = 3;

/** Local calendar date as YYYY-MM-DD. */
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Monday of the week containing `day`, as YYYY-MM-DD. */
export function weekKey(day: string): string {
  const d = parseDay(day);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return localDay(d);
}

export type TreeState = {
  careDays: number;
  stage: TreeStage;
  flowers: number;
  /** Days played in the current week, capped at DAYS_PER_FLOWER_WEEK. */
  daysThisWeek: number;
  playedToday: boolean;
};

export function treeState(playDays: readonly string[], today: string = localDay()): TreeState {
  const unique = Array.from(new Set(playDays));
  const perWeek = new Map<string, number>();
  for (const day of unique) {
    const k = weekKey(day);
    perWeek.set(k, (perWeek.get(k) ?? 0) + 1);
  }
  let flowers = 0;
  for (const n of perWeek.values()) if (n >= DAYS_PER_FLOWER_WEEK) flowers++;

  const careDays = unique.length;
  let stage: TreeStage = 0;
  STAGE_DAYS.forEach((min, i) => {
    if (careDays >= min) stage = i as TreeStage;
  });

  return {
    careDays,
    stage,
    flowers,
    daysThisWeek: Math.min(perWeek.get(weekKey(today)) ?? 0, DAYS_PER_FLOWER_WEEK),
    playedToday: unique.includes(today),
  };
}
