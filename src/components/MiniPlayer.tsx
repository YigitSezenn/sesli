import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isTabPath } from '../chrome';
import { copy } from '../copy';
import { formatClock } from '../model';
import { usePlaybackClock, usePlayer } from '../player/PlayerProvider';
import { colors, fonts, metrics } from '../theme';
import { Cover } from './Cover';

export function MiniPlayer() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const clock = usePlaybackClock();
  if (!player.book || path === '/player') return null;
  const track = player.book.tracks[player.trackIndex];
  const fraction = clock.duration > 0 ? Math.min(1, Math.max(0, clock.position / clock.duration)) : 0;
  const bottom = isTabPath(path) ? metrics.tabBar + insets.bottom : insets.bottom;

  return (
    <View style={[styles.wrap, { bottom }]}>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={player.book.title} onPress={() => router.push('/player')} style={styles.main}>
          <Cover uri={player.book.coverUrl ?? player.book.thumbUrl} title={player.book.title} size={46} radius={8} />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {player.book.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {track?.title ?? player.book.author} · {formatClock(clock.position)}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clock.playing ? copy.pause : copy.play}
          hitSlop={8}
          onPress={() => player.toggle()}
          style={styles.play}
        >
          <Ionicons name={clock.playing ? 'pause' : 'play'} size={18} color={colors.onAccent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: metrics.mini,
    backgroundColor: '#10151F',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    overflow: 'hidden',
    zIndex: 20,
  },
  progress: {
    height: 2,
    backgroundColor: 'rgba(246, 241, 232, 0.08)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 10,
    paddingVertical: 8,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  play: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
