import { Image, StyleSheet } from 'react-native';

export function BrandMark({ size = 64 }: { size?: number }) {
  return <Image source={require('../../assets/logo.png')} style={{ width: size, height: size, borderRadius: size * 0.26 }} accessibilityIgnoresInvertColors />;
}

export function HomeBanner() {
  return (
    <Image
      source={require('../../assets/banner.png')}
      style={styles.banner}
      resizeMode="contain"
      accessibilityLabel="Sesli, kamu malı sesli kitap"
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    aspectRatio: 1400 / 520,
  },
});
