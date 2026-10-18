import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text, colors, fonts, palette, river } from '@/theme';

/** "Chào" wordmark with a conical hat (nón lá) and the gold star of the flag. */
export function Logo({ size = 30 }: { size?: number }) {
  const hat = size * 1.15;
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Chào">
      <Svg width={hat} height={hat * 0.62} viewBox="0 0 48 30">
        <Path
          d="M2 24 L24 2 L46 24 Q24 31 2 24 Z"
          fill={river.straw}
          stroke={river.strawShade}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path d="M13 22 L24 2 M35 22 L24 2" stroke={river.strawShade} strokeWidth={1.5} />
        <Path
          d="M3 25 Q24 31 45 25"
          stroke={palette.lantern}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <Text
        style={{ fontFamily: fonts.black, fontSize: size, lineHeight: size * 1.4 }}
        color={colors.accent}>
        Chào
      </Text>
      <Svg
        width={size * 0.42}
        height={size * 0.42}
        viewBox="0 0 20 20"
        style={{ marginTop: -size * 0.5 }}>
        <Path
          d="M10 1 L12.6 7.2 L19.3 7.6 L14.1 11.8 L15.8 18.3 L10 14.6 L4.2 18.3 L5.9 11.8 L0.7 7.6 L7.4 7.2 Z"
          fill={palette.gold}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
