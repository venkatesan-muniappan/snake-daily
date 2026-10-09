import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DeathCause } from './game/engine';
import type { Streak } from './game/streak';
import { currentStreak, extendStreak } from './game/streak';

export type DailyRecord = {
  date: string;
  attempts: number;
  best: number;
  bestDurationMs: number;
  bestCause: DeathCause;
};

export type Stats = {
  classicBest: number;
  daily: DailyRecord | null;
  /** Days in a row, as of the date passed to loadStats. */
  streak: number;
};

const CLASSIC_KEY = 'classic:best';
const STREAK_KEY = 'daily:streak';
const dailyKey = (date: string) => `daily:${date}`;

export async function loadStats(date: string): Promise<Stats> {
  try {
    const [classic, daily, streak] = await AsyncStorage.multiGet([CLASSIC_KEY, dailyKey(date), STREAK_KEY]);
    return {
      classicBest: Number(classic[1] ?? 0),
      daily: daily[1] ? (JSON.parse(daily[1]) as DailyRecord) : null,
      streak: currentStreak(streak[1] ? (JSON.parse(streak[1]) as Streak) : null, date),
    };
  } catch {
    return { classicBest: 0, daily: null, streak: 0 };
  }
}

export async function recordClassic(score: number): Promise<{ best: number; improved: boolean }> {
  const { classicBest } = await loadStats('');
  const best = Math.max(classicBest, score);
  await AsyncStorage.setItem(CLASSIC_KEY, String(best)).catch(() => {});
  return { best, improved: score > classicBest };
}

export async function recordDaily(
  date: string,
  run: { score: number; durationMs: number; cause: DeathCause },
): Promise<{ daily: DailyRecord; streak: number; improved: boolean }> {
  const { daily } = await loadStats(date);
  const prev = daily ?? { date, attempts: 0, best: -1, bestDurationMs: 0, bestCause: null };
  const improved = run.score > prev.best;
  const next: DailyRecord = {
    date,
    attempts: prev.attempts + 1,
    best: improved ? run.score : prev.best,
    bestDurationMs: improved ? run.durationMs : prev.bestDurationMs,
    bestCause: improved ? run.cause : prev.bestCause,
  };
  const storedStreak = await AsyncStorage.getItem(STREAK_KEY).catch(() => null);
  const streak = extendStreak(storedStreak ? (JSON.parse(storedStreak) as Streak) : null, date);
  await AsyncStorage.multiSet([
    [dailyKey(date), JSON.stringify(next)],
    [STREAK_KEY, JSON.stringify(streak)],
  ]).catch(() => {});
  return { daily: next, streak: streak.count, improved: improved && run.score > 0 };
}

const SEEN_HOWTO_KEY = 'seen:howto';

export async function hasSeenHowTo(): Promise<boolean> {
  return (await AsyncStorage.getItem(SEEN_HOWTO_KEY).catch(() => null)) === '1';
}

export async function markHowToSeen(): Promise<void> {
  await AsyncStorage.setItem(SEEN_HOWTO_KEY, '1').catch(() => {});
}
