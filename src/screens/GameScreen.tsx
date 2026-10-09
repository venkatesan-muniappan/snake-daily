import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board } from '../components/Board';
import { classicConfig, dailyConfig, dateKey, dayNumber } from '../game/daily';
import type { Dir, GameConfig, GameState } from '../game/engine';
import { createGame, start, step, tickInterval, turn } from '../game/engine';
import { formatDuration, shareText } from '../game/share';
import { useBackHandler } from '../hooks/useBackHandler';
import { useControls } from '../hooks/useControls';
import { haptics, shareResult } from '../platform';
import { playSound } from '../sound';
import type { DailyRecord } from '../storage';
import { recordClassic, recordDaily } from '../storage';
import { colors } from '../theme';

export type Mode = 'daily' | 'classic';

type Action =
  { type: 'tick' } | { type: 'turn'; dir: Dir } | { type: 'start' } | { type: 'reset'; config: GameConfig };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'tick':
      return step(state);
    case 'turn':
      return turn(state, action.dir);
    case 'start':
      return start(state);
    case 'reset':
      return createGame(action.config);
  }
}

const configFor = (mode: Mode, date: string) => (mode === 'daily' ? dailyConfig(date) : classicConfig());

type Result = {
  durationMs: number;
  best: number;
  daily: DailyRecord | null;
  streak: number;
  isBest: boolean;
};

export function GameScreen({ mode, onExit }: { mode: Mode; onExit: () => void }) {
  const [date] = useState(() => dateKey());
  const [state, dispatch] = useReducer(reducer, undefined, () => createGame(configFor(mode, date)));
  const [result, setResult] = useState<Result | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  // Play time excludes pauses: `elapsed` banks finished stretches, `resumedAt` marks the running one.
  const elapsed = useRef(0);
  const resumedAt = useRef(0);
  const prevScore = useRef(0);
  const running = state.status === 'playing' && !paused;
  const runningRef = useRef(running);
  runningRef.current = running;

  const bankTime = () => {
    if (resumedAt.current) elapsed.current += Date.now() - resumedAt.current;
    resumedAt.current = 0;
  };
  const pause = useCallback(() => {
    if (!runningRef.current) return;
    bankTime();
    setPaused(true);
  }, []);
  const resume = useCallback(() => setPaused(false), []);

  const { width, height } = useWindowDimensions();
  const boardPx = Math.min(width - 32, height - 240, 560);
  const cell = Math.max(8, Math.floor(boardPx / state.cols));

  const controls = useControls(
    useCallback(
      (dir: Dir) => {
        resume();
        dispatch({ type: 'turn', dir });
      },
      [resume],
    ),
    useCallback(() => {
      resume();
      dispatch({ type: 'start' });
    }, [resume]),
  );

  useBackHandler(onExit);

  // Switching apps (or tabs on web) pauses instead of letting the snake run blind.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') pause();
    });
    return () => sub.remove();
  }, [pause]);

  // Game loop: re-armed whenever the speed changes.
  const interval = tickInterval(state.score);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), interval);
    return () => clearInterval(id);
  }, [running, interval]);

  useEffect(() => {
    if (running && !resumedAt.current) resumedAt.current = Date.now();
  }, [running]);

  useEffect(() => {
    if (state.score > prevScore.current) {
      haptics.eat();
      playSound('eat');
    }
    prevScore.current = state.score;
  }, [state.score]);

  useEffect(() => {
    if (state.status !== 'over') return;
    haptics.die();
    playSound('die');
    bankTime();
    const durationMs = elapsed.current;
    const run = { score: state.score, durationMs, cause: state.deathCause };
    if (mode === 'daily') {
      recordDaily(date, run).then(({ daily, streak, improved }) =>
        setResult({
          durationMs,
          best: daily.best,
          daily,
          streak,
          isBest: improved,
        }),
      );
    } else {
      recordClassic(state.score).then(({ best, improved }) =>
        setResult({
          durationMs,
          best,
          daily: null,
          streak: 0,
          isBest: improved,
        }),
      );
    }
    // Only react to the transition into 'over'.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const restart = () => {
    elapsed.current = 0;
    resumedAt.current = 0;
    prevScore.current = 0;
    setPaused(false);
    setResult(null);
    dispatch({ type: 'reset', config: configFor(mode, date) });
  };

  const onShare = async () => {
    if (!result) return;
    const text =
      mode === 'daily'
        ? shareText({
            day: dayNumber(),
            score: state.score,
            durationMs: result.durationMs,
            cause: state.deathCause,
            attempts: result.daily?.attempts ?? 1,
            streak: result.streak,
          })
        : `🐍 Snake — ${state.score} 🍎 in ${formatDuration(result.durationMs)}`;
    const how = await shareResult(text).catch(() => null);
    if (how === 'copied') {
      setToast('Copied to clipboard');
      setTimeout(() => setToast(null), 1800);
    }
  };

  const title = mode === 'daily' ? `Daily #${dayNumber()}` : 'Classic';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { width: cell * state.cols }]}>
        <Pressable onPress={onExit} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to menu">
          <Text style={styles.back}>‹ Menu</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.score} accessibilityLabel={`Score ${state.score}`}>
            🍎 {state.score}
          </Text>
          <Pressable
            onPress={pause}
            accessibilityRole="button"
            accessibilityLabel="Pause"
            hitSlop={12}
            disabled={!running}
            style={{ opacity: running ? 1 : 0.3 }}
          >
            <View style={styles.pauseIcon}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          </Pressable>
        </View>
      </View>

      <View {...controls} style={styles.playArea}>
        <Board state={state} cell={cell} />

        {state.status === 'ready' && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.hint}>Swipe to start</Text>
            <Text style={styles.subHint}>
              {mode === 'daily' ? 'Same board for everyone today' : 'Arrow keys or WASD on desktop'}
            </Text>
          </View>
        )}

        {paused && state.status === 'playing' && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.hint}>Paused</Text>
            <Text style={styles.subHint}>Tap or swipe to resume</Text>
          </View>
        )}

        {state.status === 'over' && result && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{result.isBest ? 'New best! 🎉' : 'Game over'}</Text>
              <Text style={styles.big}>{state.score}</Text>
              <Text style={styles.muted}>
                {formatDuration(result.durationMs)} · best {result.best}
                {result.daily ? ` · try ${result.daily.attempts}` : ''}
                {result.streak > 1 ? ` · 🔥 ${result.streak}` : ''}
              </Text>
              <View style={styles.buttons}>
                <Pressable
                  style={[styles.button, styles.primary]}
                  onPress={restart}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryText}>Play again</Text>
                </Pressable>
                <Pressable
                  style={styles.button}
                  onPress={onShare}
                  accessibilityRole="button"
                  accessibilityLabel="Share result"
                >
                  <Text style={styles.buttonText}>Share</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.footer}>{toast ?? ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.muted, fontSize: 16 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pauseIcon: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  pauseBar: { width: 4, height: 16, borderRadius: 1, backgroundColor: colors.muted },
  score: { color: colors.text, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  playArea: { alignItems: 'center', justifyContent: 'center', touchAction: 'none' } as object,
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,17,23,0.55)',
    borderRadius: 10,
  },
  hint: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subHint: { color: colors.muted, fontSize: 14, marginTop: 6 },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 240,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  big: { color: colors.accent, fontSize: 56, fontWeight: '800', fontVariant: ['tabular-nums'] },
  muted: { color: colors.muted, fontSize: 14 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  primary: { backgroundColor: colors.accent },
  primaryText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  footer: { color: colors.muted, fontSize: 14, height: 20 },
});
