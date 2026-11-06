// Flowers come from the days played: one flower for each day played this week (Monday to
// Sunday), so at most 7. Every Monday the week starts fresh and last week's flowers fall.
// Computed from the list of days played; nothing else is stored.

export const MAX_FLOWERS_PER_WEEK = 7;

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

function previousWeekKey(day: string): string {
  const d = parseDay(weekKey(day));
  d.setDate(d.getDate() - 7);
  return localDay(d);
}

export type TreeState = {
  careDays: number;
  /** Flowers on the tree now: days played this week. */
  flowers: number;
  /** Weekday of each flower this week, oldest first (0 = Sunday ... 6 = Saturday). */
  flowerDays: number[];
  /** Flowers from last week, which fall when a new week starts and nothing is played yet. */
  lastWeekFlowers: number;
  lastWeekDays: number[];
  playedToday: boolean;
};

export function treeState(playDays: readonly string[], today: string = localDay()): TreeState {
  const unique = Array.from(new Set(playDays));
  const thisWeek = weekKey(today);
  const lastWeek = previousWeekKey(today);
  const sorted = unique.slice().sort();
  const flowerDays: number[] = [];
  const lastWeekDays: number[] = [];
  for (const day of sorted) {
    const k = weekKey(day);
    if (k === thisWeek) flowerDays.push(parseDay(day).getDay());
    else if (k === lastWeek) lastWeekDays.push(parseDay(day).getDay());
  }
  return {
    careDays: unique.length,
    flowers: Math.min(flowerDays.length, MAX_FLOWERS_PER_WEEK),
    flowerDays: flowerDays.slice(0, MAX_FLOWERS_PER_WEEK),
    lastWeekFlowers: Math.min(lastWeekDays.length, MAX_FLOWERS_PER_WEEK),
    lastWeekDays: lastWeekDays.slice(0, MAX_FLOWERS_PER_WEEK),
    playedToday: unique.includes(today),
  };
}
