import { localize } from '@chao/shared';
import { BookOpen } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { LANG, t } from '@/i18n';
import type { PathUnit } from '@/lib/types';
import { unitIcon } from '@/lib/unitIcons';
import { Icon, Text, colors, depth, haptics, palette, radii, spacing, unitTint } from '@/theme';

import { RIVER } from './geometry';
import { Lantern } from './Lantern';

/**
 * Unit header floating over the river: a lacquered sign in the unit color with
 * two silk lanterns hanging from it. Tapping the book opens its vocabulary.
 */
export function UnitBanner({
  unit,
  y,
  width,
  onOpenWords,
}: {
  unit: PathUnit;
  y: number;
  width: number;
  onOpenWords: () => void;
}) {
  const tint = unitTint(unit.color);
  const done = unit.lessons.filter((l) => l.state === 'done').length;
  const description = localize(unit.description, LANG);

  return (
    <View
      style={[
        styles.wrap,
        { top: y - RIVER.banner / 2, left: spacing.lg, width: width - spacing.lg * 2 },
      ]}>
      <View style={[styles.edge, { backgroundColor: tint.shade }]} />
      <View style={[styles.face, { backgroundColor: tint.solid }]}>
        <View style={styles.bubble}>
          <Icon icon={unitIcon(unit.icon)} size={26} color={tint.solid} />
        </View>
        <View style={styles.texts}>
          <Text variant="caption" color="rgba(255,255,255,0.85)" style={styles.overline}>
            {t.journey.unit(unit.number)} · {done}/{unit.lessons.length}
          </Text>
          <Text variant="heading" color={colors.textOnColor} numberOfLines={1}>
            {localize(unit.title, LANG)}
          </Text>
          {description ? (
            <Text variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={1}>
              {description}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => {
            haptics.tap();
            onOpenWords();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.words}
          style={({ pressed }) => [
            styles.wordsBtn,
            { borderColor: 'rgba(255,255,255,0.55)' },
            pressed && styles.pressed,
          ]}>
          <Icon icon={BookOpen} size={22} color={colors.textOnColor} />
        </Pressable>
      </View>
      <Lantern style={styles.lanternLeft} />
      <Lantern
        style={styles.lanternRight}
        color={palette.gold}
        shade={palette.goldShade}
        delay={600}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', height: 92, zIndex: 3 },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: depth.card + 1,
    bottom: -depth.card - 1,
    borderRadius: radii.lg,
  },
  face: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 1 },
  overline: { textTransform: 'uppercase', letterSpacing: 1.2 },
  wordsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  lanternLeft: { position: 'absolute', left: 18, top: 88 },
  lanternRight: { position: 'absolute', right: 70, top: 88 },
});
