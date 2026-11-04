import { Platform } from 'react-native';
import { asList, cleanQuery, mapDetail, mapSummary, type BookDetail, type BookSummary, type RawBook, type RawSection } from './model';

const PAGE = 24;

export function catalogPageSize(): number {
  return PAGE;
}

function feedUrl(path: string, params: Record<string, string>): string {
  const query = new URLSearchParams({ format: 'json', ...params });
  const suffix = `/api/feed/${path}?${query.toString()}`;
  if (Platform.OS === 'web') return `/librivox-proxy${suffix}`;
  return `https://librivox.org${suffix}`;
}

async function getJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (Platform.OS !== 'web') {
        headers['User-Agent'] = 'Sesli/1.0 (personal audiobook; public LibriVox API)';
      }
      const response = await globalThis.fetch(url, { headers, signal: controller.signal });
      // LibriVox answers a search with no rows as 404, not an empty list.
      if (response.status === 404) return { books: [], sections: [] } as T;
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function fetchCatalogPage(offset: number): Promise<{ books: BookSummary[]; rawCount: number }> {
  const data = await getJson<{ books?: unknown }>(
    feedUrl('audiobooks', {
      limit: String(PAGE),
      offset: String(offset),
      coverart: '1',
      sort_order: 'asc',
    }),
  );
  const raw = asList<RawBook>(data.books);
  const books = raw.flatMap((book) => {
    const summary = mapSummary(book);
    return summary ? [summary] : [];
  });
  return { books, rawCount: raw.length };
}

export async function searchCatalog(input: string): Promise<BookSummary[]> {
  const query = cleanQuery(input);
  if (query.length < 2) return [];
  const [byTitle, byAuthor] = await Promise.all([
    getJson<{ books?: unknown }>(feedUrl('audiobooks', { title: `^${query}`, limit: '20', coverart: '1' })),
    getJson<{ books?: unknown }>(feedUrl('audiobooks', { author: query, limit: '20', coverart: '1' })),
  ]);
  const merged = new Map<string, BookSummary>();
  for (const book of [...asList<RawBook>(byTitle.books), ...asList<RawBook>(byAuthor.books)]) {
    const summary = mapSummary(book);
    if (summary) merged.set(summary.id, summary);
  }
  return [...merged.values()];
}

const bookCache = new Map<string, BookDetail>();
const inflight = new Map<string, Promise<BookDetail | null>>();

export async function fetchBook(id: string): Promise<BookDetail | null> {
  const cached = bookCache.get(id);
  if (cached) return cached;
  const pending = inflight.get(id);
  if (pending) return pending;
  const request = loadBook(id);
  inflight.set(id, request);
  try {
    const book = await request;
    if (book) bookCache.set(id, book);
    return book;
  } finally {
    inflight.delete(id);
  }
}

async function loadBook(id: string): Promise<BookDetail | null> {
  const [bookData, trackData] = await Promise.all([
    getJson<{ books?: unknown }>(feedUrl('audiobooks', { id, coverart: '1' })),
    getJson<{ sections?: unknown }>(feedUrl('audiotracks', { project_id: id })),
  ]);
  const raw = asList<RawBook>(bookData.books)[0];
  if (!raw) return null;
  return mapDetail(raw, asList<RawSection>(trackData.sections));
}
