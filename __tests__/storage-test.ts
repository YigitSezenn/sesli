/// <reference types="jest" />
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedBook, SavedProgress } from '../src/model';
import { loadStoredState, pruneProgress, saveLibrary, saveProgress, saveSpeed } from '../src/storage';

function progress(id: string, updatedAt: number): SavedProgress {
  return {
    bookId: id,
    title: id,
    author: 'Yazar',
    coverUrl: null,
    languageLabel: 'İngilizce',
    sectionCount: 2,
    trackIndex: 0,
    trackTitle: 'Bölüm 1',
    positionSec: 12,
    durationSec: 60,
    speed: 1,
    updatedAt,
  };
}

const book: SavedBook = {
  id: '81',
  title: 'Dream Psychology',
  author: 'Sigmund Freud',
  coverUrl: null,
  language: 'English',
  languageLabel: 'İngilizce',
  sectionCount: 10,
  totalSec: 21842,
  addedAt: 10,
};

describe('cihaz hafızası', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('kütüphane, konum ve hız turu', async () => {
    await saveLibrary([book]);
    await saveProgress({ '81': progress('81', 20) });
    await saveSpeed(1.5);

    const stored = await loadStoredState();
    expect(stored.library).toEqual([book]);
    expect(stored.progress['81']?.positionSec).toBe(12);
    expect(stored.speed).toBe(1.5);
  });

  test('bozuk kayıtları yok sayar ve hızı 1 yapar', async () => {
    await AsyncStorage.setItem('sesli.library.v1', '{bozuk');
    await AsyncStorage.setItem('sesli.progress.v1', '[]');
    await AsyncStorage.setItem('sesli.speed.v1', '9');

    const stored = await loadStoredState();
    expect(stored.library).toEqual([]);
    expect(stored.progress).toEqual({});
    expect(stored.speed).toBe(1);
  });

  test('en yeni 30 konumu tutar', () => {
    const many = Object.fromEntries(Array.from({ length: 35 }, (_, index) => [`b${index}`, progress(`b${index}`, index)]));
    const pruned = pruneProgress(many);
    const ids = Object.keys(pruned);
    expect(ids).toHaveLength(30);
    expect(ids).not.toContain('b0');
    expect(ids).toContain('b34');
  });
});
