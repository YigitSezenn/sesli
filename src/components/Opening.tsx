import { StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy';
import { colors, fonts } from '../theme';
import { BrandMark } from './BrandMark';

export function Opening() {
  return (
    <View style={styles.screen} accessibilityRole="header">
      <BrandMark size={148} />
      <Text style={styles.name}>{copy.appName}</Text>
      <Text style={styles.line}>{copy.openingLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  name: {
    color: colors.ink,
    fontFamily: fonts.displayItalic,
    fontSize: 56,
    lineHeight: 62,
  },
  line: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
