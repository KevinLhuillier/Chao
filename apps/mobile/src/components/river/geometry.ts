/**
 * Layout of the river map: where each unit banner, lesson (lily pad), the boat
 * and the decorations sit, and the river's centerline through all of them.
 * Pure functions, in the map's own coordinates (0,0 = top-left of the map).
 */
import type { PathLesson, PathUnit } from '@/lib/types';

export const RIVER = {
  /** Water width; banks are drawn a bit wider. */
  width: 150,
  bank: 16,
  /** Vertical distance between two lily pads (leaves room for the boat in between). */
  step: 152,
  pad: 76,
  currentPad: 88,
  banner: 112,
  /** Space above the first banner (departure pier). */
  top: 150,
  /** Space after the last pad (end sign). */
  bottom: 260,
} as const;

export type Point = { x: number; y: number };

export type NodeLayout = Point & { lesson: PathLesson; unit: PathUnit };
export type BannerLayout = Point & { unit: PathUnit };
export type DecorKind = 'palm' | 'paddy' | 'house' | 'bamboo' | 'mai' | 'pond' | 'buffalo';
export type DecorLayout = Point & { kind: DecorKind; scale: number; flip: boolean };
export type WaterDecor = Point & { kind: 'lilypad' | 'ripple' | 'fish'; scale: number };

export type MapLayout = {
  width: number;
  height: number;
  /** Centerline of the river, top to bottom. */
  points: Point[];
  banners: BannerLayout[];
  nodes: NodeLayout[];
  /** Where the boat floats (between the last completed stop and the current one). */
  boat: Point & { facing: 'left' | 'right' };
  decor: DecorLayout[];
  water: WaterDecor[];
  pier: Point;
  end: Point;
};

/** Deterministic pseudo-random in [0, 1), so the scenery doesn't move between renders. */
export function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const DECOR_CYCLE: DecorKind[] = [
  'palm',
  'paddy',
  'house',
  'bamboo',
  'palm',
  'pond',
  'buffalo',
  'mai',
];

export function layoutMap(units: PathUnit[], width: number): MapLayout {
  const cx = width / 2;
  // How far the river swings from the center (zigzag amplitude).
  const amp = Math.min(width * 0.22, 104);
  const points: Point[] = [{ x: cx, y: -40 }];
  const banners: BannerLayout[] = [];
  const nodes: NodeLayout[] = [];
  const pier = { x: cx, y: 70 };
  points.push({ x: cx, y: pier.y });

  let y = RIVER.top;
  units.forEach((unit, u) => {
    const banner = { x: cx, y: y + RIVER.banner / 2, unit };
    banners.push(banner);
    points.push({ x: cx, y: banner.y });
    y += RIVER.banner + RIVER.step * 0.78;
    // Alternate the side the river leaves each banner from.
    const dir = u % 2 === 0 ? 1 : -1;
    unit.lessons.forEach((lesson, j) => {
      const x = cx + dir * amp * Math.sin(((j + 1) * Math.PI) / 3.2);
      const node = { x, y, lesson, unit };
      nodes.push(node);
      points.push({ x, y });
      y += RIVER.step;
    });
    y += RIVER.step * 0.05;
  });

  const end = { x: cx, y: y + 70 };
  points.push(end, { x: cx, y: y + RIVER.bottom + 40 });
  const height = y + RIVER.bottom;

  return {
    width,
    height,
    points,
    banners,
    nodes,
    boat: boatPosition(points, nodes, pier, end),
    decor: scenery(nodes, banners, width),
    water: waterDecor(points, nodes, banners),
    pier,
    end,
  };
}

