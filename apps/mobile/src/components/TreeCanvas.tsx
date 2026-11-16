import { BlurMask, Canvas, Group, Path, Skia, useClock, usePathValue, type SkPathBuilder } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { sceneInk, type Scene } from '@/lib/scene';
import { buildRoundTree, windAt, type Puff } from '@/tree/roundTree';
import { colors } from '@/theme/tokens';

export type TreeProps = {
  /** Weekday (0 = Sunday) of each flower in bloom, oldest first; each takes its day's colour. */
  flowerDays: number[];
  size?: number;
  /** Bloom the newest flower in with an animation (after a round that earned it). */
  newFlower?: boolean;
  /** Last week's flowers falling to the ground (shown at the start of a new week). */
  fallenDays?: number[];
  scene?: Scene;
};

// One tree for everyone, so it always looks the same.
const TREE = buildRoundTree();
const WEEK = [0, 1, 2, 3, 4, 5, 6];
/** Falling runs from 0 to FALL_END; flowers land by ~1.25, then fade out. */
const FALL_END = 1.7;

type Layout = { cx: number; cy: number; R: number; gy: number; k: number };
type Fall = { clock: SharedValue<number>; groundY: number };

/** Horizontal shift of the crown in the wind. */
function crownShift(t: number, size: number): number {
  'worklet';
  return size * 0.035 * windAt(t);
}

function usePuffs(time: SharedValue<number>, L: Layout, size: number, puffs: Puff[], amp: number) {
  return usePathValue((b: SkPathBuilder) => {
    'worklet';
    const t = time.value;
    const dx = crownShift(t, size);
    for (const c of puffs) {
      b.addCircle(
        L.cx + c.x * L.R + dx + Math.sin(t * 1.2 + c.p) * amp * L.k,
        L.cy + c.y * L.R + Math.cos(t + c.p) * amp * 0.6 * L.k,
        c.r * L.R,
      );
    }
  });
}

function useFlowerPath(
  time: SharedValue<number>,
  bloom: SharedValue<number>,
  L: Layout,
  size: number,
  days: number[],
  part: 'petal' | 'center' | 'glow',
  fall?: Fall,
  day?: number,
) {
  return usePathValue((b: SkPathBuilder) => {
    'worklet';
    const t = time.value;
    const dx = crownShift(t, size);
    const n = days.length;
    for (let k = 0; k < n; k++) {
      if (day !== undefined && days[k] !== day) continue;
      const grow = fall ? 1 : k === n - 1 ? bloom.value : 1;
      if (grow <= 0.01) continue;
      const r = size * 0.028 * grow;
      const spot = TREE.spots[k];
      let x = L.cx + dx + spot[0] * L.R;
      let y = L.cy + spot[1] * L.R;
      let spin = k * 1.3 + 0.15 * Math.sin(t * 0.8 + k);
      if (fall) {
        // Staggered, drifting fall like a petal in the breeze, then rest on the ground.
        const start = n > 1 ? (k * 0.5) / (n - 1) : 0;
        const u = Math.min(1, Math.max(0, (fall.clock.value - start) / 0.75));
        const e = u * u * (3 - 2 * u);
        y = y + (fall.groundY - r * 0.5 - y) * e;
        x = x + Math.sin(u * 6 + k) * size * 0.05 * u;
        spin += u * 4;
      }
      if (part === 'glow') b.addCircle(x, y, r * 2);
      else if (part === 'center') b.addCircle(x, y, r * 0.38);
      else
        for (let q = 0; q < 5; q++) {
          const a = spin + (q * Math.PI * 2) / 5;
          b.addCircle(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.52);
        }
    }
  });
}

/** One petal path per weekday colour (the hook count stays fixed at 7). */
function useDayPetals(
  time: SharedValue<number>,
  bloom: SharedValue<number>,
  L: Layout,
  size: number,
  days: number[],
  fall?: Fall,
) {
  return [
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 0),
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 1),
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 2),
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 3),
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 4),
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 5),
    useFlowerPath(time, bloom, L, size, days, 'petal', fall, 6),
  ];
}

