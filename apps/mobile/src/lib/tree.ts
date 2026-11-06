// The tree is always full grown. Playing earns flowers: one for each week with 3 days of play.
// Computed from the list of days played; flowers never wilt or reset.

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

  return {
    careDays: unique.length,
    flowers,
    daysThisWeek: Math.min(perWeek.get(weekKey(today)) ?? 0, DAYS_PER_FLOWER_WEEK),
    playedToday: unique.includes(today),
  };
}
