import { localize, parseRich, type NoteBlock, type NoteSound } from '@chao/shared';
import { useAudioPlayer } from 'expo-audio';
import { Lightbulb, Quote, Volume2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { LANG } from '@/i18n';
import { ensureAudioMode } from '@/lib/audio';
import { Card, Icon, Text, borderWidth, colors, enter, haptics, radii, spacing } from '@/theme';

import { AudioButton } from '../AudioButton';
import type { ExerciseProps } from './types';

type Tint = ExerciseProps<'note'>['tint'];

/** One player for the whole card: tapping a sound replaces what was playing. */
function useSounds() {
  const player = useAudioPlayer(null);
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(ensureAudioMode, []);
  const play = useCallback(
    (uri: string) => {
      haptics.tap();
      setCurrent(uri);
      player.replace(uri);
      player.play();
    },
    [player],
  );
  return { play, current };
}

type Play = (uri: string) => void;

/** Free lesson card (alphabet, tones…): headings, texts, tappable sounds, examples. */
export function Note({ ex, tint }: ExerciseProps<'note'>) {
  const { play, current } = useSounds();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {ex.title ? (
        <Animated.View entering={enter.up()}>
          <Text variant="title" align="center" color={tint.shade}>
            {ex.title}
          </Text>
        </Animated.View>
      ) : null}
      {ex.blocks.map((b, i) => (
        <Animated.View key={i} entering={enter.up(Math.min(60 * (i + 1), 400))}>
          <Block block={b} tint={tint} play={play} current={current} />
        </Animated.View>
      ))}
    </ScrollView>
  );
}

function Block({
  block,
  tint,
  play,
  current,
}: {
  block: NoteBlock;
  tint: Tint;
  play: Play;
  current: string | null;
}) {
  switch (block.type) {
    case 'heading':
      return <Text variant="heading">{localize(block.text, LANG)}</Text>;
    case 'text':
      return (
        <RichText text={localize(block.text, LANG)} sounds={block.sounds} tint={tint} play={play} />
      );
    case 'tip':
      return (
        <Card tint={{ background: colors.xpSoft, border: colors.xpSoft }} padding={spacing.md}>
          <View style={styles.row}>
            <Icon icon={Lightbulb} size={20} color={colors.xpShade} />
            <RichText
              text={localize(block.text, LANG)}
              sounds={block.sounds}
              tint={tint}
              play={play}
              style={styles.flex}
            />
          </View>
        </Card>
      );
    case 'sounds':
      return (
        <View style={styles.grid}>
          {block.items
            .filter((s) => s.vi)
            .map((s, i) => (
              <SoundTile key={i} sound={s} tint={tint} play={play} current={current} />
            ))}
        </View>
      );
    case 'example': {
      const meaning = localize(block.meaning, LANG);
      return (
        <Card padding={spacing.md}>
          <View style={styles.row}>
            <Icon icon={Quote} size={18} color={tint.solid} />
            <View style={styles.flex}>
              <Text variant="vi">{block.vi}</Text>
              {meaning ? <Text color={colors.textSecondary}>{meaning}</Text> : null}
            </View>
            {block.audio_url ? (
              <AudioButton key={block.audio_url} uri={block.audio_url} size="sm" />
            ) : null}
          </View>
        </Card>
      );
    }
  }
}

/** **bold** and [Vietnamese]; Vietnamese with a recording plays when tapped. */
function RichText({
  text,
  sounds,
  tint,
  play,
  style,
}: {
  text: string;
  sounds: Record<string, string> | undefined;
  tint: Tint;
  play: Play;
  style?: object;
}) {
  return (
    <Text style={style}>
      {parseRich(text).map((p, i) => {
        if (p.kind === 'text') return p.value;
        if (p.kind === 'bold')
          return (
            <Text key={i} variant="bodyBold">
              {p.value}
            </Text>
          );
        const uri = sounds?.[p.value];
        return (
          <Text
            key={i}
            variant="bodyBold"
            color={tint.shade}
            style={uri ? styles.tappable : undefined}
            onPress={uri ? () => play(uri) : undefined}
            accessibilityRole={uri ? 'button' : undefined}>
            {p.value}
            {uri ? ' 🔊' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

function SoundTile({
  sound,
  tint,
  play,
  current,
}: {
  sound: NoteSound;
  tint: Tint;
  play: Play;
  current: string | null;
}) {
  const caption = localize(sound.caption, LANG);
  const uri = sound.audio_url;
  const active = !!uri && uri === current;
  return (
    <Pressable
      disabled={!uri}
      onPress={uri ? () => play(uri) : undefined}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tile,
        { borderColor: active ? tint.solid : colors.borderShade },
        active && { backgroundColor: tint.soft },
        pressed && styles.pressed,
      ]}>
      <Text variant="viHeading" align="center" color={tint.shade}>
        {sound.vi}
      </Text>
      {caption ? (
        <Text variant="caption" align="center" color={colors.textSecondary}>
          {caption}
        </Text>
      ) : null}
      {uri ? <Icon icon={Volume2} size={14} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  tappable: { textDecorationLine: 'underline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tile: {
    minWidth: 76,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
