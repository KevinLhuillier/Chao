import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Snail, Volume2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { ensureAudioMode } from '@/lib/audio';
import { Icon, borderWidth, colors, haptics } from '@/theme';

type Props = {
  uri: string;
  /** Plays once as soon as the recording is loaded. */
  autoPlay?: boolean;
  size?: 'lg' | 'md' | 'sm';
  /** Adds a "slow" button (playback at 0.6×). */
  slow?: boolean;
  color?: string;
};

const SIZES = { lg: 88, md: 60, sm: 40 } as const;

/**
 * Speaker button for a recording (word or sentence) from the "audio" bucket.
 * Mount it with a `key` per recording: each one gets its own player.
 */
export function AudioButton({ uri, autoPlay, size = 'md', slow, color = colors.primary }: Props) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const autoPlayed = useRef(false);

  useEffect(ensureAudioMode, []);

  useEffect(() => {
    if (autoPlay && status.isLoaded && !autoPlayed.current) {
      autoPlayed.current = true;
      player.play();
    }
  }, [autoPlay, status.isLoaded, player]);

  function play(rate: number) {
    haptics.tap();
    player.setPlaybackRate(rate);
    void player.seekTo(0).then(() => player.play());
  }

  const d = SIZES[size];
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => play(1)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t.lesson.tapToHear}
        style={({ pressed }) => [
          styles.button,
          {
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: color,
          },
          pressed && styles.pressed,
          status.playing && styles.playing,
        ]}>
        <Icon icon={Volume2} size={Math.round(d * 0.46)} color={colors.textOnColor} />
      </Pressable>
      {slow ? (
        <Pressable
          onPress={() => play(0.6)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.lesson.slow}
          style={({ pressed }) => [
            styles.button,
            styles.slow,
            { width: d * 0.62, height: d * 0.62, borderRadius: d * 0.31 },
            pressed && styles.pressed,
          ]}>
          <Icon icon={Snail} size={Math.round(d * 0.3)} color={color} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { alignItems: 'center', justifyContent: 'center' },
  slow: {
    backgroundColor: colors.surface,
    borderWidth,
    borderColor: colors.borderShade,
  },
  pressed: { opacity: 0.75 },
  playing: { opacity: 0.85 },
});
