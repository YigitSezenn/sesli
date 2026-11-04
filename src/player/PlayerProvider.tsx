import Constants from 'expo-constants';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fetchBook } from '../api';
import { markUnplayable } from '../catalog-store';
import {
  isSpeed,
  SPEEDS,
  type BookDetail,
  type SavedBook,
  type SavedProgress,
  type Speed,
  toSavedBook,
} from '../model';
import { loadStoredState, pruneProgress, saveLibrary, saveProgress, saveSpeed } from '../storage';

type Clock = {
  position: number;
  duration: number;
  playing: boolean;
  buffering: boolean;
};

type Session = {
  book: BookDetail | null;
  trackIndex: number;
  speed: Speed;
  playing: boolean;
  library: SavedBook[];
  progress: Record<string, SavedProgress>;
  hydrated: boolean;
  preparingId: string | null;
  volume: number;
  changeVolume: (delta: number) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  skipBy: (delta: number) => void;
  skipChapter: (delta: number) => void;
  setSpeed: (speed: Speed) => void;
  playBook: (book: BookDetail, trackIndex: number, positionSec: number) => void;
  resume: (entry: SavedProgress) => Promise<boolean>;
  toggleLibrary: (book: BookDetail | SavedBook) => void;
  isSaved: (id: string) => boolean;
};

const SessionContext = createContext<Session | null>(null);
const ClockContext = createContext<Clock>({ position: 0, duration: 0, playing: false, buffering: false });

const FrozenTree = memo(function FrozenTree({ children }: { children: ReactNode }) {
  return children;
});