export default function TreeCanvas({ flowerDays, size = 300, newFlower = false, fallenDays = [], scene = 'day' }: TreeProps) {
  const ink = sceneInk[scene];
  const night = scene === 'night';
  const reduce = useReducedMotion();
  const clock = useClock();
  const S = size;
  const gy = S * 0.9;
  // Keep these stable across re-renders (the home screen re-renders on focus and every minute):
  // new objects here would rebuild every animated path.
  const L = useMemo<Layout>(() => ({ cx: S / 2, cy: gy - 0.6 * S * 0.86, R: S * 0.3, gy, k: S / 360 }), [S, gy]);
  const dayKey = flowerDays.join(',');
  const dropKey = fallenDays.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => flowerDays.slice(0, TREE.spots.length), [dayKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dropDays = useMemo(() => fallenDays.slice(0, TREE.spots.length), [dropKey]);

  const bloom = useSharedValue(newFlower && !reduce ? 0 : 1);
  useEffect(() => {
    if (newFlower && !reduce) bloom.value = withDelay(500, withTiming(1, { duration: 1600 }));
  }, [newFlower, reduce, bloom]);

  const fall = useSharedValue(reduce ? FALL_END : 0);
  useEffect(() => {
    if (dropDays.length > 0 && !reduce) {
      fall.value = 0;
      fall.value = withDelay(700, withTiming(FALL_END, { duration: 6500 + dropDays.length * 300, easing: Easing.linear }));
    }
  }, [dropDays.length, reduce, fall]);
  const fallOpacity = useDerivedValue(() => Math.min(1, Math.max(0, (FALL_END - fall.value) / 0.3)));

  const time = useDerivedValue(() => (reduce ? 0 : clock.value / 1000));

  // Trunk: a thick stem that forks into a Y under the crown; its top follows the crown a little.
  const trunk = usePathValue((b) => {
    'worklet';
    const tx = crownShift(time.value, S) * 0.6;
    b.moveTo(L.cx, gy);
    b.quadTo(L.cx + S * 0.01, gy - S * 0.86 * 0.2, L.cx + tx, gy - S * 0.86 * 0.36);
  });
  const forks = usePathValue((b) => {
    'worklet';
    const dx = crownShift(time.value, S);
    const tx = dx * 0.6;
    const fy = gy - S * 0.86 * 0.36;
    b.moveTo(L.cx + tx, fy);
    b.quadTo(L.cx + tx - S * 0.04, fy - S * 0.05, L.cx + dx - S * 0.1, L.cy + S * 0.035);
    b.moveTo(L.cx + tx, fy);
    b.quadTo(L.cx + tx + S * 0.05, fy - S * 0.06, L.cx + dx + S * 0.11, L.cy + S * 0.017);
  });

  const back = usePuffs(time, L, S, TREE.back, 1.2);
  const mid = usePuffs(time, L, S, TREE.mid, 1.6);
  const front = usePuffs(time, L, S, TREE.front, 2);

  // Line-art grass tufts at the foot of the tree, leaning in the breeze.
  const grass = usePathValue((b) => {
    'worklet';
    const t = time.value;
    const tufts = [
      [-0.22, 1],
      [-0.1, 0.8],
      [0.13, 0.9],
      [0.25, 1.1],
    ];
    for (let k = 0; k < tufts.length; k++) {
      const gx = L.cx + tufts[k][0] * S;
      const s = tufts[k][1] * L.k;
      const lean = Math.sin(t * 1.6 + k) * 2 * L.k;
      b.moveTo(gx - 6 * s, gy - 1);
      b.quadTo(gx - 7 * s + lean, gy - 9 * s, gx - 10 * s + lean, gy - 14 * s);
      b.moveTo(gx, gy - 1);
      b.quadTo(gx + lean, gy - 11 * s, gx + 1 + lean, gy - 18 * s);
      b.moveTo(gx + 6 * s, gy - 1);
      b.quadTo(gx + 7 * s + lean, gy - 9 * s, gx + 10 * s + lean, gy - 13 * s);
    }
  });

  const petals = useDayPetals(time, bloom, L, S, days);
  const centers = useFlowerPath(time, bloom, L, S, days, 'center');
  const glows = useFlowerPath(time, bloom, L, S, days, 'glow');
  const fallSpec = useMemo<Fall>(() => ({ clock: fall, groundY: gy }), [fall, gy]);
  const fallPetals = useDayPetals(time, bloom, L, S, dropDays, fallSpec);
  const fallCenters = useFlowerPath(time, bloom, L, S, dropDays, 'center', fallSpec);

  // Pollen drifting up by day; bigger, brighter fireflies at night.
  const pollen = usePathValue((b) => {
    'worklet';
    const t = time.value;
    for (const p of TREE.pollen) {
      const y = (p.y + t * p.speed) % 3;
      const x = p.x + 0.12 * Math.sin(t * 0.35 + p.p);
      const twinkle = 0.6 + 0.4 * Math.sin(t * 1.3 + p.p);
      b.addCircle(L.cx + x * L.R, gy - y * L.R, p.r * L.R * twinkle * (night ? 1.8 : 1));
    }
  });

  // Hand-drawn ground line with curled ends, echoing the tails of the logo.
  const ground = useMemo(() => {
    const y = gy;
    const l = S * 0.08;
    const r = S * 0.92;
    const d = [
      `M ${l} ${y - 6}`,
      `C ${l + 22} ${y - 14} ${l + 44} ${y - 10} ${l + 50} ${y - 2}`,
      `C ${S * 0.3} ${y + 6} ${S * 0.42} ${y + 2} ${S / 2} ${y}`,
      `C ${S * 0.6} ${y - 2} ${S * 0.7} ${y + 8} ${r - 40} ${y + 2}`,
      `C ${r - 20} ${y - 2} ${r - 14} ${y - 14} ${r} ${y - 12}`,
    ].join(' ');
    return Skia.Path.MakeFromSVGString(d)!;
  }, [S, gy]);

  return (
    <Canvas style={{ width: S, height: S }} accessible={false}>
      <Path path={ground} style="stroke" strokeWidth={Math.max(2.5, S * 0.01)} strokeCap="round" color={ink.line} />
      <Path path={grass} style="stroke" strokeWidth={2.5 * L.k} strokeCap="round" color={ink.line} />

      <Path path={trunk} style="stroke" strokeWidth={S * 0.05} strokeCap="round" color={ink.tree.trunk} />
      <Path path={forks} style="stroke" strokeWidth={S * 0.026} strokeCap="round" color={ink.tree.trunk} />

      <Path path={back} color={ink.tree.back} />
      <Path path={mid} color={ink.tree.mid} />
      <Path path={front} color={ink.tree.front} />

      <Path path={glows} color="rgba(255, 245, 230, 0.4)">
        <BlurMask blur={S * 0.02} style="normal" />
      </Path>
      {WEEK.map((d) => (
        <Path key={d} path={petals[d]} color={colors.dayBlossom[d]} />
      ))}
      <Path path={centers} color={colors.blossomCenter} />

      {dropDays.length > 0 && (
        <Group opacity={fallOpacity}>
          {WEEK.map((d) => (
            <Path key={`f${d}`} path={fallPetals[d]} color={colors.dayBlossom[d]} />
          ))}
          <Path path={fallCenters} color={colors.blossomCenter} />
        </Group>
      )}

      <Path path={pollen} color={night ? 'rgba(225, 255, 150, 0.95)' : 'rgba(255, 236, 170, 0.85)'}>
        <BlurMask blur={night ? 4 : 2.5} style="solid" />
      </Path>
    </Canvas>
  );
}
