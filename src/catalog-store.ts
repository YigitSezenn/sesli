import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';
import { catalogPageSize, fetchCatalogPage } from './api';
import { copy } from './copy';
import type { BookSummary } from './model';

export type CatalogSnapshot = {
  books: BookSummary[];
  hasMore: boolean;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
};

const initialSnapshot: CatalogSnapshot = {
  books: [],
  hasMore: true,
  loading: true,
  refreshing: false,
  loadingMore: false,
  error: null,
};

let snapshot: CatalogSnapshot = initialSnapshot;
let nextOffset = 0;
let requestToken = 0;
let started = false;
const listeners = new Set<() => void>();
const skipped = new Set<string>();

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(next: CatalogSnapshot): void {
  snapshot = next;
  emit();
}

async function load(mode: 'first' | 'refresh' | 'more'): Promise<void> {
  const token = ++requestToken;
  const offset = mode === 'more' ? nextOffset : 0;
  commit({
    ...snapshot,
    loading: mode === 'first' && snapshot.books.length === 0,
    refreshing: mode === 'refresh',
    loadingMore: mode === 'more',
    error: mode === 'more' ? snapshot.error : null,
  });
  try {
    const pageSize = catalogPageSize();
    let collected: BookSummary[] = [];
    let cursor = offset;
    let hasMore = true;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const page = await fetchCatalogPage(cursor);
      cursor += pageSize;
      hasMore = page.rawCount === pageSize;
      collected = collected.concat(page.books.filter((book) => !skipped.has(book.id)));
      if (collected.length > 0 || !hasMore) break;
    }
    if (token !== requestToken) return;
    nextOffset = cursor;
    const previous = mode === 'more' ? snapshot.books : [];
    const seen = new Set(previous.map((book) => book.id));
    const books = [...previous];
    for (const book of collected) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      books.push(book);
    }
    commit({
      books,
      hasMore,
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
    });
  } catch {
    if (token !== requestToken) return;
    commit({
      ...snapshot,
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: copy.catalogError,
    });
  }
}

function ensureLoaded(): void {
  if (started) return;
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  started = true;
  void load('first');
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureLoaded();
  return () => listeners.delete(listener);
}

export function useCatalog(): CatalogSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => initialSnapshot);
}

export function refreshCatalog(): void {
  started = true;
  void load('refresh');
}

export function loadMoreCatalog(): void {
  if (snapshot.loading || snapshot.loadingMore || snapshot.refreshing || !snapshot.hasMore) return;
  void load('more');
}

export function markUnplayable(id: string): void {
  if (skipped.has(id)) return;
  skipped.add(id);
  commit({
    ...snapshot,
    books: snapshot.books.filter((book) => book.id !== id),
  });
}
