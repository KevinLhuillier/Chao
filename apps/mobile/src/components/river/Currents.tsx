import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { river } from '@/theme';

import { RIVER, pointOnSegment, rand, type MapLayout } from './geometry';

type Streak = { x: number; y: number; angle: number; length: number };

/** How far a streak drifts downstream during one loop. */
const DRIFT = 16;

/**
 * Flowing water, cheaply: foam streaks are plain views on two layers. Each
 * layer only drifts downstream and fades in/out (transform + opacity, run on
 * the UI thread); the two are half a loop apart so the flow never stops.
 * The SVG scenery underneath never redraws.
 */
export function Currents({ layout }: { layout: MapLayout }) {
  const [a, b] = useMemo(() => streaks(layout), [layout]);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false));
  }, [progress]);

  return (
    <>
      <Layer streaks={a} progress={progress} phase={0} />
      <Layer streaks={b} progress={progress} phase={0.5} />
    </>
  );
}

function Layer({
  streaks,
  progress,
  phase,
}: {
  streaks: Streak[];
  progress: SharedValue<number>;
  phase: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = (progress.value + phase) % 1;
    return {
      opacity: Math.sin(p * Math.PI) * 0.75,
      transform: [{ translateY: p * DRIFT }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {streaks.map((s, i) => (
        <View
          key={i}
          style={[
            styles.streak,
            {
              left: s.x - 2,
              top: s.y - s.length / 2,
              height: s.length,
              transform: [{ rotate: `${s.angle}deg` }],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

/** Streaks along the river, away from pads, banners and the boat. */
function streaks(layout: MapLayout): [Streak[], Streak[]] {
  const busy = [...layout.nodes, ...layout.banners, layout.boat];
  const layers: [Streak[], Streak[]] = [[], []];
  for (let i = 0; i < layout.points.length - 1; i++) {
    [0.2, 0.45, 0.7, 0.95].forEach((t, k) => {
      const p = pointOnSegment(layout.points, i, t);
      if (p.y < 0 || p.y > layout.height) return;
      if (busy.some((o) => Math.abs(o.y - p.y) < 56)) return;
      const q = pointOnSegment(layout.points, i, Math.min(1, t + 0.02));
      // Direction of the flow; the streak lies along it, shifted across the river.
      const angle = (Math.atan2(q.x - p.x, q.y - p.y) * -180) / Math.PI;
      const across = (rand(i * 5 + k) - 0.5) * (RIVER.width - 50);
      const nx = Math.cos((angle * Math.PI) / 180);
      layers[k % 2]!.push({
        x: p.x + across * nx,
        y: p.y,
        angle,
        length: 14 + rand(i * 3 + k) * 16,
      });
    });
  }
  return layers;
}

const styles = StyleSheet.create({
  streak: {
    position: 'absolute',
    width: 4,
    borderRadius: 2,
    backgroundColor: river.foam,
  },
});
