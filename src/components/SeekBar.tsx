import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export function SeekBar({
  position,
  duration,
  onSeek,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}) {
  const [width, setWidth] = useState(1);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const ratio = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const shown = dragRatio ?? ratio;

  const ratioFor = (locationX: number) => Math.min(1, Math.max(0, locationX / Math.max(width, 1)));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessibilityRole="adjustable"
      onLayout={onLayout}
      style={styles.hit}
      onStartShouldSetResponder={() => duration > 0}
      onMoveShouldSetResponder={() => duration > 0}
      onResponderGrant={(event) => setDragRatio(ratioFor(event.nativeEvent.locationX))}
      onResponderMove={(event) => setDragRatio(ratioFor(event.nativeEvent.locationX))}
      onResponderRelease={(event) => {
        const next = ratioFor(event.nativeEvent.locationX);
        setDragRatio(null);
        onSeek(next * duration);
      }}
      onResponderTerminate={() => setDragRatio(null)}
    >
      <View style={styles.rail}>
        <View style={[styles.fill, { width: `${shown * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.knob, { left: shown * width - 7 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    height: 36,
    justifyContent: 'center',
  },
  rail: {
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  knob: {
    position: 'absolute',
    top: 11,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.ink,
  },
});
