import { router, useFocusEffect } from 'expo-router';
import { Sailboat } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonSheet } from '@/components/LessonSheet';
import { RiverMap } from '@/components/river/RiverMap';
import { StatsBar } from '@/components/StatsBar';
import { t } from '@/i18n';
import { fetchPath } from '@/lib/api/course';
import { useStats } from '@/lib/stats';
import type { PathLesson, PathUnit } from '@/lib/types';
import { Button, Card, IconBubble, Text, colors, river, spacing } from '@/theme';

/** The journey: a single path down the Mekong, one lily pad per lesson. */
export default function Journey() {
  const { width, height } = useWindowDimensions();
  const { refresh: refreshStats } = useStats();
  const [units, setUnits] = useState<PathUnit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [target, setTarget] = useState<{ lesson: PathLesson; unit: PathUnit } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  /** Scroll to the boat on first load only, not on every refocus. */
  const scrolled = useRef(false);
  /** Last path loaded, serialized: an unchanged path keeps the map as is (no redraw). */
  const lastPath = useRef('');

  const load = useCallback(async () => {
    try {
      const [path] = await Promise.all([fetchPath(), refreshStats()]);
      const serialized = JSON.stringify(path);
      if (serialized !== lastPath.current) {
        lastPath.current = serialized;
        setUnits(path);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [refreshStats]);

  // Reload whenever the tab gets focus (e.g. back from a lesson).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onBoatY = useCallback(
    (y: number) => {
      if (scrolled.current) return;
      scrolled.current = true;
      // Leave the boat in the upper third of the screen.
      requestAnimationFrame(() =>
        scroll.current?.scrollTo({ y: Math.max(0, y - height / 3), animated: false }),
      );
    },
    [height],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatsBar />
      {error ? (
        <View style={styles.center}>
          <Card>
            <Text color={colors.danger}>{t.common.loadError(error)}</Text>
            <Button
              label={t.common.retry}
              variant="secondary"
              onPress={load}
              style={styles.retry}
            />
          </Card>
        </View>
      ) : !units ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !units.length ? (
        <View style={styles.center}>
          <IconBubble icon={Sailboat} />
          <Text align="center" color={colors.textSecondary}>
            {t.journey.empty}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scroll}
          style={styles.map}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }>
          <RiverMap
            units={units}
            width={width}
            onBoatY={onBoatY}
            onLessonPress={(lesson, unit) => {
              setTarget({ lesson, unit });
              setSheetOpen(true);
            }}
            onOpenWords={(unit) => router.push({ pathname: '/words', params: { unit: unit.id } })}
          />
        </ScrollView>
      )}

      <LessonSheet
        target={target}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStart={(lesson) => {
          setSheetOpen(false);
          router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1, backgroundColor: river.land },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  retry: { marginTop: spacing.md },
});
