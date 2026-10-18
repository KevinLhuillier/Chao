/**
 * Cartoon scenery of the Mekong Delta, drawn with SVG primitives. Every piece
 * is drawn around its ground point (0, 0): it stands on it, so the map only has
 * to translate (and scale/flip) it.
 */
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { palette, river } from '@/theme';

import type { DecorKind, DecorLayout, WaterDecor } from './geometry';

const OUTLINE = 'rgba(45,41,38,0.18)';

function Shadow({ rx = 16 }: { rx?: number }) {
  return <Ellipse cx={0} cy={1} rx={rx} ry={rx / 4} fill="rgba(45,41,38,0.10)" />;
}

/** Coconut palm (cây dừa), the tree of the Delta. */
export function Palm() {
  const frond = (d: string, fill: string) => (
    <Path d={d} fill={fill} stroke={river.leafShade} strokeWidth={1.2} strokeLinejoin="round" />
  );
  return (
    <G>
      <Shadow rx={18} />
      <Path
        d="M-5 0 C-3 -24 1 -44 5 -64 L11 -63 C7 -44 4 -24 4 0 Z"
        fill={river.trunk}
        stroke={river.trunkShade}
        strokeWidth={1.2}
      />
      {[-12, -24, -36, -48].map((y) => (
        <Path
          key={y}
          d={`M${-3 + (-y / 64) * 7} ${y} l7 -1`}
          stroke={river.trunkShade}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ))}
      {frond('M8 -64 C-8 -76 -26 -70 -32 -54 C-20 -62 -6 -62 8 -64 Z', river.leaf)}
      {frond('M8 -64 C24 -77 42 -70 46 -52 C34 -61 20 -62 8 -64 Z', river.leaf)}
      {frond('M8 -64 C0 -84 -16 -88 -26 -80 C-12 -78 -2 -72 8 -64 Z', river.leafLight)}
      {frond('M8 -64 C18 -86 34 -88 42 -78 C28 -77 16 -72 8 -64 Z', river.leafLight)}
      {frond('M8 -64 C4 -78 8 -90 14 -94 C14 -82 12 -72 8 -64 Z', river.leaf)}
      <Circle cx={5} cy={-61} r={3.6} fill={river.trunkShade} />
      <Circle cx={11} cy={-60} r={3.6} fill="#8A5A2E" />
      <Circle cx={8} cy={-56.5} r={3.4} fill={river.trunkShade} />
    </G>
  );
}

/** Rice paddy (ruộng lúa) with rows of young rice and a conical hat. */
export function Paddy() {
  const sprouts = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const x = -26 + col * 10.5 + (row % 2) * 4;
      const y = -22 + row * 8;
      sprouts.push(
        <Path
          key={`${row}-${col}`}
          d={`M${x - 2.5} ${y - 4} L${x} ${y} L${x + 2.5} ${y - 4} M${x} ${y} L${x} ${y - 5}`}
          stroke={river.leafShade}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />,
      );
    }
  }
  return (
    <G>
      <Rect x={-38} y={-34} width={76} height={36} rx={10} fill={river.paddyShade} />
      <Rect x={-34} y={-31} width={68} height={29} rx={8} fill={river.paddy} />
      <Path
        d="M-28 -12 C-10 -15 10 -9 28 -13"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={2}
        fill="none"
      />
      {sprouts}
      <NonLa x={20} y={-26} size={0.7} />
    </G>
  );
}

