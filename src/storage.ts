import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DeathCause } from './game/engine';

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
};

const CLASSIC_KEY = 'classic:best';
const dailyKey = (date: string) => `daily:${date}`;

export async function loadStats(date: string): Promise<Stats> {
  try {
    const [classic, daily] = await AsyncStorage.multiGet([CLASSIC_KEY, dailyKey(date)]);
    return {
      classicBest: Number(classic[1] ?? 0),
      daily: daily[1] ? (JSON.parse(daily[1]) as DailyRecord) : null,
    };
  } catch {
    return { classicBest: 0, daily: null };
  }
}

export async function recordClassic(score: number): Promise<number> {
  const { classicBest } = await loadStats('');
  const best = Math.max(classicBest, score);
  await AsyncStorage.setItem(CLASSIC_KEY, String(best)).catch(() => {});
  return best;
}

export async function recordDaily(
  date: string,
  run: { score: number; durationMs: number; cause: DeathCause },
): Promise<DailyRecord> {
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
  await AsyncStorage.setItem(dailyKey(date), JSON.stringify(next)).catch(() => {});
  return next;
}
