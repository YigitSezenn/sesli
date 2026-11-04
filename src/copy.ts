export const copy = {
  appName: 'Sesli',
  eyebrow: 'Kamu malı',
  tagline: 'Hesap yok. Kütüphane bu cihazda durur.',
  continueTitle: 'Kaldığın yer',
  continueEmpty: 'Henüz bir kitap açmadın. Katalogdan birini seç.',
  catalog: 'Katalog',
  loadMore: 'Daha fazla kitap',
  loadingCatalog: 'Katalog yükleniyor',
  catalogError: 'Katalog açılamadı. Bağlantını kontrol edip yeniden dene.',
  retry: 'Yeniden dene',
  searchTab: 'Ara',
  homeTab: 'Ana sayfa',
  libraryTab: 'Kütüphane',
  searchPlaceholder: 'Kitap veya yazar ara',
  searchHint: 'Başlık, yazdığın sözcükle başlar. Yazar adıyla da aranır.',
  searchEmpty: 'Bu aramayla kayıt bulunamadı.',
  searchIdle: 'Austen, Secret veya Dumas diye dene.',
  searching: 'Aranıyor',
  searchError: 'Arama şu an yapılamadı.',
  libraryEmptyTitle: 'Kütüphanen boş',
  libraryEmptyBody: 'Kaydettiğin kitaplar yalnız bu cihazda durur.',
  browse: 'Kataloğa bak',
  listen: 'Dinle',
  resume: 'Devam et',
  pause: 'Duraklat',
  play: 'Oynat',
  saved: 'Kayıtlı',
  save: 'Kaydet',
  remove: 'Çıkar',
  chapters: 'Bölümler',
  about: 'Açıklama',
  more: 'Devamını göster',
  less: 'Daha az göster',
  unplayable: 'Bu kayıtta herkese açık bir ses dosyası yok.',
  backHome: 'Kataloğa dön',
  close: 'Kapat',
  speed: 'Hız',
  volume: 'Ses',
  quieter: 'Sesi kıs',
  louder: 'Sesi aç',
  openingLine: 'Kamu malı sesli kitaplar',
  prevChapter: 'Önceki bölüm',
  nextChapter: 'Sonraki bölüm',
  back15: '15 saniye geri',
  forward15: '15 saniye ileri',
  playerEmpty: 'Çalmak için katalogdan bir kitap seç.',
  loadingBook: 'Bölümler yükleniyor',
  bookError: 'Kitap açılamadı. Yeniden dene.',
  sourceNote: 'Katalog LibriVox. Ses dosyaları Internet Archive.',
  addToLibrary: 'Kütüphaneye ekle',
  removeFromLibrary: 'Kütüphaneden çıkar',
  nothingToResume: 'Kaldığın yer bulunamadı.',
};

export function chapterLabel(current: number, total: number): string {
  return `Bölüm ${current} / ${total}`;
}

export function sectionCountLabel(count: number): string {
  return count === 1 ? '1 bölüm' : `${count} bölüm`;
}

export function textYearLabel(year: string): string {
  return `Metin ${year}`;
}
