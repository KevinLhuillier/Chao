import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { palette, river } from '@/theme';

export const BOAT_SIZE = { width: 112, height: 78 };

/**
 * Mekong sampan (ghe): wooden hull with painted eyes on the bow (mắt ghe),
 * round bamboo canopy, a rower in a conical hat, fruit from the floating
 * market and a little red lantern. Faces right; flipped by the map.
 */
export function BoatArt() {
  return (
    <Svg width={BOAT_SIZE.width} height={BOAT_SIZE.height} viewBox="0 0 112 78">
      {/* Wake */}
      <Path
        d="M8 64 q8 -5 16 0 q8 5 16 0"
        stroke={river.foam}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Path
        d="M70 66 q8 -5 16 0 q8 5 16 0"
        stroke={river.foam}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <Ellipse cx={56} cy={60} rx={46} ry={6} fill={river.waterDeep} opacity={0.45} />

      {/* Oar, behind the hull */}
      <Line
        x1={26}
        y1={22}
        x2={8}
        y2={62}
        stroke={river.trunkShade}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Ellipse cx={7} cy={63} rx={3.5} ry={6} fill={river.wood} transform="rotate(24 7 63)" />

      {/* Rower */}
      <Rect x={17} y={26} width={14} height={20} rx={5} fill={palette.jade} />
      <Path d="M24 32 L31 26" stroke={palette.jadeShade} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={24} cy={22} r={6} fill="#F3C9A0" />
      <Path
        d="M10 21 L24 6 L38 21 Q24 26 10 21 Z"
        fill={river.straw}
        stroke={river.strawShade}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path d="M17 18 L24 6 M31 18 L24 6" stroke={river.strawShade} strokeWidth={1} />

      {/* Canopy (mui ghe) */}
      <Path
        d="M36 46 C36 22 74 22 74 46 Z"
        fill={river.straw}
        stroke={river.strawShade}
        strokeWidth={1.4}
      />
      <Path d="M42 46 C42 30 68 30 68 46" stroke={river.strawShade} strokeWidth={1.2} fill="none" />
      <Path d="M48 46 C48 36 62 36 62 46" stroke={river.strawShade} strokeWidth={1.2} fill="none" />
      <Path d="M55 25 L55 46" stroke={river.strawShade} strokeWidth={1.2} />
      <Line x1={74} y1={30} x2={74} y2={34} stroke={river.woodShade} strokeWidth={1.2} />
      <Ellipse cx={74} cy={38} rx={3.6} ry={4.6} fill={palette.lantern} />
      <Rect x={72.4} y={42} width={3.2} height={3} fill={palette.gold} />

      {/* Fruit from the floating market */}
      <Circle cx={84} cy={44} r={4.5} fill={palette.flame} />
      <Circle cx={91} cy={45} r={4} fill={palette.bamboo} />
      <Circle cx={87} cy={40} r={3.6} fill={palette.gold} />

      {/* Hull */}
      <Path
        d="M2 40 C18 50 94 50 110 38 C104 56 90 62 56 62 C22 62 8 56 2 40 Z"
        fill={river.wood}
        stroke={river.woodShade}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M6 46 C24 55 90 55 106 45" stroke={palette.lantern} strokeWidth={3} fill="none" />
      <Path
        d="M12 53 C30 59 84 59 100 52"
        stroke={river.woodShade}
        strokeWidth={1.4}
        fill="none"
        opacity={0.6}
      />
      {/* Painted eye on the bow */}
      <G transform="translate(94 46)">
        <Ellipse cx={0} cy={0} rx={6} ry={3.8} fill="#FFFFFF" stroke="#2D2926" strokeWidth={1} />
        <Circle cx={1.2} cy={0} r={2.1} fill="#2D2926" />
        <Path
          d="M-6 -4 q6 -4 12 0"
          stroke={palette.lantern}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

/** The boat, gently bobbing on the water. */
export function Boat({ x, y, facing }: { x: number; y: number; facing: 'left' | 'right' }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(
      withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -3 + t.value * 6 },
      { rotate: `${-2 + t.value * 4}deg` },
      { scaleX: facing === 'left' ? -1 : 1 },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { left: x - BOAT_SIZE.width / 2, top: y - BOAT_SIZE.height / 2 - 6 }]}>
      <Animated.View style={style}>
        <BoatArt />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: BOAT_SIZE.width, height: BOAT_SIZE.height, zIndex: 5 },
});
