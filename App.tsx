import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Mode } from './src/screens/GameScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HowToScreen } from './src/screens/HowToScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { initSound } from './src/sound';
import { hasSeenHowTo, markHowToSeen } from './src/storage';
import { colors } from './src/theme';

type Screen =
  | { name: 'loading' }
  | { name: 'menu' }
  | { name: 'howto'; firstRun: boolean }
  | { name: 'game'; mode: Mode };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });
  // Remount the menu on return so it re-reads today's stats.
  const [menuKey, setMenuKey] = useState(0);

  useEffect(() => {
    initSound();
    hasSeenHowTo().then((seen) => setScreen(seen ? { name: 'menu' } : { name: 'howto', firstRun: true }));
  }, []);

  const toMenu = () => {
    setScreen({ name: 'menu' });
    setMenuKey((k) => k + 1);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        {screen.name === 'game' && <GameScreen mode={screen.mode} onExit={toMenu} />}
        {screen.name === 'menu' && (
          <MenuScreen
            key={menuKey}
            onPlay={(mode) => setScreen({ name: 'game', mode })}
            onHowTo={() => setScreen({ name: 'howto', firstRun: false })}
          />
        )}
        {screen.name === 'howto' && (
          <HowToScreen
            firstRun={screen.firstRun}
            onDone={() => {
              markHowToSeen();
              toMenu();
            }}
          />
        )}
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
