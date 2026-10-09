import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GameState, Point } from '../game/engine';
import { colors } from '../theme';

type Props = { state: GameState; cell: number };

/** Checkerboard + walls never change during a run, so they render once. */
const Background = memo(function Background({
  cols,
  rows,
  walls,
  cell,
}: {
  cols: number;
  rows: number;
  walls: Point[];
  cell: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, y) => (
        <View key={y} style={styles.row}>
          {Array.from({ length: cols }, (_, x) => (
            <View
              key={x}
              style={{
                width: cell,
                height: cell,
                backgroundColor: (x + y) % 2 ? colors.cellB : colors.cellA,
              }}
            />
          ))}
        </View>
      ))}
      {walls.map((w) => (
        <View
          key={`${w.x},${w.y}`}
          style={[
            styles.abs,
            { left: w.x * cell, top: w.y * cell, width: cell, height: cell },
            { backgroundColor: colors.wall, borderRadius: cell * 0.18 },
          ]}
        />
      ))}
    </>
  );
});

export function Board({ state, cell }: Props) {
  const { cols, rows, walls, snake, food } = state;
  const inset = Math.max(1, Math.round(cell * 0.08));
  const dead = state.status === 'over';

  return (
    <View style={[styles.board, { width: cols * cell, height: rows * cell }]}>
      <Background cols={cols} rows={rows} walls={walls} cell={cell} />
      {food && (
        <View
          style={[
            styles.abs,
            {
              left: food.x * cell + inset * 2,
              top: food.y * cell + inset * 2,
              width: cell - inset * 4,
              height: cell - inset * 4,
              borderRadius: cell,
              backgroundColor: colors.food,
            },
          ]}
        />
      )}
      {snake.map((p, i) => (
        <View
          key={i}
          style={[
            styles.abs,
            {
              left: p.x * cell + inset,
              top: p.y * cell + inset,
              width: cell - inset * 2,
              height: cell - inset * 2,
              borderRadius: i === 0 ? cell * 0.35 : cell * 0.22,
              backgroundColor: i === 0 ? colors.snakeHead : colors.snake,
              opacity: dead ? 0.45 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.cellA },
  row: { flexDirection: 'row' },
  abs: { position: 'absolute' },
});
