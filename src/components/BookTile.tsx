import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sectionCountLabel } from '../copy';
import type { BookSummary } from '../model';
import { colors, fonts } from '../theme';
import { Cover } from './Cover';

export function openBook(book: {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  thumbUrl?: string | null;
  languageLabel?: string;
}): void {
  router.push({
    pathname: '/book/[id]',
    params: {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.coverUrl ?? book.thumbUrl ?? '',
      language: book.languageLabel ?? '',
    },
  });
}

export function BookShelf({ books }: { books: BookSummary[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
      {books.map((book) => (
        <Pressable
          key={book.id}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${book.author}`}
          onPress={() => openBook(book)}
          style={({ pressed }) => [styles.shelfItem, pressed && styles.pressed]}
        >
          <Cover uri={book.thumbUrl ?? book.coverUrl} title={book.title} radius={16} />
          <Text style={styles.shelfTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.shelfAuthor} numberOfLines={1}>
            {book.author}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function BookGrid({ books }: { books: BookSummary[] }) {
  return (
    <View style={styles.list}>
      {books.map((book) => (
        <Pressable
          key={book.id}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${book.author}`}
          onPress={() => openBook(book)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Cover uri={book.thumbUrl ?? book.coverUrl} title={book.title} size={84} radius={14} />
          <View style={styles.rowCopy}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {book.author}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {book.languageLabel} · {sectionCountLabel(book.sectionCount)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    paddingHorizontal: 20,
    gap: 14,
  },
  shelfItem: {
    width: 148,
  },
  shelfTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 10,
  },
  shelfAuthor: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 10,
  },
  rowCopy: {
    flex: 1,
  },
  pressed: {
    opacity: 0.84,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  author: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 4,
  },
  meta: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
  },
});
