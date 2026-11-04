import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSpeed, type SavedBook, type SavedProgress, type Speed } from './model';

const LIBRARY_KEY = 'sesli.library.v1';
const PROGRESS_KEY = 'sesli.progress.v1';
const SPEED_KEY = 'sesli.speed.v1';

export type StoredState = {
  library: SavedBook[];
  progress: Record<string, SavedProgress>;
  speed: Speed;
};

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isProgressMap(value: unknown): value is Record<string, SavedProgress> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function loadStoredState(): Promise<StoredState> {
  const entries = await AsyncStorage.multiGet([LIBRARY_KEY, PROGRESS_KEY, SPEED_KEY]);
  const map = Object.fromEntries(entries);
  const library = parseJson<SavedBook[]>(map[LIBRARY_KEY]);
  const progress = parseJson<Record<string, SavedProgress>>(map[PROGRESS_KEY]);
  const speedValue = Number(parseJson<number>(map[SPEED_KEY]) ?? map[SPEED_KEY]);
  return {
    library: Array.isArray(library) ? library.filter((book) => book && typeof book.id === 'string') : [],
    progress: isProgressMap(progress) ? progress : {},
    speed: isSpeed(speedValue) ? speedValue : 1,
  };
}

export async function saveLibrary(library: SavedBook[]): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export async function saveProgress(progress: Record<string, SavedProgress>): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export async function saveSpeed(speed: Speed): Promise<void> {
  await AsyncStorage.setItem(SPEED_KEY, JSON.stringify(speed));
}

export function pruneProgress(progress: Record<string, SavedProgress>): Record<string, SavedProgress> {
  const entries = Object.values(progress)
    .filter((entry) => entry && typeof entry.bookId === 'string')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 30);
  return Object.fromEntries(entries.map((entry) => [entry.bookId, entry]));
}
