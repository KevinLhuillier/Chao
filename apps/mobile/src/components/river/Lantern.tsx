import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Line, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';

const W = 30;
const H = 64;

/** Hội An silk lantern (đèn lồng) hanging from its string, swaying in the breeze. */
export function Lantern({
  color = palette.lantern,
  shade = palette.lanternShade,
  delay = 0,
  style,
}: {
  color?: string;
  shade?: string;
  delay?: number;
  style?: ViewStyle;
}) {
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true),
      ),
    );
  }, [sway, delay]);
  // Rotates around the top of the string.
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: -H / 2 },
      { rotate: `${-6 + sway.value * 12}deg` },
      { translateY: H / 2 },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, animated, style]}>
      <Svg width={W} height={H} viewBox="0 0 30 64">
        <Line x1={15} y1={0} x2={15} y2={14} stroke="#5B4636" strokeWidth={1.5} />
        <Rect
          x={9}
          y={13}
          width={12}
          height={5}
          rx={1.5}
          fill={palette.gold}
          stroke={palette.goldShade}
          strokeWidth={1}
        />
        <Ellipse cx={15} cy={31} rx={13} ry={14} fill={color} stroke={shade} strokeWidth={1.4} />
        <Path
          d="M15 17 C7 22 7 40 15 45 M15 17 C23 22 23 40 15 45"
          stroke={shade}
          strokeWidth={1.2}
          fill="none"
        />
        <Ellipse cx={10} cy={27} rx={3} ry={5} fill="rgba(255,255,255,0.35)" />
        <Rect
          x={9}
          y={44}
          width={12}
          height={5}
          rx={1.5}
          fill={palette.gold}
          stroke={palette.goldShade}
          strokeWidth={1}
        />
        <Path
          d="M12 49 L11 62 M15 49 L15 63 M18 49 L19 62"
          stroke={palette.gold}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: W, height: H },
});
