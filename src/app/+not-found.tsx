import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy';
import { colors, fonts } from '../theme';

export default function NotFound() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{copy.appName}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.button}>
        <Text style={styles.buttonText}>{copy.backHome}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.displayItalic,
    fontSize: 40,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.onAccent,
    fontFamily: fonts.strong,
  },
});
