import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/** Android hardware back runs `onBack` instead of closing the app. No-op elsewhere. */
export function useBackHandler(onBack: () => void) {
  const handler = useRef(onBack);
  handler.current = onBack;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handler.current();
      return true;
    });
    return () => sub.remove();
  }, []);
}
