import { Lock } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { t } from '@/i18n';
import type { PathLesson } from '@/lib/types';
import { Icon, Text, colors, haptics, palette, river, unitTint, usePressDepth } from '@/theme';

import { RIVER } from './geometry';

const DEPTH = 6;

type Props = {
  lesson: PathLesson;
  unitColor: string;
  x: number;
  y: number;
  onPress: () => void;
};

/**
 * A stop on the river: a lily pad. Locked pads are faded, the current one
 * carries a lotus bud and pulses, completed ones have a lotus in full bloom.
 */
export function LessonNode({ lesson, unitColor, x, y, onPress }: Props) {
  const current = lesson.state === 'current';
  const size = current ? RIVER.currentPad : RIVER.pad;
  const { faceStyle, pressIn, pressOut } = usePressDepth(DEPTH);
  const tint = unitTint(unitColor);

  const face = lesson.state === 'locked' ? river.padLocked : current ? river.leafLight : river.leaf;
  const edge = lesson.state === 'locked' ? river.padLockedShade : river.leafShade;

  return (
    <View style={[styles.wrap, { left: x - size / 2, top: y - size / 2, width: size }]}>
      {current ? <Pulse size={size} color={tint.solid} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.journey.lessonOf(lesson.indexInUnit + 1, lesson.unitSize)}`}
        accessibilityState={{ disabled: lesson.state === 'locked' }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        hitSlop={6}
        style={{ width: size, height: size + DEPTH }}>
        <View style={[styles.edge, { width: size, height: size, top: DEPTH }]}>
          <Pad size={size} fill={edge} veins={false} />
        </View>
        <Animated.View style={faceStyle}>
          <Pad size={size} fill={face} veins />
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            {lesson.state === 'done' ? (
              <Bloom size={size * 0.62} />
            ) : current ? (
              <Bud size={size * 0.56} />
            ) : (
              <Icon icon={Lock} size={24} color={colors.textOnColor} />
            )}
          </View>
        </Animated.View>
      </Pressable>
      {lesson.state === 'done' && lesson.completedCount > 1 ? (
        <View style={styles.count}>
          <Text variant="caption" color={palette.lotusShade}>
            ×{lesson.completedCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Lily pad seen from above, with its notch and veins. */
function Pad({ size, fill, veins }: { size: number; fill: string; veins: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="-50 -50 100 100">
      <Path d="M0 0 L22 -40 A46 46 0 1 1 -2 -46 Z" fill={fill} />
      {veins ? (
        <G stroke="rgba(255,255,255,0.28)" strokeWidth={3} strokeLinecap="round">
          {[150, 200, 250, 300, 350, 40, 90].map((a) => {
            const r = (a * Math.PI) / 180;
            return <Path key={a} d={`M0 0 L${Math.cos(r) * 36} ${Math.sin(r) * 36}`} />;
          })}
        </G>
      ) : null}
      {veins ? <Ellipse cx={-14} cy={18} rx={16} ry={9} fill="rgba(255,255,255,0.12)" /> : null}
    </Svg>
  );
}

/** Lotus in bloom: the stop is done. */
function Bloom({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="-30 -34 60 60">
      <Ellipse cx={0} cy={14} rx={20} ry={5} fill="rgba(0,0,0,0.12)" />
      <Path d="M0 12 C-22 10 -28 -2 -25 -8 C-15 -6 -6 0 0 12 Z" fill={palette.lotus} />
      <Path d="M0 12 C22 10 28 -2 25 -8 C15 -6 6 0 0 12 Z" fill={palette.lotus} />
      <Path
        d="M0 12 C-15 4 -16 -12 -9 -22 C-3 -12 1 0 0 12 Z"
        fill="#FFB3CB"
        stroke={palette.lotusShade}
        strokeWidth={1}
      />
      <Path
        d="M0 12 C15 4 16 -12 9 -22 C3 -12 -1 0 0 12 Z"
        fill="#FFB3CB"
        stroke={palette.lotusShade}
        strokeWidth={1}
      />
      <Path
        d="M0 12 C-8 0 -7 -18 0 -28 C7 -18 8 0 0 12 Z"
        fill={palette.lotusSoft}
        stroke={palette.lotusShade}
        strokeWidth={1}
      />
      <Circle cx={0} cy={2} r={3} fill={palette.gold} />
    </Svg>
  );
}

/** Closed lotus bud: the stop to reach. */
function Bud({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="-30 -34 60 60">
      <Ellipse cx={0} cy={16} rx={14} ry={4} fill="rgba(0,0,0,0.12)" />
      <Path
        d="M0 16 C-16 8 -14 -14 0 -30 C14 -14 16 8 0 16 Z"
        fill={palette.lotus}
        stroke={palette.lotusShade}
        strokeWidth={1.4}
      />
      <Path
        d="M0 16 C-7 6 -6 -14 0 -26"
        stroke={palette.lotusShade}
        strokeWidth={1.2}
        fill="none"
      />
      <Path
        d="M-6 -12 C-8 -4 -6 4 -3 8"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M0 16 C-12 16 -18 10 -20 4 C-12 6 -6 10 0 16 Z" fill={river.leafShade} />
      <Path d="M0 16 C12 16 18 10 20 4 C12 6 6 10 0 16 Z" fill={river.leafShade} />
    </Svg>
  );
}

/** Soft ring expanding around the current stop. */
function Pulse({ size, color }: { size: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ scale: 1 + p.value * 0.45 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', zIndex: 4 },
  edge: { position: 'absolute', left: 0 },
  center: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', top: 0, left: 0, borderWidth: 4 },
  count: {
    position: 'absolute',
    right: -6,
    top: -4,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: palette.lotusSoft,
  },
});
