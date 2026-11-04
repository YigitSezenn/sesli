import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Literata_500Medium_Italic, Literata_600SemiBold } from '@expo-google-fonts/literata';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { MiniPlayer } from '../components/MiniPlayer';
import { Opening } from '../components/Opening';
import { PlayerProvider } from '../player/PlayerProvider';
import { colors } from '../theme';

export default function RootLayout() {
  const [intro, setIntro] = useState(true);
  const [loaded] = useFonts({
    Literata_600SemiBold,
    Literata_500Medium_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.style.backgroundColor = colors.bg;
    document.body.style.margin = '0';
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => setIntro(false), 1600);
    return () => clearTimeout(timer);
  }, [loaded]);

  if (!loaded) return <View style={styles.boot} />;

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <View style={styles.root}>
          <View style={styles.column}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="book/[id]" />
              <Stack.Screen name="player" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            </Stack>
            <MiniPlayer />
            {intro ? <Opening /> : null}
          </View>
        </View>
        <StatusBar style="light" />
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.bg,
  },
});
