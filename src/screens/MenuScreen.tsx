import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateKey, dayNumber } from '../game/daily';
import type { Stats } from '../storage';
import { loadStats } from '../storage';
import { colors } from '../theme';
import type { Mode } from './GameScreen';

export function MenuScreen({ onPlay }: { onPlay: (mode: Mode) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats(dateKey()).then(setStats);
  }, []);

  const daily = stats?.daily;

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>🐍</Text>
      <Text style={styles.title}>Daily Snake</Text>
      <Text style={styles.tagline}>One new board every day. Same for everyone.</Text>

      <Pressable style={[styles.card, styles.dailyCard]} onPress={() => onPlay('daily')}>
        <Text style={styles.cardLabelDark}>TODAY · #{dayNumber()}</Text>
        <Text style={styles.cardTitleDark}>Play the daily</Text>
        <Text style={styles.cardMetaDark}>
          {daily
            ? `Best ${daily.best} · ${daily.attempts} ${daily.attempts === 1 ? 'try' : 'tries'}`
            : 'Not played yet'}
        </Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => onPlay('classic')}>
        <Text style={styles.cardLabel}>ENDLESS</Text>
        <Text style={styles.cardTitle}>Classic</Text>
        <Text style={styles.cardMeta}>Best {stats?.classicBest ?? 0}</Text>
      </Pressable>

      <Text style={styles.howto}>Swipe to turn · eat 🍎 to grow · avoid walls and yourself</Text>
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
  howto: { color: colors.muted, fontSize: 13, marginTop: 12, textAlign: 'center' },
});