/** Conical hat (nón lá). */
export function NonLa({ x = 0, y = 0, size = 1 }: { x?: number; y?: number; size?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size})`}>
      <Path
        d="M-14 4 L0 -10 L14 4 Q0 9 -14 4 Z"
        fill={river.straw}
        stroke={river.strawShade}
        strokeWidth={1.2}
      />
      <Path d="M-7 1 L0 -10 M7 1 L0 -10" stroke={river.strawShade} strokeWidth={0.9} />
    </G>
  );
}

/** Stilt house (nhà sàn) with a thatched roof, by the water. */
export function StiltHouse() {
  return (
    <G>
      <Shadow rx={26} />
      {[-18, -6, 6, 18].map((x) => (
        <Rect key={x} x={x - 1.5} y={-16} width={3} height={16} fill={river.woodShade} />
      ))}
      <Rect x={-26} y={-20} width={52} height={5} rx={1.5} fill={river.woodShade} />
      <Rect
        x={-22}
        y={-42}
        width={44}
        height={23}
        rx={2}
        fill={river.woodLight}
        stroke={river.woodShade}
        strokeWidth={1.2}
      />
      {[-14, -6, 2, 10, 18].map((x) => (
        <Line key={x} x1={x} y1={-41} x2={x} y2={-20} stroke={river.wood} strokeWidth={1} />
      ))}
      <Rect x={-6} y={-34} width={11} height={15} rx={1.5} fill={river.trunkShade} />
      <Rect
        x={9}
        y={-36}
        width={9}
        height={8}
        rx={1.5}
        fill={palette.gold}
        stroke={river.woodShade}
        strokeWidth={1}
      />
      <Path
        d="M-32 -40 L0 -64 L32 -40 Q0 -36 -32 -40 Z"
        fill={river.straw}
        stroke={river.strawShade}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {[-20, -10, 0, 10, 20].map((x) => (
        <Path
          key={x}
          d={`M${x * 0.9} -59 L${x * 1.35} -40`}
          stroke={river.strawShade}
          strokeWidth={1}
        />
      ))}
      {/* Little red lantern under the roof. */}
      <Line x1={-17} y1={-41} x2={-17} y2={-37} stroke={river.woodShade} strokeWidth={1} />
      <Ellipse cx={-17} cy={-33} rx={3.5} ry={4.5} fill={palette.lantern} />
    </G>
  );
}

/** Bamboo grove (tre). */
export function Bamboo() {
  const stalk = (x: number, h: number, key: number) => (
    <G key={key}>
      <Rect
        x={x - 2.5}
        y={-h}
        width={5}
        height={h}
        rx={2}
        fill={palette.bamboo}
        stroke={palette.bambooShade}
        strokeWidth={1}
      />
      {Array.from({ length: Math.floor(h / 14) }, (_, i) => (
        <Line
          key={i}
          x1={x - 2.5}
          x2={x + 2.5}
          y1={-12 - i * 14}
          y2={-12 - i * 14}
          stroke={palette.bambooShade}
          strokeWidth={1.4}
        />
      ))}
      <Path d={`M${x} ${-h + 6} q 9 -6 16 -2 q -9 2 -16 2 Z`} fill={river.leaf} />
      <Path d={`M${x} ${-h + 16} q -10 -6 -16 -1 q 9 2 16 1 Z`} fill={river.leafLight} />
      <Path d={`M${x} ${-h} q 4 -8 2 -14 q -4 6 -2 14 Z`} fill={river.leaf} />
    </G>
  );
  return (
    <G>
      <Shadow rx={16} />
      {stalk(-8, 52, 0)}
      {stalk(2, 66, 1)}
      {stalk(11, 46, 2)}
    </G>
  );
}

/** Yellow apricot blossom (hoa mai), the flower of Tết in the South. */
export function Mai() {
  const flowers = [
    [-14, -40],
    [-4, -50],
    [8, -46],
    [16, -36],
    [-10, -28],
    [4, -34],
    [12, -56],
    [-18, -50],
  ];
  return (
    <G>
      <Shadow rx={14} />
      <Path
        d="M0 0 C-1 -14 -2 -24 -8 -34 M-1 -18 C4 -26 8 -34 10 -44 M-3 -28 C-6 -40 -2 -48 -4 -52"
        stroke={river.trunk}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={0} cy={-40} rx={22} ry={18} fill={river.leafLight} opacity={0.55} />
      {flowers.map(([x, y], i) => (
        <G key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse
              key={a}
              cx={0}
              cy={-3}
              rx={2.4}
              ry={3.4}
              fill={palette.gold}
              transform={`rotate(${a})`}
            />
          ))}
          <Circle r={1.6} fill={palette.flameShade} />
        </G>
      ))}
    </G>
  );
}

/** Small lotus pond (ao sen). */
export function Pond() {
  return (
    <G>
      <Ellipse cx={0} cy={-8} rx={34} ry={14} fill={river.waterDeep} />
      <Ellipse cx={0} cy={-9} rx={31} ry={11.5} fill={river.water} />
      <LilyPad x={-14} y={-10} size={0.8} />
      <LilyPad x={12} y={-6} size={0.6} />
      <Lotus x={-14} y={-14} size={0.55} />
      <Lotus x={14} y={-12} size={0.42} />
    </G>
  );
}

/** Water buffalo (con trâu) with an egret on its back. */
export function Buffalo() {
  const body = '#6E7783';
  const dark = '#545C67';
  return (
    <G>
      <Shadow rx={24} />
      {[-14, -6, 8, 15].map((x) => (
        <Rect key={x} x={x - 2.5} y={-12} width={5} height={12} rx={2} fill={dark} />
      ))}
      <Path
        d="M-20 -16 q-8 2 -6 12"
        stroke={dark}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx={0} cy={-18} rx={21} ry={12} fill={body} stroke={dark} strokeWidth={1.2} />
      <Ellipse cx={22} cy={-22} rx={9} ry={8} fill={body} stroke={dark} strokeWidth={1.2} />
      <Ellipse cx={27} cy={-19} rx={4.5} ry={3.5} fill="#8E97A2" />
      <Path
        d="M17 -28 C10 -36 16 -40 20 -34 M27 -28 C34 -36 28 -40 24 -34"
        stroke="#EDE4D6"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={21} cy={-24} r={1.4} fill="#2D2926" />
      {/* Egret (cò). */}
      <Ellipse cx={-4} cy={-33} rx={6} ry={3.6} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={0.8} />
      <Path
        d="M0 -34 C3 -40 2 -44 5 -45"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M5 -45 l4 1" stroke={palette.gold} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}

/** Floating lily pad. */
export function LilyPad({ x = 0, y = 0, size = 1 }: { x?: number; y?: number; size?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size})`}>
      <Path
        d="M0 0 L10 -4 A11 7 0 1 1 10 4 Z"
        fill={river.leaf}
        stroke={river.leafShade}
        strokeWidth={1}
      />
    </G>
  );
}

