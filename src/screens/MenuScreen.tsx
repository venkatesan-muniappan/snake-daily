import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateKey, dayNumber } from '../game/daily';
import type { Stats } from '../storage';
import { initSound, isMuted, setMuted } from '../sound';
import { loadStats } from '../storage';
import { colors } from '../theme';
import type { Mode } from './GameScreen';

export function MenuScreen({ onPlay, onHowTo }: { onPlay: (mode: Mode) => void; onHowTo: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => {
    loadStats(dateKey()).then(setStats);
    initSound().then(() => setMutedState(isMuted()));
  }, []);

  const daily = stats?.daily;

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>🐍</Text>
      <Text style={styles.title}>Daily Snake</Text>
      <Text style={styles.tagline}>One new board every day. Same for everyone.</Text>

      <Pressable
        style={[styles.card, styles.dailyCard]}
        onPress={() => onPlay('daily')}
        accessibilityRole="button"
        accessibilityLabel={`Play daily number ${dayNumber()}. ${
          daily ? `Best ${daily.best}, ${daily.attempts} tries today.` : 'Not played yet.'
        }${stats?.streak ? ` ${stats.streak} day streak.` : ''}`}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardLabelDark}>TODAY · #{dayNumber()}</Text>
          {!!stats?.streak && (
            <Text style={styles.streak}>
              🔥 {stats.streak} day{stats.streak === 1 ? '' : 's'}
            </Text>
          )}
        </View>
        <Text style={styles.cardTitleDark}>Play the daily</Text>
        <Text style={styles.cardMetaDark}>
          {daily
            ? `Best ${daily.best} · ${daily.attempts} ${daily.attempts === 1 ? 'try' : 'tries'}`
            : 'Not played yet'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => onPlay('classic')}
        accessibilityRole="button"
        accessibilityLabel={`Play classic. Best ${stats?.classicBest ?? 0}.`}
      >
        <Text style={styles.cardLabel}>ENDLESS</Text>
        <Text style={styles.cardTitle}>Classic</Text>
        <Text style={styles.cardMeta}>Best {stats?.classicBest ?? 0}</Text>
      </Pressable>

      <View style={styles.links}>
        <Pressable onPress={onHowTo} hitSlop={10} accessibilityRole="button" accessibilityLabel="How to play">
          <Text style={styles.howto}>How to play</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
          hitSlop={10}
          accessibilityRole="switch"
          accessibilityState={{ checked: !muted }}
          accessibilityLabel="Sound"
        >
          <Text style={styles.howto}>{muted ? '🔇 Sound off' : '🔊 Sound on'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  logo: { fontSize: 56 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800' },
  tagline: { color: colors.muted, fontSize: 15, marginBottom: 12, textAlign: 'center' },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.surfaceRaised,
  },
  dailyCard: { backgroundColor: colors.accent },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streak: { color: colors.accentText, fontSize: 14, fontWeight: '700' },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  cardMeta: { color: colors.muted, fontSize: 14, marginTop: 4 },
  cardLabelDark: {
    color: colors.accentText,
    opacity: 0.7,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardTitleDark: { color: colors.accentText, fontSize: 22, fontWeight: '800', marginTop: 4 },
  cardMetaDark: { color: colors.accentText, opacity: 0.8, fontSize: 14, marginTop: 4 },
  links: { flexDirection: 'row', gap: 24, marginTop: 12 },
  howto: { color: colors.muted, fontSize: 15 },
});
