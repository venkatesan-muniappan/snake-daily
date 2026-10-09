import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform } from 'react-native';

import type { Dir } from '../game/engine';

const SWIPE_DISTANCE = 18;

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/**
 * Swipe anywhere on the returned handlers' view; one swipe can chain several turns
 * (the anchor resets after each recognised direction). Keyboard arrows/WASD on web.
 */
export function useControls(onTurn: (dir: Dir) => void, onTap: () => void) {
  const handlers = useRef({ onTurn, onTap });
  handlers.current = { onTurn, onTap };
  const anchor = useRef({ x: 0, y: 0, turned: false });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, g) => {
          anchor.current = { x: g.x0, y: g.y0, turned: false };
        },
        onPanResponderMove: (_, g) => {
          const dx = g.moveX - anchor.current.x;
          const dy = g.moveY - anchor.current.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
          const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          anchor.current = { x: g.moveX, y: g.moveY, turned: true };
          handlers.current.onTurn(dir);
        },
        onPanResponderRelease: () => {
          if (!anchor.current.turned) handlers.current.onTap();
        },
      }),
    [],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const dir = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      if (dir) {
        e.preventDefault();
        handlers.current.onTurn(dir);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlers.current.onTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return pan.panHandlers;
}
