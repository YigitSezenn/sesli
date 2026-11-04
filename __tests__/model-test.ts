/// <reference types="jest" />
import {
  bookFraction,
  cleanQuery,
  formatAuthors,
  formatClock,
  formatLength,
  formatRate,
  isArchiveZip,
  isSpeed,
  languageLabel,
  mapDetail,
  mapSummary,
  stripHtml,
  toPlayableArchiveUrl,
  toSavedBook,
} from '../src/model';

const archiveZip =
  'https://archive.org/compress/dream_psychology_librivox/formats=64KBPS MP3&file=/dream_psychology_librivox.zip';

describe('katalog modeli', () => {
  test('HTML açıklamayı düz metne çevirir', () => {
    expect(stripHtml('<i>Merhaba</i><br>dünya &amp; &#39;okur&#39;')).toBe("Merhaba\ndünya & 'okur'");
    expect(stripHtml('Tom&#8217;s')).toBe('Tom’s');
  });

  test('yazar adını ve Various takma adını Türkçe yazar', () => {
    expect(formatAuthors([{ first_name: 'Jane', last_name: 'Austen' }])).toBe('Jane Austen');
    expect(formatAuthors([{ first_name: '', last_name: 'Various' }])).toBe('Çeşitli');
    expect(formatAuthors(undefined)).toBe('Bilinmeyen yazar');
  });

  test('süre ve hız etiketleri', () => {
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(3661)).toBe('1:01:01');
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatLength(49 * 3600 + 43 * 60 + 15)).toBe('49 sa 43 dk');
    expect(formatLength(0)).toBe('Süre yok');
    expect(formatRate(1)).toBe('1×');
    expect(formatRate(1.25)).toBe('1,25×');
    expect(languageLabel('Turkish')).toBe('Türkçe');
    expect(languageLabel('English')).toBe('İngilizce');
  });

  test('yalnızca archive.org ses dosyasını çalınabilir sayar', () => {
    const mp3 =
      'http://www.archive.org/download/count_monte_cristo_0711_librivox/count_of_monte_cristo_001_dumas_64kb.mp3';
    expect(toPlayableArchiveUrl(mp3)).toBe(
      'https://www.archive.org/download/count_monte_cristo_0711_librivox/count_of_monte_cristo_001_dumas_64kb.mp3',
    );
    expect(toPlayableArchiveUrl('https://example.com/file.mp3')).toBeNull();
    expect(toPlayableArchiveUrl('https://archive.org/download/book/cover.jpg')).toBeNull();
    expect(toPlayableArchiveUrl('not a url')).toBeNull();
    expect(isArchiveZip(archiveZip)).toBe(true);
    expect(isArchiveZip('https://cdn.example/book.zip')).toBe(false);
    expect(isArchiveZip('')).toBe(false);
  });

  test('bölümsüz veya yabancı dosyalı kaydı katalogdan çıkarır', () => {
    expect(
      mapSummary({
        id: '1',
        title: 'Taslak',
        num_sections: '0',
        url_zip_file: archiveZip,
      }),
    ).toBeNull();
    expect(
      mapSummary({
        id: '2',
        title: 'Dışarı',
        num_sections: '3',
        url_zip_file: 'https://cdn.example/book.zip',
      }),
    ).toBeNull();
    expect(mapSummary({ id: '', title: 'Adsız', num_sections: '2', url_zip_file: archiveZip })).toBeNull();
  });

  test('oynatılabilir bölümleri sıralar, kapak ve yabancı dosyayı atar', () => {
    const summary = mapSummary({
      id: '81',
      title: 'Dream Psychology',
      language: 'English',
      copyright_year: '1899',
      num_sections: '10',
      totaltimesecs: '21842',
      url_zip_file: archiveZip,
      coverart_thumbnail: 'https://www.archive.org/download/LibrivoxCdCoverArt6/dream_psychology_1101_thumb.jpg',
      coverart_jpg: 'https://evil.example/cover.jpg',
      authors: [{ first_name: 'Sigmund', last_name: 'Freud' }],
    });
    expect(summary).toMatchObject({
      id: '81',
      author: 'Sigmund Freud',
      languageLabel: 'İngilizce',
      year: '1899',
      sectionCount: 10,
      coverUrl: null,
    });
    expect(summary?.thumbUrl).toMatch(/^https:\/\/www\.archive\.org\//);

    const detail = mapDetail(
      {
        id: '81',
        title: 'Dream Psychology',
        description: '<p>Bir özet.</p>',
        language: 'English',
        num_sections: '2',
        url_zip_file: archiveZip,
        authors: [{ first_name: 'Sigmund', last_name: 'Freud' }],
      },
      [
        { id: 'b', section_number: '2', title: 'İkinci', listen_url: 'https://archive.org/download/dream/02.mp3', playtime: '90' },
        { id: 'a', section_number: '1', title: 'Birinci', listen_url: 'https://archive.org/download/dream/01.mp3', playtime: '60' },
        { id: 'c', section_number: '3', title: 'Kapak', listen_url: 'https://archive.org/download/dream/cover.jpg', playtime: '1' },
        { id: 'd', section_number: '4', title: 'Yabancı', listen_url: 'https://evil.example/secret.mp3', playtime: '10' },
      ],
    );
    expect(detail?.tracks.map((track) => track.title)).toEqual(['Birinci', 'İkinci']);
    expect(detail?.description).toBe('Bir özet.');
    expect(detail?.tracks.every((track) => track.url.startsWith('https://archive.org/'))).toBe(true);
    expect(mapDetail({ id: '9', title: 'Boş', url_zip_file: archiveZip }, [])).toBeNull();
  });

  test('kitap ilerlemesi ve kayıtlı kitap', () => {
    expect(bookFraction({ trackIndex: 1, positionSec: 30, durationSec: 60, sectionCount: 4 })).toBe(0.375);
    expect(bookFraction({ trackIndex: 0, positionSec: 0, durationSec: 0, sectionCount: 0 })).toBe(0);
    expect(isSpeed(1.5)).toBe(true);
    expect(isSpeed(3)).toBe(false);
    expect(cleanQuery('  ^Pride\n  ')).toBe('Pride');
    expect(cleanQuery('a'.repeat(100))).toHaveLength(80);
    const saved = toSavedBook(
      {
        id: '81',
        title: 'Dream Psychology',
        author: 'Sigmund Freud',
        coverUrl: null,
        thumbUrl: 'https://archive.org/download/x/thumb.jpg',
        languageLabel: 'İngilizce',
        sectionCount: 10,
        totalSec: 100,
      },
      5,
    );
    expect(saved.coverUrl).toBe('https://archive.org/download/x/thumb.jpg');
    expect(saved.addedAt).toBe(5);
  });
});
