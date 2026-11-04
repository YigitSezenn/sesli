import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { metrics } from './theme';
import { usePlayer } from './player/PlayerProvider';

export function isTabPath(path: string): boolean {
  return path === '/' || path === '/search' || path === '/library';
}

export function useChromeBottom(extra = 0): number {
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const player = usePlayer();
  const onPlayer = path === '/player';
  const mini = !onPlayer && player.book ? metrics.mini : 0;
  const tabs = isTabPath(path) ? metrics.tabBar + insets.bottom : insets.bottom;
  return tabs + mini + extra;
}