/** Pink lotus flower (hoa sen). */
export function Lotus({ x = 0, y = 0, size = 1 }: { x?: number; y?: number; size?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size})`}>
      <Path d="M0 0 C-14 -2 -18 -10 -16 -14 C-10 -12 -4 -8 0 0 Z" fill={palette.lotus} />
      <Path d="M0 0 C14 -2 18 -10 16 -14 C10 -12 4 -8 0 0 Z" fill={palette.lotus} />
      <Path
        d="M0 0 C-9 -6 -9 -16 -5 -22 C-1 -16 1 -8 0 0 Z"
        fill={palette.lotusSoft}
        stroke={palette.lotus}
        strokeWidth={0.8}
      />
      <Path
        d="M0 0 C9 -6 9 -16 5 -22 C1 -16 -1 -8 0 0 Z"
        fill={palette.lotusSoft}
        stroke={palette.lotus}
        strokeWidth={0.8}
      />
      <Path
        d="M0 0 C-5 -8 -4 -20 0 -26 C4 -20 5 -8 0 0 Z"
        fill="#FFC1D6"
        stroke={palette.lotus}
        strokeWidth={0.8}
      />
    </G>
  );
}

export function SceneryItem({ item }: { item: DecorLayout }) {
  const Piece = PIECES[item.kind];
  return (
    <G
      transform={`translate(${item.x} ${item.y}) scale(${item.flip ? -item.scale : item.scale} ${item.scale})`}>
      <Piece />
    </G>
  );
}

const PIECES: Record<DecorKind, () => React.JSX.Element> = {
  palm: Palm,
  paddy: Paddy,
  house: StiltHouse,
  bamboo: Bamboo,
  mai: Mai,
  pond: Pond,
  buffalo: Buffalo,
};

export function WaterItem({ item }: { item: WaterDecor }) {
  const { x, y, scale } = item;
  if (item.kind === 'lilypad') {
    return (
      <G>
        <LilyPad x={x} y={y} size={scale} />
        {scale > 1 ? <Lotus x={x - 3} y={y - 1} size={0.35} /> : null}
      </G>
    );
  }
  if (item.kind === 'fish') {
    return (
      <G transform={`translate(${x} ${y}) scale(${scale})`} opacity={0.85}>
        <Ellipse cx={0} cy={0} rx={7} ry={3.5} fill={palette.flame} />
        <Path d="M6 0 l6 -4 v8 Z" fill={palette.flame} />
        <Circle cx={-4} cy={-0.8} r={0.9} fill="#2D2926" />
      </G>
    );
  }
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path
        d="M-10 0 q5 -4 10 0 q5 4 10 0"
        stroke={river.foam}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Path
        d="M-4 6 q4 -3 8 0"
        stroke={river.foam}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </G>
  );
}

/** Grass tufts scattered on the land. */
export function Tuft({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <Path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M-6 0 q2 -8 3 -10 q0 6 1 10 q1 -9 4 -12 q-1 8 0 12 q2 -6 5 -8 q-2 5 -2 8 Z"
      fill={river.landDeep}
    />
  );
}
