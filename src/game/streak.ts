import { dateKey } from './daily.ts';

/** Consecutive days the daily was played, ending on `last`. */
export type Streak = { last: string; count: number };

export function previousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d - 1));
}

/** Streak after playing the daily on `today`. Several runs on one day count once. */
export function extendStreak(prev: Streak | null, today: string): Streak {
  if (prev?.last === today) return prev;
  if (prev?.last === previousDay(today)) return { last: today, count: prev.count + 1 };
  return { last: today, count: 1 };
}

/** Streak to show on `today`: still alive if the last play was today or yesterday. */
export function currentStreak(prev: Streak | null, today: string): number {
  if (!prev) return 0;
  return prev.last === today || prev.last === previousDay(today) ? prev.count : 0;
}
