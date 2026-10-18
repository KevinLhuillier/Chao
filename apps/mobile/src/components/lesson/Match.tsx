import { shuffle } from '@chao/shared';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { t } from '@/i18n';
import { enter, haptics, spacing } from '@/theme';

import { Prompt } from './Prompt';
import { Tile, type TileState } from './Tile';
import type { ExerciseProps } from './types';

type Side = 'vi' | 'meaning';
type Pick = { side: Side; id: string };

/** Tap a Vietnamese word, then its meaning (or the other way round). */
export function Match({ ex, solve, tint }: ExerciseProps<'match'>) {
  const [columns] = useState(() => ({ vi: shuffle(ex.pairs), meaning: shuffle(ex.pairs) }));
  const [selected, setSelected] = useState<Pick | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ ids: Pick[]; ok: boolean } | null>(null);
  const mistakes = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function tap(side: Side, id: string) {
    if (matched.has(id) || flash) return;
    if (!selected || selected.side === side) {
      setSelected({ side, id });
      return;
    }
    const pair: Pick[] = [selected, { side, id }];
    const ok = selected.id === id;
    setSelected(null);
    setFlash({ ids: pair, ok });
    if (ok) haptics.success();
    else {
      haptics.error();
      mistakes.current++;
    }
    timer.current = setTimeout(
      () => {
        setFlash(null);
        if (!ok) return;
        const next = new Set(matched).add(id);
        setMatched(next);
        if (next.size === ex.pairs.length) {
          solve({ verdict: 'correct', firstTry: mistakes.current === 0 });
        }
      },
      ok ? 280 : 520,
    );
  }

  const stateOf = (side: Side, id: string): TileState => {
    if (matched.has(id)) return 'used';
    const flashing = flash?.ids.some((p) => p.side === side && p.id === id);
    if (flashing) return flash!.ok ? 'right' : 'wrong';
    return selected?.side === side && selected.id === id ? 'selected' : 'idle';
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Prompt instruction={t.lesson.match} tint={tint} />
      <View style={styles.columns}>
        {(['vi', 'meaning'] as const).map((side) => (
          <View key={side} style={styles.column}>
            {columns[side].map((p, i) => (
              <Animated.View key={p.id} entering={enter.up(60 + i * 40)}>
                <Tile
                  label={side === 'vi' ? p.vi : p.meaning}
                  vi={side === 'vi'}
                  compact
                  state={stateOf(side, p.id)}
                  onPress={() => tap(side, p.id)}
                />
              </Animated.View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  columns: { flexDirection: 'row', gap: spacing.md },
  column: { flex: 1, gap: spacing.md },
});
