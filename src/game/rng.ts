// Small deterministic PRNG so the daily board is identical on every device.

/** FNV-1a hash of a string to a 32-bit unsigned seed. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * One mulberry32 step. Takes the current state and returns [value in [0, 1), next state],
 * so the RNG can live inside immutable game state.
 */
export function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

/** Integer in [0, max). */
export function nextInt(state: number, max: number): [number, number] {
  const [value, next] = nextRandom(state);
  return [Math.floor(value * max), next];
}
