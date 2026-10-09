import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useBackHandler } from '../hooks/useBackHandler';
import { colors } from '../theme';

function Swatch({ color, round }: { color: string; round?: boolean }) {
  return <View style={[styles.swatch, { backgroundColor: color, borderRadius: round ? 10 : 4 }]} />;
}

function Rule({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <View style={styles.rule}>
      <View style={styles.ruleIcon}>{icon}</View>
      <View style={styles.ruleText}>
        <Text style={styles.ruleTitle}>{title}</Text>
        <Text style={styles.ruleBody}>{body}</Text>
      </View>
    </View>
  );
}

export function HowToScreen({ onDone, firstRun }: { onDone: () => void; firstRun: boolean }) {
  useBackHandler(onDone);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        How to play
      </Text>

      <View style={styles.rules}>
        <Rule
          icon={<Text style={styles.emoji}>👆</Text>}
          title="Swipe to turn"
          body="Swipe anywhere on the board. On a keyboard, use the arrow keys or WASD."
        />
        <Rule
          icon={<Swatch color={colors.food} round />}
          title="Eat to grow"
          body="Each fruit adds a segment, a point, and a little speed."
        />
        <Rule
          icon={<Swatch color={colors.wall} />}
          title="Don't crash"
          body="Hitting a wall, the edge, or your own tail ends the run."
        />
        <Rule
          icon={<Text style={styles.emoji}>📅</Text>}
          title="One daily board"
          body="Everyone gets the same walls and fruit order each day. Play as often as you like; your best counts."
        />
        <Rule
          icon={<Text style={styles.emoji}>🔥</Text>}
          title="Keep the streak"
          body="Play the daily on consecutive days to build your streak."
        />
      </View>

      <Text style={styles.sectionLabel}>YOUR SHARE CARD</Text>
      <View style={styles.sample}>
        <Text style={styles.sampleText}>
          {'🐍 Daily Snake #12\n🍎 23  ⏱ 1:42  🌀\n🟩🟩🟩🟩🟨⬛⬛⬛⬛⬛\n2 tries · 🔥 5'}
        </Text>
      </View>
      <Text style={styles.ruleBody}>
        Each 🟩 is 5 fruits. 🧱 wall, 💥 edge and 🌀 self show how the run ended.
      </Text>

      <Pressable style={styles.button} onPress={onDone} accessibilityRole="button">
        <Text style={styles.buttonText}>{firstRun ? "Let's play" : 'Back to menu'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'center' },
  rules: { gap: 14 },
  rule: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  ruleIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
  ruleText: { flex: 1 },
  ruleTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  ruleBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  emoji: { fontSize: 20 },
  swatch: { width: 20, height: 20 },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  sample: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 14 },
  sampleText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: colors.accentText, fontSize: 17, fontWeight: '700' },
});
