import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { Cover } from '../components/Cover';
import { SeekBar } from '../components/SeekBar';
import { chapterLabel, copy } from '../copy';
import { formatClock, formatRate, SPEEDS, type Speed } from '../model';
import { usePlaybackClock, usePlayer } from '../player/PlayerProvider';
import { colors, fonts, metrics } from '../theme';

export default function PlayerScreen() {
  const player = usePlayer();
  const clock = usePlaybackClock();
  const book = player.book;
  const track = book?.tracks[player.trackIndex];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={() => close()} style={styles.close}>
            <Ionicons name="chevron-down" size={26} color={colors.ink} />
          </Pressable>
          <View style={styles.brandRow}>
            <BrandMark size={28} />
            <Text style={styles.kicker}>{copy.appName}</Text>
          </View>
          <View style={styles.close} />
        </View>

        {book && track ? (
          <>
            <View style={styles.coverWrap}>
              <Cover uri={book.coverUrl ?? book.thumbUrl} title={book.title} radius={28} />
            </View>
            <Text style={styles.chapterKicker}>{chapterLabel(player.trackIndex + 1, book.tracks.length)}</Text>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {track.title}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/book/${book.id}`)}>
              <Text style={styles.bookTitle} numberOfLines={1}>
                {book.title}
              </Text>
              <Text style={styles.author} numberOfLines={1}>
                {book.author}
              </Text>
            </Pressable>

            <View style={styles.seekBlock}>
              <SeekBar position={clock.position} duration={clock.duration || track.durationSec} onSeek={player.seek} />
              <View style={styles.times}>
                <Text style={styles.time}>{formatClock(clock.position)}</Text>
                <Text style={styles.time}>{formatClock(clock.duration || track.durationSec)}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <Round icon="play-skip-back" label={copy.prevChapter} onPress={() => player.skipChapter(-1)} disabled={player.trackIndex === 0} />
              <Round icon="play-back" label={copy.back15} onPress={() => player.skipBy(-15)} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={clock.playing ? copy.pause : copy.play}
                onPress={player.toggle}
                style={({ pressed }) => [styles.play, pressed && styles.pressed]}
              >
                <Ionicons name={clock.playing ? 'pause' : 'play'} size={32} color={colors.onAccent} style={clock.playing ? undefined : styles.playNudge} />
              </Pressable>
              <Round icon="play-forward" label={copy.forward15} onPress={() => player.skipBy(15)} />
              <Round
                icon="play-skip-forward"
                label={copy.nextChapter}
                onPress={() => player.skipChapter(1)}
                disabled={player.trackIndex >= book.tracks.length - 1}
              />
            </View>
            {clock.buffering ? <Text style={styles.buffering}>{copy.loadingBook}</Text> : null}

            <Text style={styles.speedLabel}>{copy.volume}</Text>
            <View style={styles.volumeRow}>
              <Round icon="volume-low" label={copy.quieter} onPress={() => player.changeVolume(-0.1)} disabled={player.volume <= 0} />
              <View style={styles.volumeTrack}>
                <View style={[styles.volumeFill, { width: `${Math.round(player.volume * 100)}%` }]} />
              </View>
              <Round icon="volume-high" label={copy.louder} onPress={() => player.changeVolume(0.1)} disabled={player.volume >= 1} />
            </View>
            <Text style={styles.volumeValue}>{Math.round(player.volume * 100)}%</Text>

            <Text style={styles.speedLabel}>{copy.speed}</Text>
            <View style={styles.speeds}>
              {SPEEDS.map((rate) => {
                const selected = player.speed === rate;
                return (
                  <Pressable
                    key={rate}
                    accessibilityRole="button"
                    accessibilityLabel={formatRate(rate)}
                    onPress={() => player.setSpeed(rate as Speed)}
                    style={[styles.speed, selected && styles.speedSelected]}
                  >
                    <Text style={[styles.speedText, selected && styles.speedTextSelected]}>{formatRate(rate)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{copy.playerEmpty}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.browse}>
              <Text style={styles.browseText}>{copy.browse}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Round({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.round, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

function close(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 28,
    flexGrow: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kicker: {
    color: colors.faint,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  coverWrap: {
    paddingHorizontal: 28,
    paddingTop: 4,
  },
  chapterKicker: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 22,
  },
  trackTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
    paddingHorizontal: metrics.pad,
    marginTop: 6,
  },
  bookTitle: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: metrics.pad,
  },
  author: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  seekBlock: {
    paddingHorizontal: metrics.pad,
    marginTop: 18,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 8,
  },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  play: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playNudge: {
    marginLeft: 3,
  },
  disabled: {
    opacity: 0.35,
  },
  buffering: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  volumeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  volumeValue: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  speedLabel: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 26,
  },
  speeds: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  speed: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
  },
  speedSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  speedText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  speedTextSelected: {
    color: colors.onAccent,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  browse: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  browseText: {
    color: colors.onAccent,
    fontFamily: fonts.strong,
  },
  pressed: {
    opacity: 0.84,
  },
});
