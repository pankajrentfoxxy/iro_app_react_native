import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors } from '@/src/theme/colors';
import { Radius } from '@/src/theme/spacing';

export function ProgressBar({
  progress,
  height = 6,
}: {
  /** 0–1 */
  progress: number;
  height?: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillW = useSharedValue(0);
  const p = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    fillW.value = withTiming(trackWidth * p, { duration: 800 });
  }, [trackWidth, p, fillW]);

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const fillStyle = useAnimatedStyle(() => ({
    width: fillW.value,
  }));

  return (
    <View style={[styles.track, { height }]} onLayout={onLayout}>
      <Animated.View style={[styles.fill, { height }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.navyMedium,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.full,
    backgroundColor: Colors.saffron,
  },
});