/** Halfway between the stop before the current lesson and the current one. */
function boatPosition(points: Point[], nodes: NodeLayout[], pier: Point, end: Point) {
  const current = nodes.find((n) => n.lesson.state === 'current');
  let target: Point;
  if (current) target = current;
  else if (nodes.length)
    target = end; // Everything done: the boat waits at the end.
  else return { ...pier, y: pier.y + 46, facing: 'right' as const };

  const i = points.findIndex((p) => p.x === target.x && p.y === target.y);
  const prev = points[i - 1] ?? pier;
  const mid = pointOnSegment(points, i - 1, 0.5);
  return { ...mid, facing: target.x >= prev.x ? ('right' as const) : ('left' as const) };
}

/** Catmull-Rom control points of the segment from points[i] to points[i + 1]. */
function controls(points: Point[], i: number) {
  const p0 = points[i - 1] ?? points[i]!;
  const p1 = points[i]!;
  const p2 = points[i + 1] ?? p1;
  const p3 = points[i + 2] ?? p2;
  const k = 1 / 6;
  return {
    p1,
    c1: { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k },
    c2: { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k },
    p2,
  };
}

export function pointOnSegment(points: Point[], i: number, t: number): Point {
  if (i < 0) return points[0]!;
  const { p1, c1, c2, p2 } = controls(points, i);
  const u = 1 - t;
  return {
    x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
    y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
  };
}

/** Smooth SVG path through every point (Catmull-Rom → cubic Bézier). */
export function smoothPath(points: Point[]) {
  if (!points.length) return '';
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(points[0]!.x)} ${f(points[0]!.y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const { c1, c2, p2 } = controls(points, i);
    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

/** One landmark per stop, on the side the river leaves free, plus the pier's palms. */
function scenery(nodes: NodeLayout[], banners: BannerLayout[], width: number): DecorLayout[] {
  const out: DecorLayout[] = [];
  const half = RIVER.width / 2 + RIVER.bank;
  nodes.forEach((n, i) => {
    const left = n.x > width / 2;
    // Middle of the free land on that side.
    const x = left
      ? Math.max(44, (n.x - half) / 2)
      : Math.min(width - 44, (n.x + half + width) / 2);
    const kind = DECOR_CYCLE[(i + Math.floor(rand(i) * 3)) % DECOR_CYCLE.length]!;
    out.push({ x, y: n.y + 8, kind, scale: 0.85 + rand(i + 7) * 0.3, flip: rand(i + 3) > 0.5 });
    // A second, smaller palm between stops on the other bank, where there is room.
    const other = left ? n.x + half + 30 : n.x - half - 30;
    if (other > 26 && other < width - 26 && rand(i + 11) > 0.35) {
      out.push({ x: other, y: n.y + RIVER.step / 2, kind: 'palm', scale: 0.6, flip: !left });
    }
  });
  banners.forEach((b, i) => {
    out.push({ x: 30, y: b.y - RIVER.banner / 2 - 24, kind: 'bamboo', scale: 0.7, flip: false });
    out.push({
      x: width - 30,
      y: b.y - RIVER.banner / 2 - 20,
      kind: i % 2 ? 'palm' : 'bamboo',
      scale: 0.7,
      flip: true,
    });
  });
  return out.sort((a, b) => a.y - b.y);
}

/** Little things on the water: floating lily pads, ripples, a fish now and then. */
function waterDecor(points: Point[], nodes: NodeLayout[], banners: BannerLayout[]): WaterDecor[] {
  const out: WaterDecor[] = [];
  const busy = [...nodes, ...banners];
  for (let i = 1; i < points.length - 2; i++) {
    for (const t of [0.3, 0.75]) {
      const p = pointOnSegment(points, i, t);
      // Keep clear of pads, banners and the boat lane in the middle.
      if (busy.some((b) => Math.abs(b.y - p.y) < 58)) continue;
      const side = rand(i * 3 + t * 10) > 0.5 ? 1 : -1;
      const r = rand(i * 7 + t * 13);
      out.push({
        x: p.x + side * (RIVER.width / 2 - 24),
        y: p.y,
        kind: r < 0.45 ? 'lilypad' : r < 0.85 ? 'ripple' : 'fish',
        scale: 0.8 + rand(i + t) * 0.4,
      });
    }
  }
  return out;
}
