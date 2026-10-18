import { Anchor, Sparkles } from 'lucide-react-native';
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { t } from '@/i18n';
import type { PathLesson, PathUnit } from '@/lib/types';
import { Icon, Text, colors, palette, radii, river, spacing } from '@/theme';

import { Boat } from './Boat';
import { Currents } from './Currents';
import { RIVER, layoutMap, rand, smoothPath, type MapLayout } from './geometry';
import { LessonNode } from './LessonNode';
import { SceneryItem, Tuft, WaterItem } from './Scenery';
import { UnitBanner } from './UnitBanner';

/**
 * The scenery is drawn in horizontal slices, each one an SVG looking at its
 * part of the same map. Slices are static and cached as GPU textures, so
 * scrolling only composites bitmaps; they stay small enough for the texture
 * size limit (800 dp × 3.5 density < 4096 px).
 */
const SLICE = 800;

type Props = {
  units: PathUnit[];
  width: number;
  onLessonPress: (lesson: PathLesson, unit: PathUnit) => void;
  onOpenWords: (unit: PathUnit) => void;
  /** Called with the y of the boat (map coordinates), to scroll it into view. */
  onBoatY?: (y: number) => void;
};

/** The learning path: one long Mekong river, a lily pad per lesson, the boat at the current one. */
export function RiverMap({ units, width, onLessonPress, onOpenWords, onBoatY }: Props) {
  const layout = useMemo(() => layoutMap(units, width), [units, width]);

  useEffect(() => {
    onBoatY?.(layout.boat.y);
  }, [layout.boat.y, onBoatY]);

  const slices = Math.ceil(layout.height / SLICE);

  return (
    <View style={{ width, height: layout.height, backgroundColor: river.land }}>
      {Array.from({ length: slices }, (_, i) => (
        <MapSlice key={i} layout={layout} top={i * SLICE} />
      ))}
      <Currents layout={layout} />

      <Pier x={layout.pier.x} y={layout.pier.y} />

      {layout.banners.map((b) => (
        <UnitBanner
          key={b.unit.id}
          unit={b.unit}
          y={b.y}
          width={width}
          onOpenWords={() => onOpenWords(b.unit)}
        />
      ))}

      {layout.nodes.map((n) => (
        <LessonNode
          key={n.lesson.id}
          lesson={n.lesson}
          unitColor={n.unit.color}
          x={n.x}
          y={n.y}
          onPress={() => onLessonPress(n.lesson, n.unit)}
        />
      ))}

      <Boat x={layout.boat.x} y={layout.boat.y} facing={layout.boat.facing} />

      <View style={[styles.end, { top: layout.end.y + 40, left: width / 2 - 120 }]}>
        <Icon icon={Sparkles} size={18} color={colors.textSecondary} />
        <Text variant="bodyBold" color={colors.textSecondary}>
          {t.journey.comingSoon}
        </Text>
      </View>
    </View>
  );
}

const ROUND = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/**
 * One horizontal slice of the scenery (land, river, decorations). Nothing in
 * it is animated: once drawn it is never redrawn (moving water is <Currents>).
 */
const MapSlice = memo(function MapSlice({ layout, top }: { layout: MapLayout; top: number }) {
  const { width } = layout;
  const height = Math.min(SLICE, layout.height - top);
  const d = useMemo(() => smoothPath(layout.points), [layout.points]);
  const visible = (y: number, margin = 120) => y > top - margin && y < top + height + margin;

  // Grass tufts on both edges, where the river never goes.
  const tufts = useMemo(() => {
    const out: { x: number; y: number; s: number }[] = [];
    for (let y = top + 30; y < top + height; y += 70) {
      const r = rand(y);
      out.push({ x: 8 + r * 18, y, s: 0.8 + r * 0.6 });
      out.push({ x: width - 10 - rand(y + 1) * 18, y: y + 34, s: 0.7 + rand(y + 2) * 0.6 });
    }
    return out;
  }, [top, height, width]);

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={[styles.slice, { top, width, height }]}>
      <Svg width={width} height={height} viewBox={`0 ${top} ${width} ${height}`}>
        <Rect x={0} y={top} width={width} height={height} fill={river.land} />
        {tufts.map((tf, i) => (
          <Tuft key={i} x={tf.x} y={tf.y} scale={tf.s} />
        ))}

        {/* Banks: sand, then a darker wet edge, then the water. */}
        <Path
          d={d}
          stroke={river.sandShade}
          strokeWidth={RIVER.width + RIVER.bank * 2 + 6}
          {...ROUND}
        />
        <Path d={d} stroke={river.sand} strokeWidth={RIVER.width + RIVER.bank * 2} {...ROUND} />
        <Path d={d} stroke={river.waterDeep} strokeWidth={RIVER.width + 6} {...ROUND} />
        <Path d={d} stroke={river.water} strokeWidth={RIVER.width - 8} {...ROUND} />
        <Path
          d={d}
          stroke={river.waterLight}
          strokeWidth={RIVER.width * 0.42}
          opacity={0.45}
          {...ROUND}
        />

        {/* Faint static currents; the moving foam is drawn on top by <Currents>. */}
        <Path
          d={d}
          stroke={river.foam}
          strokeWidth={3}
          strokeDasharray={[26, 70]}
          opacity={0.45}
          {...ROUND}
        />
        <G transform="translate(-34 0)">
          <Path
            d={d}
            stroke={river.foam}
            strokeWidth={2.5}
            strokeDasharray={[14, 82]}
            strokeDashoffset={-40}
            opacity={0.3}
            {...ROUND}
          />
        </G>
        <G transform="translate(34 0)">
          <Path
            d={d}
            stroke={river.foam}
            strokeWidth={2.5}
            strokeDasharray={[18, 78]}
            strokeDashoffset={-40}
            opacity={0.3}
            {...ROUND}
          />
        </G>

        {layout.water
          .filter((w) => visible(w.y))
          .map((w, i) => (
            <WaterItem key={i} item={w} />
          ))}
        {layout.decor
          .filter((s) => visible(s.y))
          .map((s, i) => (
            <SceneryItem key={i} item={s} />
          ))}
      </Svg>
    </View>
  );
});

/** Wooden pier with its sign (Cần Thơ's famous Ninh Kiều wharf): where the journey starts. */
function Pier({ x, y }: { x: number; y: number }) {
  return (
    <View pointerEvents="none" style={[styles.pier, { left: x - 120, top: y - 34 }]}>
      <View style={styles.sign}>
        <Icon icon={Anchor} size={16} color={palette.white} />
        <Text variant="caption" color={palette.white} style={styles.signText}>
          {t.journey.departure}
        </Text>
      </View>
      <View style={styles.posts}>
        <View style={styles.post} />
        <View style={styles.post} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slice: { position: 'absolute', left: 0 },
  pier: { position: 'absolute', width: 240, alignItems: 'center', zIndex: 2 },
  sign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    backgroundColor: river.wood,
    borderBottomWidth: 4,
    borderBottomColor: river.woodShade,
  },
  signText: { letterSpacing: 0.8, textTransform: 'uppercase' },
  posts: { flexDirection: 'row', gap: 70 },
  post: { width: 6, height: 18, backgroundColor: river.woodShade, borderRadius: 2 },
  end: {
    position: 'absolute',
    width: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: river.paddyShade,
  },
});
