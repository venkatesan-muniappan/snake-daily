import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Mode } from './src/screens/GameScreen';
import { GameScreen } from './src/screens/GameScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { colors } from './src/theme';

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  // Remount the menu on return so it re-reads today's stats.
  const [menuKey, setMenuKey] = useState(0);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        {mode ? (
          <GameScreen
            mode={mode}
            onExit={() => {
              setMode(null);
              setMenuKey((k) => k + 1);
            }}
          />
        ) : (
          <MenuScreen key={menuKey} onPlay={setMode} />
        )}
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
