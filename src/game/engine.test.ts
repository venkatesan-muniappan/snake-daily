import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classicConfig, dailyConfig, dayNumber, ROWS } from './daily.ts';
import type { GameState } from './engine.ts';
import { createGame, key, placeFood, start, step, turn } from './engine.ts';
import { shareText } from './share.ts';
import { currentStreak, extendStreak, previousDay } from './streak.ts';

const noFood = (s: GameState): GameState => ({ ...s, food: { x: 0, y: 0 } });

describe('engine', () => {
  it('starts ready, moves right once started', () => {
    const g = createGame(classicConfig(1));
    assert.equal(g.status, 'ready');
    assert.equal(step(g), g, 'no movement before start');
    const moved = step(noFood(start(g)));
    assert.equal(moved.snake[0].x, g.snake[0].x + 1);
    assert.equal(moved.snake.length, g.snake.length);
  });

  it('ignores reversing into itself', () => {
    const g = turn(start(createGame(classicConfig(1))), 'left');
    assert.deepEqual(g.queue, []);
  });

  it('queues two quick turns and applies one per tick', () => {
    let g = noFood(start(createGame(classicConfig(1))));
    g = turn(turn(g, 'up'), 'left');
    assert.deepEqual(g.queue, ['up', 'left']);
    const head = g.snake[0];
    g = step(g);
    assert.deepEqual(g.snake[0], { x: head.x, y: head.y - 1 });
    g = step(g);
    assert.deepEqual(g.snake[0], { x: head.x - 1, y: head.y - 1 });
  });

  it('grows and scores when eating', () => {
    let g = start(createGame(classicConfig(1)));
    const head = g.snake[0];
    g = { ...g, food: { x: head.x + 1, y: head.y } };
    const next = step(g);
    assert.equal(next.score, 1);
    assert.equal(next.snake.length, g.snake.length + 1);
    assert.ok(next.food);
    assert.ok(!next.snake.some((p) => key(p) === key(next.food!)), 'new food not on snake');
  });

  it('dies at the edge', () => {
    let g = noFood(start(createGame(classicConfig(1))));
    for (let i = 0; i < 20 && g.status === 'playing'; i++) g = step(g);
    assert.equal(g.status, 'over');
    assert.equal(g.deathCause, 'edge');
  });

  it('dies on a wall', () => {
    const base = createGame(classicConfig(1));
    const head = base.snake[0];
    const g = noFood(start({ ...base, walls: [{ x: head.x + 1, y: head.y }] }));
    assert.equal(step(g).deathCause, 'wall');
  });

  it('dies running into its body but may follow its tail', () => {
    const square = { ...noFood(createGame(classicConfig(1))), status: 'playing' as const };
    // 2x2 loop: head at (5,5) moving up into tail (5,4) is legal because the tail moves away.
    const loop: GameState = {
      ...square,
      snake: [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 4 },
        { x: 5, y: 4 },
      ],
      dir: 'left',
      queue: ['up'],
    };
    assert.equal(step(loop).status, 'playing');
    const longer = { ...loop, snake: [...loop.snake, { x: 4, y: 4 }] };
    assert.equal(step(longer).deathCause, 'self');
  });

  it('places food on the only free cell', () => {
    const g = createGame({ cols: 2, rows: 2, walls: [{ x: 1, y: 1 }], seed: 7 });
    const filled = placeFood({
      ...g,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });
    assert.deepEqual(filled.food, { x: 0, y: 1 });
  });
});

describe('daily', () => {
  it('is deterministic per date and differs across dates', () => {
    assert.deepEqual(dailyConfig('2026-10-10'), dailyConfig('2026-10-10'));
    assert.notDeepEqual(dailyConfig('2026-10-10').walls, dailyConfig('2026-10-11').walls);
  });

  it('keeps walls off the starting rows and the food sequence matches', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      const cfg = dailyConfig(date);
      const mid = Math.floor(ROWS / 2);
      assert.ok(
        cfg.walls.every((w) => Math.abs(w.y - mid) > 1),
        date,
      );
      assert.ok(cfg.walls.length > 0, date);
      assert.deepEqual(createGame(cfg).food, createGame(dailyConfig(date)).food);
    }
  });

  it('numbers days from launch', () => {
    assert.equal(dayNumber(new Date(2026, 9, 9, 0, 1)), 1);
    assert.equal(dayNumber(new Date(2026, 9, 9, 23, 59)), 1);
    assert.equal(dayNumber(new Date(2026, 10, 8)), 31);
  });
});

describe('share', () => {
  it('renders a 10-block bar', () => {
    const text = shareText({ day: 3, score: 12, durationMs: 95_000, cause: 'self', attempts: 2, streak: 1 });
    assert.equal(text, '🐍 Daily Snake #3\n🍎 12  ⏱ 1:35  🌀\n🟩🟩🟨⬛⬛⬛⬛⬛⬛⬛\n2 tries');
  });
});

describe('streak', () => {
  it('finds the previous day across month and year boundaries', () => {
    assert.equal(previousDay('2026-11-01'), '2026-10-31');
    assert.equal(previousDay('2027-01-01'), '2026-12-31');
    assert.equal(previousDay('2028-03-01'), '2028-02-29');
  });

  it('extends on consecutive days, ignores repeat plays, resets after a gap', () => {
    let s = extendStreak(null, '2026-10-09');
    assert.deepEqual(s, { last: '2026-10-09', count: 1 });
    assert.equal(extendStreak(s, '2026-10-09'), s);
    s = extendStreak(s, '2026-10-10');
    assert.equal(s.count, 2);
    assert.equal(extendStreak(s, '2026-10-12').count, 1);
  });

  it('shows a streak only while it is still alive', () => {
    const s = { last: '2026-10-10', count: 4 };
    assert.equal(currentStreak(s, '2026-10-10'), 4);
    assert.equal(currentStreak(s, '2026-10-11'), 4);
    assert.equal(currentStreak(s, '2026-10-12'), 0);
    assert.equal(currentStreak(null, '2026-10-12'), 0);
  });

  it('adds the streak to the share card from day 2', () => {
    const text = shareText({ day: 5, score: 0, durationMs: 1000, cause: 'edge', attempts: 1, streak: 3 });
    assert.ok(text.endsWith('1 try · 🔥 3'));
  });
});
