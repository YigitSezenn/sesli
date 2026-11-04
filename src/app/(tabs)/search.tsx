import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchCatalog } from '../../api';
import { BookGrid } from '../../components/BookTile';
import { useChromeBottom } from '../../chrome';
import { copy } from '../../copy';
import { cleanQuery, type BookSummary } from '../../model';
import { colors, fonts, metrics } from '../../theme';

const examples = ['Austen', 'Secret', 'Dumas'];

export default function SearchScreen() {
  const bottom = useChromeBottom(24);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSummary[]>([]);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    const cleaned = cleanQuery(query);
    if (cleaned.length < 2) {
      setResults([]);
      setPhase('idle');
      return;
    }
    setPhase('loading');
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchCatalog(cleaned)
        .then((books) => {
          if (cancelled) return;
          setResults(books);
          setPhase('done');
        })
        .catch(() => {
          if (cancelled) return;
          setPhase('error');
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottom }}>
        <Text style={styles.title}>{copy.searchTab}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={copy.searchPlaceholder}
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
          accessibilityLabel={copy.searchPlaceholder}
        />
        <Text style={styles.hint}>{copy.searchHint}</Text>
        {phase === 'idle' ? (
          <View style={styles.examples}>
            {examples.map((example) => (
              <Pressable key={example} accessibilityRole="button" onPress={() => setQuery(example)} style={styles.chip}>
                <Text style={styles.chipText}>{example}</Text>
              </Pressable>
            ))}
            <Text style={styles.idle}>{copy.searchIdle}</Text>
          </View>
        ) : null}
        {phase === 'loading' && results.length === 0 ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.statusText}>{copy.searching}</Text>
          </View>
        ) : null}
        {phase === 'error' ? <Text style={styles.statusText}>{copy.searchError}</Text> : null}
        {phase === 'done' && results.length === 0 ? <Text style={styles.statusText}>{copy.searchEmpty}</Text> : null}
        {results.length > 0 ? <BookGrid books={results} /> : null}
      </ScrollView>
    </SafeAreaView>
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
  input: {
    marginHorizontal: metrics.pad,
    marginTop: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hint: {
    color: colors.faint,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: metrics.pad,
    marginTop: 10,
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: metrics.pad,
    marginTop: 16,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgElevated,
  },
  chipText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  idle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    width: '100%',
    marginTop: 6,
  },
  status: {
    alignItems: 'center',
    gap: 10,
    padding: 28,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: metrics.pad,
    paddingTop: 20,
  },
});
