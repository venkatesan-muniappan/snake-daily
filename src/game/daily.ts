import type { GameConfig, Point } from './engine.ts';
import { key } from './engine.ts';
import { hashSeed, nextInt } from './rng.ts';

export const COLS = 17;
export const ROWS = 17;

/** Day #1 of the daily challenge. */
const LAUNCH = { y: 2026, m: 10, d: 9 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date as YYYY-MM-DD, so the board flips at the player's midnight. */
export function dateKey(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export function dayNumber(now: Date = new Date()): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const launch = Date.UTC(LAUNCH.y, LAUNCH.m - 1, LAUNCH.d);
  return Math.floor((today - launch) / DAY_MS) + 1;
}

export function classicConfig(seed: number = Date.now()): GameConfig {
  return { cols: COLS, rows: ROWS, walls: [], seed: seed >>> 0 };
}

/**
 * Builds the day's walls: a few mirrored segments (mirrored left/right so boards look designed),
 * kept clear of the snake's starting row.
 */
export function dailyConfig(date: string = dateKey()): GameConfig {
  let rng = hashSeed(`snake-daily:${date}`);
  const walls = new Map<string, Point>();
  const mid = Math.floor(ROWS / 2);
  const isClear = (p: Point) => Math.abs(p.y - mid) > 1;

  let segments: number;
  [segments, rng] = nextInt(rng, 3);
  segments += 3;

  for (let s = 0; s < segments; s++) {
    let x: number, y: number, len: number, vertical: number;
    [x, rng] = nextInt(rng, Math.floor(COLS / 2) - 1);
    [y, rng] = nextInt(rng, ROWS - 2);
    [len, rng] = nextInt(rng, 3);
    [vertical, rng] = nextInt(rng, 2);
    x += 1;
    y += 1;
    len += 2;
    for (let i = 0; i < len; i++) {
      const p = vertical ? { x, y: y + i } : { x: x + i, y };
      if (p.x < 1 || p.x >= COLS - 1 || p.y < 1 || p.y >= ROWS - 1 || !isClear(p)) continue;
      const mirror = { x: COLS - 1 - p.x, y: p.y };
      walls.set(key(p), p);
      walls.set(key(mirror), mirror);
    }
  }

  return { cols: COLS, rows: ROWS, walls: [...walls.values()], seed: rng };
}
