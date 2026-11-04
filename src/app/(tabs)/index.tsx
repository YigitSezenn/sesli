import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../../components/BrandMark';
import { BookShelf } from '../../components/BookTile';
import { Cover } from '../../components/Cover';
import { loadMoreCatalog, refreshCatalog, useCatalog } from '../../catalog-store';
import { useChromeBottom } from '../../chrome';
import { chapterLabel, copy } from '../../copy';
import { bookFraction, formatClock, type SavedProgress } from '../../model';
import { usePlayer } from '../../player/PlayerProvider';
import { colors, fonts, metrics } from '../../theme';

export default function HomeScreen() {
  const catalog = useCatalog();
  const player = usePlayer();
  const bottom = useChromeBottom(28);
  const continueItems = useMemo(
    () => Object.values(player.progress).sort((a, b) => b.updatedAt - a.updatedAt),
    [player.progress],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom }}
        refreshControl={
          <RefreshControl
            refreshing={catalog.refreshing}
            onRefresh={refreshCatalog}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.header} accessibilityRole="header" accessibilityLabel="Sesli, kamu malı sesli kitap">
          <BrandMark size={52} />
          <View style={styles.headerCopy}>
            <Text style={styles.wordmark}>{copy.appName}</Text>
            <Text style={styles.tagline}>{copy.tagline}</Text>
          </View>
        </View>

        <Text style={styles.section}>{copy.continueTitle}</Text>
        {player.hydrated && continueItems.length === 0 ? (
          <Text style={styles.empty}>{copy.continueEmpty}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueRow}>
            {continueItems.map((entry) => (
              <ContinueCard key={entry.bookId} entry={entry} preparing={player.preparingId === entry.bookId} />
            ))}
          </ScrollView>
        )}

        <View style={styles.catalogHead}>
          <Text style={styles.section}>{copy.catalog}</Text>
          <Text style={styles.count}>{catalog.books.length > 0 ? `${catalog.books.length} kitap` : ''}</Text>
        </View>

        {catalog.loading && catalog.books.length === 0 ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.statusText}>{copy.loadingCatalog}</Text>
          </View>
        ) : null}

        {catalog.error && catalog.books.length === 0 ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{catalog.error}</Text>
            <Pressable accessibilityRole="button" onPress={refreshCatalog} style={styles.retry}>
              <Text style={styles.retryText}>{copy.retry}</Text>
            </Pressable>
          </View>
        ) : (
          <BookShelf books={catalog.books} />
        )}

        {catalog.books.length > 0 && catalog.hasMore ? (
          <Pressable
            accessibilityRole="button"
            disabled={catalog.loadingMore}
            onPress={loadMoreCatalog}
            style={({ pressed }) => [styles.more, pressed && styles.pressed]}
          >
            {catalog.loadingMore ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.moreText}>{copy.loadMore}</Text>
            )}
          </Pressable>
        ) : null}
        <Text style={styles.note}>{copy.sourceNote}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContinueCard({ entry, preparing }: { entry: SavedProgress; preparing: boolean }) {
  const player = usePlayer();
  const fraction = bookFraction(entry);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.title}, ${chapterLabel(entry.trackIndex + 1, entry.sectionCount)}`}
      disabled={preparing}
      onPress={() => {
        void player.resume(entry).then((ok) => {
          if (!ok) {
            Alert.alert(copy.appName, copy.unplayable);
            return;
          }
          router.push('/player');
        });
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Cover uri={entry.coverUrl} title={entry.title} size={112} radius={16} />
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {entry.title}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {chapterLabel(entry.trackIndex + 1, Math.max(entry.sectionCount, 1))} · {formatClock(entry.positionSec)}
        </Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${fraction * 100}%` }]} />
        </View>
      </View>
      {preparing ? <ActivityIndicator color={colors.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: metrics.pad,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCopy: {
    flex: 1,
  },
  wordmark: {
    color: colors.ink,
    fontFamily: fonts.displayItalic,
    fontSize: 34,
    lineHeight: 38,
  },
  tagline: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 22,
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: metrics.pad,
  },
  catalogHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: metrics.pad,
  },
  count: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginBottom: 14,
  },
  empty: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: metrics.pad,
  },
  continueRow: {
    paddingHorizontal: metrics.pad,
    gap: 12,
  },
  card: {
    width: 340,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 12,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 19,
  },
  cardMeta: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
  },
  track: {
    height: 3,
    borderRadius: 99,
    backgroundColor: colors.line,
    marginTop: 10,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.sage,
  },
  status: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  retry: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.onAccent,
    fontFamily: fonts.strong,
    fontSize: 14,
  },
  more: {
    marginHorizontal: metrics.pad,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  note: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: metrics.pad,
    paddingTop: 18,
  },
  pressed: {
    opacity: 0.8,
  },
});
