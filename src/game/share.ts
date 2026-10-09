import type { DeathCause } from './engine.ts';

const CAUSE: Record<Exclude<DeathCause, null>, string> = {
  wall: '🧱',
  edge: '💥',
  self: '🌀',
};

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Wordle-style share card: one block per 5 fruits, up to 10 blocks. */
export function shareText(opts: {
  day: number;
  score: number;
  durationMs: number;
  cause: DeathCause;
  attempts: number;
  streak: number;
}): string {
  const { day, score, durationMs, cause, attempts, streak } = opts;
  const full = Math.min(10, Math.floor(score / 5));
  const partial = full < 10 && score % 5 > 0 ? 1 : 0;
  const bar = '🟩'.repeat(full) + '🟨'.repeat(partial) + '⬛'.repeat(10 - full - partial);
  const tries = attempts === 1 ? '1 try' : `${attempts} tries`;
  return [
    `🐍 Daily Snake #${day}`,
    `🍎 ${score}  ⏱ ${formatDuration(durationMs)}  ${cause ? CAUSE[cause] : ''}`.trimEnd(),
    bar,
    streak > 1 ? `${tries} · 🔥 ${streak}` : tries,
  ].join('\n');
}
