import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openBook } from '../../components/BookTile';
import { Cover } from '../../components/Cover';
import { useChromeBottom } from '../../chrome';
import { chapterLabel, copy } from '../../copy';
import { formatLength, type SavedBook } from '../../model';
import { usePlayer } from '../../player/PlayerProvider';
import { colors, fonts, metrics } from '../../theme';

export default function LibraryScreen() {
  const player = usePlayer();
  const bottom = useChromeBottom(24);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
        <Text style={styles.title}>{copy.libraryTab}</Text>
        <Text style={styles.lead}>{copy.libraryEmptyBody}</Text>
        {player.library.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{copy.libraryEmptyTitle}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={styles.browse}>
              <Text style={styles.browseText}>{copy.browse}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {player.library.map((book) => (
              <LibraryRow key={book.id} book={book} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LibraryRow({ book }: { book: SavedBook }) {
  const player = usePlayer();
  const progress = player.progress[book.id];
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={book.title}
        onPress={() => openBook(book)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Cover uri={book.coverUrl} title={book.title} size={64} radius={10} />
        <View style={styles.copyBlock}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {book.author}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {progress
              ? `${chapterLabel(progress.trackIndex + 1, Math.max(progress.sectionCount, 1))} · ${formatLength(book.totalSec)}`
              : formatLength(book.totalSec)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.removeFromLibrary}
        hitSlop={8}
        onPress={() => {
          Alert.alert(book.title, copy.removeFromLibrary, [
            { text: copy.close, style: 'cancel' },
            { text: copy.remove, style: 'destructive', onPress: () => player.toggleLibrary(book) },
          ]);
        }}
        style={styles.remove}
      >
        <Text style={styles.removeText}>{copy.remove}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.displayItalic,
    fontSize: 40,
    paddingHorizontal: metrics.pad,
    paddingTop: 12,
  },
  lead: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: metrics.pad,
    marginTop: 6,
    marginBottom: 16,
  },
  empty: {
    marginHorizontal: metrics.pad,
    marginTop: 12,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  browse: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  browseText: {
    color: colors.onAccent,
    fontFamily: fonts.strong,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: metrics.pad,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingRight: 8,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 10,
  },
  copyBlock: {
    flex: 1,
  },
  bookTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 19,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  remove: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  removeText: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.82,
  },
});
