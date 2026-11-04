import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchBook } from '../../api';
import { Cover } from '../../components/Cover';
import { markUnplayable } from '../../catalog-store';
import { useChromeBottom } from '../../chrome';
import { chapterLabel, copy, sectionCountLabel, textYearLabel } from '../../copy';
import { formatClock, formatLength, type BookDetail } from '../../model';
import { usePlayer } from '../../player/PlayerProvider';
import { colors, fonts, metrics } from '../../theme';

type Phase = 'loading' | 'ready' | 'missing' | 'error';

export default function BookScreen() {
  const params = useLocalSearchParams<{ id: string; title?: string; author?: string; cover?: string; language?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const previewTitle = first(params.title);
  const previewAuthor = first(params.author);
  const previewCover = first(params.cover);
  const previewLanguage = first(params.language);
  const player = usePlayer();
  const bottom = useChromeBottom(32);
  const [phase, setPhase] = useState<Phase>('loading');
  const [book, setBook] = useState<BookDetail | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPhase('loading');
    void fetchBook(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          markUnplayable(id);
          setPhase('missing');
          return;
        }
        setBook(loaded);
        setPhase('ready');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, reload]);

  const saved = book ? player.progress[book.id] : undefined;
  const savedHere = book ? player.isSaved(book.id) : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.backHome} onPress={() => back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={styles.backText}>{copy.backHome}</Text>
        </Pressable>

        <View style={styles.hero}>
          <Cover uri={book?.coverUrl ?? previewCover ?? null} title={book?.title ?? previewTitle ?? copy.appName} radius={18} />
        </View>
        <Text style={styles.title}>{book?.title ?? previewTitle ?? copy.loadingBook}</Text>
        <Text style={styles.author}>{book?.author ?? previewAuthor ?? ''}</Text>

        {book ? (
          <View style={styles.chips}>
            <Chip label={book.languageLabel || previewLanguage || ''} />
            <Chip label={formatLength(book.totalSec)} />
            <Chip label={sectionCountLabel(book.tracks.length)} />
            {book.year ? <Chip label={textYearLabel(book.year)} /> : null}
          </View>
        ) : null}

        {phase === 'loading' ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.statusText}>{copy.loadingBook}</Text>
          </View>
        ) : null}
        {phase === 'error' ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{copy.bookError}</Text>
            <Pressable accessibilityRole="button" onPress={() => setReload((value) => value + 1)} style={styles.secondary}>
              <Text style={styles.secondaryText}>{copy.retry}</Text>
            </Pressable>
          </View>
        ) : null}
        {phase === 'missing' ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{copy.unplayable}</Text>
          </View>
        ) : null}

        {book && phase === 'ready' ? (
          <>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={saved ? copy.resume : copy.listen}
                onPress={() => {
                  player.playBook(book, saved?.trackIndex ?? 0, saved?.positionSec ?? 0);
                  router.push('/player');
                }}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              >
                <Ionicons name="play" size={18} color={colors.onAccent} />
                <Text style={styles.primaryText}>{saved ? copy.resume : copy.listen}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={savedHere ? copy.removeFromLibrary : copy.addToLibrary}
                onPress={() => player.toggleLibrary(book)}
                style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
              >
                <Ionicons name={savedHere ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.ink} />
                <Text style={styles.secondaryText}>{savedHere ? copy.saved : copy.save}</Text>
              </Pressable>
            </View>

            {book.description ? (
              <View style={styles.about}>
                <Text style={styles.aboutTitle}>{copy.about}</Text>
                <Text style={styles.description} numberOfLines={expanded ? undefined : 4}>
                  {book.description}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)}>
                  <Text style={styles.expand}>{expanded ? copy.less : copy.more}</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.blockTitle}>{copy.chapters}</Text>
            {book.tracks.map((track, index) => {
              const active = player.book?.id === book.id && player.trackIndex === index;
              return (
                <Pressable
                  key={track.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${track.title}, ${formatClock(track.durationSec)}`}
                  onPress={() => {
                    player.playBook(book, index, 0);
                    router.push('/player');
                  }}
                  style={[styles.chapter, active && styles.chapterActive]}
                >
                  <Text style={[styles.chapterIndex, active && styles.chapterIndexActive]}>{track.number}</Text>
                  <View style={styles.chapterCopy}>
                    <Text style={[styles.chapterTitle, active && styles.chapterTitleActive]} numberOfLines={2}>
                      {track.title}
                    </Text>
                    {active ? <Text style={styles.now}>{chapterLabel(index + 1, book.tracks.length)}</Text> : null}
                  </View>
                  <Text style={styles.chapterTime}>{track.durationSec > 0 ? formatClock(track.durationSec) : '—'}</Text>
                </Pressable>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label }: { label: string }) {
  if (!label) return null;
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function back(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingTop: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  hero: {
    paddingHorizontal: 72,
    paddingTop: 12,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    paddingHorizontal: metrics.pad,
    marginTop: 18,
  },
  author: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: metrics.pad,
    marginTop: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: metrics.pad,
    marginTop: 14,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: metrics.pad,
    marginTop: 18,
  },
  primary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: colors.onAccent,
    fontFamily: fonts.strong,
    fontSize: 16,
  },
  secondary: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgElevated,
  },
  secondaryText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  about: {
    paddingHorizontal: metrics.pad,
    marginTop: 22,
  },
  aboutTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 22,
    marginBottom: 8,
  },
  blockTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 22,
    paddingHorizontal: metrics.pad,
    marginTop: 26,
    marginBottom: 8,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  expand: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginTop: 8,
  },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  chapterActive: {
    backgroundColor: colors.bgElevated,
  },
  chapterIndex: {
    width: 32,
    color: colors.faint,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: 'center',
  },
  chapterIndexActive: {
    color: colors.accent,
  },
  chapterCopy: {
    flex: 1,
  },
  chapterTitle: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
  },
  chapterTitleActive: {
    fontFamily: fonts.semibold,
  },
  now: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginTop: 2,
  },
  chapterTime: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  status: {
    alignItems: 'center',
    gap: 12,
    padding: 28,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.84,
  },
});
