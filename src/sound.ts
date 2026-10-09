import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AudioPlayer } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOURCES = {
  eat: require('../assets/sounds/eat.wav'),
  die: require('../assets/sounds/die.wav'),
};
type Effect = keyof typeof SOURCES;

const MUTED_KEY = 'settings:muted';
const players: Partial<Record<Effect, AudioPlayer>> = {};
let muted = false;
let ready: Promise<void> | null = null;

/** Loads the mute setting and audio session once; safe to call repeatedly. */
export function initSound(): Promise<void> {
  ready ??= (async () => {
    muted = (await AsyncStorage.getItem(MUTED_KEY).catch(() => null)) === '1';
    // Short effects: respect the silent switch and never pause the player's music.
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  })();
  return ready;
}

export function isMuted(): boolean {
  return muted;
}

export async function setMuted(value: boolean): Promise<void> {
  muted = value;
  await AsyncStorage.setItem(MUTED_KEY, value ? '1' : '0').catch(() => {});
}

export function playSound(effect: Effect): void {
  if (muted) return;
  try {
    const player = (players[effect] ??= createAudioPlayer(SOURCES[effect]));
    player.volume = 0.6;
    player.seekTo(0).then(
      () => player.play(),
      () => player.play(),
    );
  } catch {
    // Audio is decoration; never let it break the game.
  }
}
