/// <reference types="jest" />
import { fetchBook, fetchCatalogPage, searchCatalog } from '../src/api';

const audioFile = /^https:\/\/.+\.(mp3|m4a|m4b|ogg|oga|opus|aac|wav|flac)$/i;

describe('LibriVox canlı katalog', () => {
  test('ilk sayfa herkese açık kayıtlar döner', async () => {
    const page = await fetchCatalogPage(0);
    expect(page.rawCount).toBeGreaterThan(0);
    expect(page.rawCount).toBeLessThanOrEqual(24);
    expect(page.books.length).toBeGreaterThan(0);
    for (const book of page.books) {
      expect(book.id).toMatch(/^\d+$/);
      expect(book.title.length).toBeGreaterThan(0);
      expect(book.sectionCount).toBeGreaterThan(0);
      expect(book.author.length).toBeGreaterThan(0);
      if (book.coverUrl) expect(book.coverUrl.startsWith('https://')).toBe(true);
    }
    expect(page.books.some((book) => book.title === 'Count of Monte Cristo')).toBe(true);
  });

  test('kısa arama istek atmaz, yazar araması gerçek kitap bulur', async () => {
    await expect(searchCatalog('a')).resolves.toEqual([]);
    const found = await searchCatalog('Austen');
    expect(found.length).toBeGreaterThan(0);
    expect(found.some((book) => book.author.includes('Austen'))).toBe(true);
    expect(found.every((book) => book.sectionCount > 0)).toBe(true);
  });

  test('kitap bölümleri archive.org ses dosyasıdır', async () => {
    const book = await fetchBook('81');
    expect(book).not.toBeNull();
    expect(book?.title).toBe('Dream Psychology');
    expect(book?.author).toContain('Freud');
    expect(book?.tracks.length).toBeGreaterThan(1);
    expect(book?.description.length).toBeGreaterThan(20);
    for (const track of book?.tracks ?? []) {
      expect(track.url).toMatch(audioFile);
      expect(track.url).toContain('archive.org');
      expect(track.durationSec).toBeGreaterThan(0);
    }
    const again = await fetchBook('81');
    expect(again).toBe(book);
  });
});