// Expo Go does not include the native playback service from the config plugin.
// Calling it logs a red error and does not start audio.
function runningInExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [speed, setSpeedState] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [library, setLibrary] = useState<SavedBook[]>([]);
  const [progress, setProgress] = useState<Record<string, SavedProgress>>({});
  const [hydrated, setHydrated] = useState(false);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(1);

  const bookRef = useRef<BookDetail | null>(null);
  const trackRef = useRef(0);
  const speedRef = useRef<Speed>(1);
  const progressRef = useRef<Record<string, SavedProgress>>({});
  const libraryRef = useRef<SavedBook[]>([]);
  const playIntent = useRef(false);
  const expectedUrl = useRef<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirtyProgress = useRef(false);
  const dirtyLibrary = useRef(false);
  const dirtySpeed = useRef(false);
  const finishArmed = useRef(true);
  const volumeRef = useRef(1);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: !runningInExpoGo(),
      interruptionMode: 'doNotMix',
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadStoredState()
      .then((stored) => {
        if (cancelled) return;
        if (!dirtyLibrary.current) {
          libraryRef.current = stored.library;
          setLibrary(stored.library);
        }
        if (!dirtyProgress.current) {
          progressRef.current = stored.progress;
          setProgress(stored.progress);
        }
        if (!dirtySpeed.current) {
          speedRef.current = stored.speed;
          setSpeedState(stored.speed);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearPoll = useCallback(() => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }, []);

  const applyRate = useCallback(
    (rate: number) => {
      try {
        player.shouldCorrectPitch = true;
        player.setPlaybackRate(rate, 'high');
      } catch {
        // Rate can be rejected before a source is attached.
      }
    },
    [player],
  );

  const remember = useCallback(
    (position: number) => {
      const current = bookRef.current;
      const track = current?.tracks[trackRef.current];
      if (!current || !track) return;
      const entry: SavedProgress = {
        bookId: current.id,
        title: current.title,
        author: current.author,
        coverUrl: current.coverUrl ?? current.thumbUrl,
        languageLabel: current.languageLabel,
        sectionCount: current.tracks.length,
        trackIndex: trackRef.current,
        trackTitle: track.title,
        positionSec: Math.max(0, position),
        durationSec: player.duration || track.durationSec,
        speed: speedRef.current,
        updatedAt: Date.now(),
      };
      dirtyProgress.current = true;
      const next = pruneProgress({ ...progressRef.current, [current.id]: entry });
      progressRef.current = next;
      setProgress(next);
      void saveProgress(next);
    },
    [player],
  );

  const armPlayback = useCallback(
    (url: string, position: number) => {
      clearPoll();
      const started = Date.now();
      poll.current = setInterval(() => {
        if (!playIntent.current || expectedUrl.current !== url) {
          clearPoll();
          return;
        }
        if (!player.isLoaded) {
          if (Date.now() - started > 20000) clearPoll();
          return;
        }
        clearPoll();
        void (async () => {
          if (position > 0.5) {
            try {
              await player.seekTo(position);
            } catch {
              // A seek before duration is known is retried by the user scrubber.
            }
          }
          if (!playIntent.current || expectedUrl.current !== url) return;
          applyRate(speedRef.current);
          try {
            player.volume = volumeRef.current;
          } catch {
            // Volume is applied again from the player controls.
          }
          player.play();
          remember(player.currentTime || position);
          const current = bookRef.current;
          const track = current?.tracks[trackRef.current];
          if (!current || !track || runningInExpoGo()) return;
          try {
            player.setActiveForLockScreen(true, {
              title: track.title,
              artist: current.author,
              albumTitle: current.title,
              artworkUrl: current.coverUrl ?? undefined,
            });
          } catch {
            // Lock screen metadata is optional on web.
          }
        })();
      }, 150);
    },
    [applyRate, clearPoll, player, remember],
  );

  const startTrack = useCallback(
    (nextBook: BookDetail, index: number, position: number) => {
      const safeIndex = Math.min(Math.max(index, 0), nextBook.tracks.length - 1);
      const track = nextBook.tracks[safeIndex];
      if (!track) return;
      bookRef.current = nextBook;
      trackRef.current = safeIndex;
      expectedUrl.current = track.url;
      playIntent.current = true;
      setBook(nextBook);
      setTrackIndex(safeIndex);
      try {
        player.pause();
      } catch {
        // Nothing is loaded yet.
      }
      player.replace({ uri: track.url, name: track.title });
      armPlayback(track.url, position);
      remember(position);
    },
    [armPlayback, player, remember],
  );

  useEffect(() => {
    if (!status.didJustFinish) {
      finishArmed.current = true;
      return;
    }
    if (!finishArmed.current) return;
    finishArmed.current = false;
    const current = bookRef.current;
    if (!current) return;
    const next = trackRef.current + 1;
    if (next < current.tracks.length) {
      startTrack(current, next, 0);
      return;
    }
    playIntent.current = false;
    clearPoll();
    player.pause();
    remember(player.duration || 0);
  }, [clearPoll, player, remember, startTrack, status.didJustFinish]);

  useEffect(() => {
    if (!bookRef.current || !status.playing) return;
    remember(status.currentTime || 0);
  }, [remember, status.playing, Math.floor((status.currentTime || 0) / 5)]);

  useEffect(() => () => clearPoll(), [clearPoll]);

  useEffect(() => {
    setPlaying(status.playing);
  }, [status.playing]);

  const api = useRef({
    changeVolume: (_delta: number) => undefined as void,
    toggle: () => undefined as void,
    seek: (_seconds: number) => undefined as void,
    skipBy: (_delta: number) => undefined as void,
    skipChapter: (_delta: number) => undefined as void,
    setSpeed: (_speed: Speed) => undefined as void,
    playBook: (_book: BookDetail, _index: number, _position: number) => undefined as void,
    resume: async (_entry: SavedProgress) => false,
    toggleLibrary: (_book: BookDetail | SavedBook) => undefined as void,
  });

  api.current.changeVolume = (delta: number) => {
    const next = Math.min(1, Math.max(0, Math.round((volumeRef.current + delta) * 10) / 10));
    volumeRef.current = next;
    setVolumeState(next);
    try {
      player.volume = next;
    } catch {
      // The player ignores volume before a source is attached.
    }
  };

  api.current.toggle = () => {
    if (player.playing || playIntent.current) {
      playIntent.current = false;
      clearPoll();
      player.pause();
      remember(player.currentTime || 0);
      return;
    }
    if (!bookRef.current) return;
    playIntent.current = true;
    if (player.duration > 0 && player.currentTime >= player.duration - 0.3) {
      void player.seekTo(0);
    }
    applyRate(speedRef.current);
    player.play();
  };

  api.current.seek = (seconds: number) => {
    const duration = player.duration || 0;
    const next = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);
    void player.seekTo(next);
    remember(next);
  };

  api.current.skipBy = (delta: number) => {
    api.current.seek((player.currentTime || 0) + delta);
  };

  api.current.skipChapter = (delta: number) => {
    const current = bookRef.current;
    if (!current) return;
    const next = trackRef.current + delta;
    if (next < 0) {
      api.current.seek(0);
      return;
    }
    if (next >= current.tracks.length) return;
    startTrack(current, next, 0);
  };

  api.current.setSpeed = (next: Speed) => {
    dirtySpeed.current = true;
    speedRef.current = next;
    setSpeedState(next);
    applyRate(next);
    void saveSpeed(next);
    if (bookRef.current) remember(player.currentTime || 0);
  };

  api.current.playBook = (nextBook, index, position) => {
    startTrack(nextBook, index, position);
  };

  api.current.resume = async (entry) => {
    setPreparingId(entry.bookId);
    try {
      const loaded = await fetchBook(entry.bookId);
      if (!loaded) {
        markUnplayable(entry.bookId);
        return false;
      }
      if (isSpeed(entry.speed)) {
        speedRef.current = entry.speed;
        setSpeedState(entry.speed);
      }
      startTrack(loaded, entry.trackIndex, entry.positionSec);
      return true;
    } catch {
      return false;
    } finally {
      setPreparingId((current) => (current === entry.bookId ? null : current));
    }
  };

  api.current.toggleLibrary = (item) => {
    dirtyLibrary.current = true;
    const exists = libraryRef.current.some((saved) => saved.id === item.id);
    const next = exists
      ? libraryRef.current.filter((saved) => saved.id !== item.id)
      : [toSavedBook(item, Date.now()), ...libraryRef.current];
    libraryRef.current = next;
    setLibrary(next);
    void saveLibrary(next);
  };

  const stable = useMemo(
    () => ({
      changeVolume: (delta: number) => api.current.changeVolume(delta),
      toggle: () => api.current.toggle(),
      seek: (seconds: number) => api.current.seek(seconds),
      skipBy: (delta: number) => api.current.skipBy(delta),
      skipChapter: (delta: number) => api.current.skipChapter(delta),
      setSpeed: (next: Speed) => api.current.setSpeed(next),
      playBook: (nextBook: BookDetail, index: number, position: number) => api.current.playBook(nextBook, index, position),
      resume: (entry: SavedProgress) => api.current.resume(entry),
      toggleLibrary: (item: BookDetail | SavedBook) => api.current.toggleLibrary(item),
    }),
    [],
  );

  const session = useMemo<Session>(
    () => ({
      book,
      trackIndex,
      speed,
      playing,
      library,
      progress,
      hydrated,
      preparingId,
      volume,
      ...stable,
      isSaved: (id: string) => library.some((item) => item.id === id),
    }),
    [book, hydrated, library, playing, preparingId, progress, speed, stable, trackIndex, volume],
  );

  const clock = useMemo<Clock>(
    () => ({
      position: status.currentTime || 0,
      duration: status.duration || 0,
      playing: status.playing,
      buffering: status.isBuffering,
    }),
    [status.currentTime, status.duration, status.isBuffering, status.playing],
  );

  return (
    <SessionContext.Provider value={session}>
      <ClockContext.Provider value={clock}>
        <FrozenTree>{children}</FrozenTree>
      </ClockContext.Provider>
    </SessionContext.Provider>
  );
}

export function usePlayer(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('usePlayer must be used within PlayerProvider');
  return session;
}

export function usePlaybackClock(): Clock {
  return useContext(ClockContext);
}

export { SPEEDS };
