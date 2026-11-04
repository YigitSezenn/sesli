export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export type RawAuthor = {
  first_name?: string;
  last_name?: string;
};

export type RawSection = {
  id?: string | number;
  section_number?: string | number;
  title?: string;
  listen_url?: string | null;
  playtime?: string | number;
};

export type RawBook = {
  id?: string | number;
  title?: string;
  description?: string;
  language?: string;
  copyright_year?: string;
  num_sections?: string | number;
  totaltime?: string;
  totaltimesecs?: string | number;
  url_zip_file?: string;
  coverart_jpg?: string;
  coverart_thumbnail?: string;
  authors?: RawAuthor[] | RawAuthor | null;
  sections?: RawSection[] | RawSection | null;
};

export type BookSummary = {
  id: string;
  title: string;
  author: string;
  language: string;
  languageLabel: string;
  sectionCount: number;
  totalSec: number;
  year: string | null;
  coverUrl: string | null;
  thumbUrl: string | null;
};

export type Track = {
  id: string;
  number: number;
  title: string;
  url: string;
  durationSec: number;
};

export type BookDetail = BookSummary & {
  description: string;
  tracks: Track[];
};

export type SavedBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  language: string;
  languageLabel: string;
  sectionCount: number;
  totalSec: number;
  addedAt: number;
};

export type SavedProgress = {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  languageLabel: string;
  sectionCount: number;
  trackIndex: number;
  trackTitle: string;
  positionSec: number;
  durationSec: number;
  speed: number;
  updatedAt: number;
};

const LANGUAGE_TR: Record<string, string> = {
  English: 'İngilizce',
  Turkish: 'Türkçe',
  French: 'Fransızca',
  German: 'Almanca',
  Spanish: 'İspanyolca',
  Italian: 'İtalyanca',
  Portuguese: 'Portekizce',
  Dutch: 'Felemenkçe',
  Russian: 'Rusça',
  Polish: 'Lehçe',
  Swedish: 'İsveççe',
  Danish: 'Danca',
  Norwegian: 'Norveççe',
  Finnish: 'Fince',
  Hungarian: 'Macarca',
  Czech: 'Çekçe',
  Greek: 'Yunanca',
  Latin: 'Latince',
  Arabic: 'Arapça',
  Chinese: 'Çince',
  Japanese: 'Japonca',
  Multilingual: 'Çok dilli',
  Hebrew: 'İbranice',
  Romanian: 'Romence',
  Ukrainian: 'Ukraynaca',
  Catalan: 'Katalanca',
  Esperanto: 'Esperanto',
};

const AUDIO_EXT = /\.(mp3|m4a|m4b|ogg|oga|opus|aac|wav|flac)$/i;

export function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') return [value as T];
  return [];
}

export function isSpeed(value: number): value is Speed {
  return (SPEEDS as readonly number[]).includes(value);
}

export function languageLabel(language: string | undefined): string {
  if (!language?.trim()) return 'Dil belirsiz';
  return LANGUAGE_TR[language] ?? language;
}

export function stripHtml(input: string): string {
  const withBreaks = input
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<\s*\/?\s*p[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '');
  const decoded = withBreaks
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, digits: string) => fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromCodePoint(parseInt(hex, 16)));
  return decoded
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function fromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

export function formatAuthors(authors: RawBook['authors']): string {
  const names = asList<RawAuthor>(authors)
    .map((author) => {
      const name = [author.first_name, author.last_name]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      if (!name) return '';
      if (name === 'Various') return 'Çeşitli';
      return name;
    })
    .filter(Boolean);
  return names.length ? names.join(', ') : 'Bilinmeyen yazar';
}

export function formatClock(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '0:00';
  const rounded = Math.floor(totalSec);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${minutes}:${ss}`;
}

export function formatLength(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return 'Süre yok';
  const rounded = Math.floor(totalSec);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} sa ${minutes} dk`;
  if (hours > 0) return `${hours} sa`;
  if (minutes > 0) return `${minutes} dk`;
  return `${rounded} sn`;
}

export function formatRate(rate: number): string {
  const text = Number.isInteger(rate) ? String(rate) : String(rate).replace('.', ',');
  return `${text}×`;
}

