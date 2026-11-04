import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { coverTint, fonts } from '../theme';

export function Cover({
  uri,
  title,
  size,
  radius = 12,
}: {
  uri: string | null;
  title: string;
  size?: number;
  radius?: number;
}) {
  const [failed, setFailed] = useState(false);
  const frame = size ? { width: size, height: size } : styles.fill;
  return (
    <View style={[styles.base, frame, { borderRadius: radius, backgroundColor: coverTint(title) }]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText} numberOfLines={4}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(246, 241, 232, 0.16)',
  },
  fill: {
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  fallbackText: {
    color: '#F6F1E8',
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 20,
  },
});
