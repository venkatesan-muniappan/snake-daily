import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Platform, Share } from 'react-native';

const native = Platform.OS !== 'web';

export const haptics = {
  eat: () => native && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  die: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};

/** Opens the share sheet; on desktop web, copies to the clipboard. Returns 'copied' in that case. */
export async function shareResult(message: string): Promise<'shared' | 'copied'> {
  if (native) {
    await Share.share({ message });
    return 'shared';
  }
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ text: message });
      return 'shared';
    } catch {
      // Cancelled or unsupported: fall through to clipboard.
    }
  }
  await Clipboard.setStringAsync(message);
  return 'copied';
}
