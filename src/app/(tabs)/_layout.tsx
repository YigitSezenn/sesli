import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '../../copy';
import { colors, fonts, metrics } from '../../theme';

function iconColor(color: unknown): string {
  return typeof color === 'string' ? color : colors.faint;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      safeAreaInsets={{ top: 0, right: 0, bottom: 0, left: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          height: metrics.tabBar + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          backgroundColor: colors.bgElevated,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.homeTab,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: copy.searchTab,
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: copy.libraryTab,
          tabBarIcon: ({ color, size }) => <Ionicons name="library" color={iconColor(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
