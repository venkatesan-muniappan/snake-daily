import { nextInt } from './rng.ts';

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Point = { x: number; y: number };
export type Status = 'ready' | 'playing' | 'over';
export type DeathCause = 'wall' | 'self' | 'edge' | null;

export type GameConfig = {
  cols: number;
  rows: number;
  walls: Point[];
  seed: number;
};

export type GameState = {
  cols: number;
  rows: number;
  walls: Point[];
  /** Head first. */
  snake: Point[];
  dir: Dir;
  /** Turns entered faster than the tick rate; applied one per tick. */
  queue: Dir[];
  food: Point | null;
  score: number;
  ticks: number;
  status: Status;
  deathCause: DeathCause;
  rng: number;
};

const START_LENGTH = 3;
const MAX_QUEUED_TURNS = 2;

const DELTAS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const key = (p: Point) => `${p.x},${p.y}`;
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function createGame(config: GameConfig): GameState {
  const { cols, rows, walls, seed } = config;
  const y = Math.floor(rows / 2);
  const headX = Math.floor(cols / 2);
  const snake = Array.from({ length: START_LENGTH }, (_, i) => ({ x: headX - i, y }));
  const base: GameState = {
    cols,
    rows,
    walls,
    snake,
    dir: 'right',
    queue: [],
    food: null,
    score: 0,
    ticks: 0,
    status: 'ready',
    deathCause: null,
    rng: seed,
  };
  return placeFood(base);
}

/** Queue a turn. Ignores reversals and repeats relative to the last queued direction. */
export function turn(state: GameState, dir: Dir): GameState {
  if (state.status === 'over') return state;
  const last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last] || state.queue.length >= MAX_QUEUED_TURNS) {
    return state.status === 'ready' ? { ...state, status: 'playing' } : state;
  }
  return { ...state, queue: [...state.queue, dir], status: 'playing' };
}

export function start(state: GameState): GameState {
  return state.status === 'ready' ? { ...state, status: 'playing' } : state;
}

export function step(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const [nextDir, ...queue] = state.queue.length ? state.queue : [state.dir];
  const d = DELTAS[nextDir];
  const head = { x: state.snake[0].x + d.x, y: state.snake[0].y + d.y };
  const eating = state.food !== null && same(head, state.food);
  // The tail moves away this tick unless we grow, so moving into it is allowed.
  const body = eating ? state.snake : state.snake.slice(0, -1);

  let deathCause: DeathCause = null;
  if (head.x < 0 || head.y < 0 || head.x >= state.cols || head.y >= state.rows) deathCause = 'edge';
  else if (state.walls.some((w) => same(w, head))) deathCause = 'wall';
  else if (body.some((s) => same(s, head))) deathCause = 'self';

  if (deathCause) {
    return { ...state, dir: nextDir, queue, status: 'over', deathCause, ticks: state.ticks + 1 };
  }

  const moved: GameState = {
    ...state,
    snake: [head, ...body],
    dir: nextDir,
    queue,
    ticks: state.ticks + 1,
    score: eating ? state.score + 1 : state.score,
    food: eating ? null : state.food,
  };
  return eating ? placeFood(moved) : moved;
}

/**
 * Picks a seeded candidate cell; if it is taken, scans forward to the next free cell.
 * Two players with the same seed get the same fruit sequence unless their snakes block a spot.
 */
export function placeFood(state: GameState): GameState {
  const taken = new Set([...state.walls, ...state.snake].map(key));
  const total = state.cols * state.rows;
  if (taken.size >= total) return { ...state, food: null };

  const [start, rng] = nextInt(state.rng, total);
  for (let i = 0; i < total; i++) {
    const idx = (start + i) % total;
    const p = { x: idx % state.cols, y: Math.floor(idx / state.cols) };
    if (!taken.has(key(p))) return { ...state, food: p, rng };
  }
  return { ...state, food: null, rng };
}

/** Milliseconds per tick: speeds up as you eat, capped. */
export function tickInterval(score: number): number {
  return Math.max(70, 150 - score * 3);
}
