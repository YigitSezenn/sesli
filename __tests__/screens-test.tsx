/// <reference types="jest" />
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import BookScreen from '../src/app/book/[id]';
import HomeScreen from '../src/app/(tabs)/index';
import LibraryScreen from '../src/app/(tabs)/library';
import SearchScreen from '../src/app/(tabs)/search';
import { PlayerProvider } from '../src/player/PlayerProvider';

const routeParams: Record<string, string> = { id: '81' };

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  },
  usePathname: () => '/',
  useLocalSearchParams: () => routeParams,
}));

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(async () => undefined),
  useAudioPlayer: () => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(async () => undefined),
    setPlaybackRate: jest.fn(),
    setActiveForLockScreen: jest.fn(),
    shouldCorrectPitch: true,
    isLoaded: false,
    playing: false,
    paused: true,
    currentTime: 0,
    duration: 0,
  }),
  useAudioPlayerStatus: () => ({
    id: 'test',
    currentTime: 0,
    playbackState: 'paused',
    timeControlStatus: 'paused',
    reasonForWaitingToPlay: '',
    mute: false,
    duration: 0,
    playing: false,
    loop: false,
    didJustFinish: false,
    isBuffering: false,
    isLoaded: false,
    playbackRate: 1,
    shouldCorrectPitch: true,
  }),
}));

const initialMetrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderApp(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <PlayerProvider>{ui}</PlayerProvider>
    </SafeAreaProvider>,
  );
}

describe('ekranlar', () => {
  test('boş kütüphane cihazdaki kaydı anlatır', async () => {
    await renderApp(<LibraryScreen />);
    expect(await screen.findByText('Kütüphanen boş')).toBeTruthy();
    expect(screen.getByText('Kaydettiğin kitaplar yalnız bu cihazda durur.')).toBeTruthy();
  });

  test('ana sayfa gerçek katalogdan kitap gösterir', async () => {
    await renderApp(<HomeScreen />);
    expect(screen.getByLabelText('Sesli, kamu malı sesli kitap')).toBeTruthy();
    expect(screen.getByText('Kaldığın yer')).toBeTruthy();
    expect(await screen.findByText('Count of Monte Cristo', {}, { timeout: 20000 })).toBeTruthy();
    expect(screen.getByText('Katalog')).toBeTruthy();
  });

  test('kitap sayfası bölümleri yükler ve Dinle oynatıcıya gider', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    await renderApp(<BookScreen />);
    expect(await screen.findByText('Dream Psychology', {}, { timeout: 20000 })).toBeTruthy();
    expect(screen.getByText('Bölümler')).toBeTruthy();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(2);
    fireEvent.press(screen.getByLabelText('Dinle'));
    expect(router.push).toHaveBeenCalledWith('/player');
  });

  test('arama Austen kitaplarını listeler', async () => {
    await renderApp(<SearchScreen />);
    fireEvent.changeText(screen.getByLabelText('Kitap veya yazar ara'), 'Austen');
    expect(await screen.findByText('Emma', {}, { timeout: 20000 })).toBeTruthy();
  });
});