export function parseClock(value: string | undefined): number {
  if (!value) return 0;
  const parts = value.split(':').map((part) => Number(part));
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

export function cleanQuery(input: string): string {
  return input.replace(/[\u0000-\u001f^]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function toPlayableArchiveUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const archive = host === 'archive.org' || host.endsWith('.archive.org');
  if (!archive || !AUDIO_EXT.test(parsed.pathname)) return null;
  parsed.protocol = 'https:';
  parsed.hash = '';
  return parsed.toString();
}

export function isArchiveZip(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\/(?:[\w.-]+\.)?archive\.org\//i.test(url.trim());
}

function safeCover(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const allowed =
    host === 'archive.org' ||
    host.endsWith('.archive.org') ||
    host === 'librivox.org' ||
    host.endsWith('.librivox.org');
  if (!allowed) return null;
  parsed.protocol = 'https:';
  return parsed.toString();
}

function positiveNumber(value: string | number | undefined): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function mapSummary(raw: RawBook): BookSummary | null {
  const id = raw.id == null ? '' : String(raw.id).trim();
  const title = raw.title?.trim() ?? '';
  const sectionCount = Math.floor(positiveNumber(raw.num_sections));
  if (!id || !title || sectionCount < 1 || !isArchiveZip(raw.url_zip_file)) return null;
  const totalFromSeconds = positiveNumber(raw.totaltimesecs);
  const year = raw.copyright_year?.trim() || null;
  return {
    id,
    title,
    author: formatAuthors(raw.authors),
    language: raw.language?.trim() || '',
    languageLabel: languageLabel(raw.language),
    sectionCount,
    totalSec: totalFromSeconds || parseClock(raw.totaltime),
    year: year && year !== '0' ? year : null,
    coverUrl: safeCover(raw.coverart_jpg),
    thumbUrl: safeCover(raw.coverart_thumbnail),
  };
}

export function mapTracks(sections: unknown): Track[] {
  const tracks = asList<RawSection>(sections).flatMap((section, index) => {
    const url = toPlayableArchiveUrl(section.listen_url);
    if (!url) return [];
    const number = Math.floor(positiveNumber(section.section_number)) || index + 1;
    const title = section.title?.trim() || `Bölüm ${number}`;
    const id = section.id == null ? `${number}-${index}` : String(section.id);
    return [
      {
        id,
        number,
        title,
        url,
        durationSec: positiveNumber(section.playtime),
      },
    ];
  });
  tracks.sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));
  return tracks;
}

export function mapDetail(raw: RawBook, sections?: unknown): BookDetail | null {
  const id = raw.id == null ? '' : String(raw.id).trim();
  const title = raw.title?.trim() ?? '';
  if (!id || !title) return null;
  const tracks = mapTracks(sections ?? raw.sections);
  if (!tracks.length) return null;
  const summary = mapSummary(raw);
  const totalFromSeconds = positiveNumber(raw.totaltimesecs);
  const base: BookSummary = summary ?? {
    id,
    title,
    author: formatAuthors(raw.authors),
    language: raw.language?.trim() || '',
    languageLabel: languageLabel(raw.language),
    sectionCount: tracks.length,
    totalSec: totalFromSeconds || parseClock(raw.totaltime),
    year: raw.copyright_year?.trim() || null,
    coverUrl: safeCover(raw.coverart_jpg),
    thumbUrl: safeCover(raw.coverart_thumbnail),
  };
  return {
    ...base,
    sectionCount: tracks.length,
    description: stripHtml(raw.description ?? ''),
    tracks,
  };
}

export function bookFraction(entry: Pick<SavedProgress, 'trackIndex' | 'positionSec' | 'durationSec' | 'sectionCount'>): number {
  if (entry.sectionCount < 1) return 0;
  const within = entry.durationSec > 0 ? Math.min(1, Math.max(0, entry.positionSec / entry.durationSec)) : 0;
  return Math.min(1, (entry.trackIndex + within) / entry.sectionCount);
}

export function toSavedBook(
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    thumbUrl?: string | null;
    language?: string;
    languageLabel: string;
    sectionCount: number;
    totalSec: number;
  },
  addedAt: number,
): SavedBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl ?? book.thumbUrl ?? null,
    language: book.language ?? '',
    languageLabel: book.languageLabel,
    sectionCount: book.sectionCount,
    totalSec: book.totalSec,
    addedAt,
  };
}
