import { localize, stripTones, type WordRow } from '@chao/shared';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Dumbbell, Lock, Search, Volume2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WordSheet } from '@/components/WordSheet';
import { LANG, t } from '@/i18n';
import { fetchLearnedVocabulary, type Theme } from '@/lib/api/vocabulary';
import { unitIcon } from '@/lib/unitIcons';
import {
  Badge,
  Button,
  Card,
  Icon,
  IconBubble,
  Text,
  TextField,
  colors,
  enter,
  haptics,
  radii,
  spacing,
  unitTint,
} from '@/theme';

/** Removes tone marks so "xin chao" matches "xin chào". */
const normalize = (s: string) => stripTones(s).toLowerCase();

const MIN_PRACTICE = 4;

/** Words & phrases learned on the river, grouped by theme. */
export default function Words() {
  const params = useLocalSearchParams<{ unit?: string }>();
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<{ word: WordRow; theme: Theme } | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchLearnedVocabulary()
        .then((th) => {
          setThemes(th);
          setError(null);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
      // Opened from a unit banner: show that theme.
      if (params.unit) setFilter(params.unit);
    }, [params.unit]),
  );

  const total = themes?.reduce((n, th) => n + th.words.length, 0) ?? 0;
  const q = normalize(query.trim());
  const shown = (themes ?? [])
    .filter((th) => !filter || th.unit.id === filter)
    .map((th) => ({
      ...th,
      words: q
        ? th.words.filter(
            (w) => normalize(w.vi).includes(q) || normalize(localize(w.meaning, LANG)).includes(q),
          )
        : th.words,
    }))
    .filter((th) => !q || th.words.length);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="title">{t.words.title}</Text>
          <Text color={colors.textSecondary}>{t.words.subtitle}</Text>
        </View>

        {error ? (
          <Card>
            <Text color={colors.danger}>{t.common.loadError(error)}</Text>
          </Card>
        ) : !themes ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : !total ? (
          <Animated.View entering={enter.up()} style={styles.empty}>
            <IconBubble icon={Lock} />
            <Text align="center" color={colors.textSecondary}>
              {t.words.empty}
            </Text>
          </Animated.View>
        ) : (
          <>
            {total >= MIN_PRACTICE ? (
              <Card tint={{ face: colors.primarySoft, edge: colors.primary }}>
                <View style={styles.row}>
                  <Icon icon={Dumbbell} size={24} color={colors.primaryShade} />
                  <Text variant="bodyBold" style={styles.flex}>
                    {t.words.practiceHint(total)}
                  </Text>
                  <Button label={t.words.practice} onPress={() => router.push('/practice')} />
                </View>
              </Card>
            ) : null}

            <TextField
              icon={Search}
              placeholder={t.words.search}
              value={query}
              onChangeText={setQuery}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              <Chip label={`${total}`} active={!filter} onPress={() => setFilter(null)} />
              {themes
                .filter((th) => th.unlocked)
                .map((th) => (
                  <Chip
                    key={th.unit.id}
                    label={localize(th.unit.title, LANG)}
                    color={unitTint(th.unit.color).solid}
                    active={filter === th.unit.id}
                    onPress={() => setFilter(filter === th.unit.id ? null : th.unit.id)}
                  />
                ))}
            </ScrollView>

            {q && !shown.length ? (
              <Text align="center" color={colors.textMuted}>
                {t.words.noResults}
              </Text>
            ) : null}

            {shown.map((th, i) => (
              <Animated.View key={th.unit.id} entering={enter.up(i * 40)}>
                <ThemeSection
                  theme={th}
                  onOpen={(word) => {
                    setOpen({ word, theme: th });
                    setSheetVisible(true);
                  }}
                />
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>

      <WordSheet
        word={open?.word ?? null}
        tint={unitTint(open?.theme.unit.color ?? 'jade')}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function ThemeSection({ theme, onOpen }: { theme: Theme; onOpen: (w: WordRow) => void }) {
  const tint = unitTint(theme.unit.color);
  const title = localize(theme.unit.title, LANG);

  if (!theme.unlocked) {
    return (
      <View style={styles.locked}>
        <Icon icon={Lock} size={18} color={colors.textMuted} />
        <View style={styles.flex}>
          <Text variant="bodyBold" color={colors.textSecondary}>
            {title}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {t.words.lockedTheme}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <IconBubble
          icon={unitIcon(theme.unit.icon)}
          diameter={40}
          color={tint.shade}
          background={tint.soft}
        />
        <Text variant="heading" style={styles.flex}>
          {title}
        </Text>
        <Badge label={t.words.count(theme.words.length)} tint={tint} />
      </View>
      <Card padding={0}>
        {theme.words.map((w, i) => (
          <Pressable
            key={w.id}
            onPress={() => {
              haptics.tap();
              onOpen(w);
            }}
            style={({ pressed }) => [
              styles.word,
              i > 0 && styles.divider,
              pressed && styles.pressed,
            ]}>
            <View style={styles.flex}>
              <Text variant="vi" color={tint.shade}>
                {w.vi}
              </Text>
              <Text color={colors.textSecondary}>{localize(w.meaning, LANG)}</Text>
            </View>
            {w.kind === 'expression' ? <Badge label={t.words.expression} tone="lotus" /> : null}
            {w.audio_url ? <Icon icon={Volume2} size={18} color={colors.textMuted} /> : null}
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

function Chip({
  label,
  active,
  color = colors.primary,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[styles.chip, active && { borderColor: color, backgroundColor: colors.surface }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" color={active ? colors.text : colors.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xs },
  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  chips: { gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  section: { gap: spacing.md },
  word: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: { borderTopWidth: 2, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.background },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderShade,
  },
});
