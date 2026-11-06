import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  RadialGradient,
  Skia,
  useClock,
  usePathValue,
  vec,
  type SkPathBuilder,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { useDerivedValue, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { buildTree, poseTree, type Pose, type TreeModel } from '@/tree/model';
import { colors } from '@/theme/tokens';

export type TreeProps = {
  /** Number of flowers in bloom. */
  flowers: number;
  size?: number;
  /** Bloom the newest flower in with an animation (after a round that earned it). */
  newFlower?: boolean;
};

// One tree for everyone, so it always looks the same and never changes shape.
const MODEL = buildTree();

function useBranchPath(pose: SharedValue<Pose>, m: TreeModel, depth: number) {
  return usePathValue((b: SkPathBuilder) => {
    'worklet';
    const p = pose.value;
    for (let i = 0; i < m.n; i++) {
      if (m.depth[i] !== depth) continue;
      b.moveTo(p.x0[i], p.y0[i]);
      b.quadTo(p.cx[i], p.cy[i], p.x1[i], p.y1[i]);
    }
  });
}

function useFlowerPath(
  pose: SharedValue<Pose>,
  time: SharedValue<number>,
  bloom: SharedValue<number>,
  m: TreeModel,
  shown: number,
  s: number,
  part: 'petal' | 'center' | 'glow',
) {
  return usePathValue((b: SkPathBuilder) => {
    'worklet';
    const p = pose.value;
    const t = time.value;
    for (let k = 0; k < shown; k++) {
      const i = m.flowerNode[k];
      const grow = k === shown - 1 ? bloom.value : 1;
      if (grow <= 0.01) continue;
      const r = s * 0.03 * grow;
      const x = p.x1[i];
      const y = p.y1[i];
      if (part === 'glow') {
        b.addCircle(x, y, r * 2.1);
      } else if (part === 'center') {
        b.addCircle(x, y, r * 0.38);
      } else {
        const spin = k * 1.3 + 0.15 * Math.sin(t * 0.8 + k);
        for (let q = 0; q < 5; q++) {
          const a = spin + (q * Math.PI * 2) / 5;
          b.addCircle(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.52);
        }
      }
    }
  });
}

export default function TreeCanvas({ flowers, size = 300, newFlower = false }: TreeProps) {
  const m = MODEL;
  const reduce = useReducedMotion();
  const clock = useClock();
  const W = size;
  const H = size;
  // Fit the whole crown above the ground line, centred.
  const { minX, maxX, maxY } = m.bounds;
  const oy = H * 0.9;
  const s = Math.min((W * 0.96) / (maxX - minX), (oy - H * 0.03) / maxY); // pixels per tree unit
  const ox = W / 2 - ((maxX + minX) / 2) * s;
  const shown = Math.min(flowers, m.flowerNode.length);

  const bloom = useSharedValue(newFlower && !reduce ? 0 : 1);
  useEffect(() => {
    if (newFlower && !reduce) bloom.value = withDelay(500, withTiming(1, { duration: 1600 }));
  }, [newFlower, reduce, bloom]);

  const time = useDerivedValue(() => (reduce ? 0 : clock.value / 1000));
  const pose = useDerivedValue(() => poseTree(m, time.value, ox, oy, s));

  const d0 = useBranchPath(pose, m, 0);
  const d1 = useBranchPath(pose, m, 1);
  const d2 = useBranchPath(pose, m, 2);
  const d3 = useBranchPath(pose, m, 3);
  const d4 = useBranchPath(pose, m, 4);
  const d5 = useBranchPath(pose, m, 5);
  const d6 = useBranchPath(pose, m, 6);
  const d7 = useBranchPath(pose, m, 7);
  const branches = [d0, d1, d2, d3, d4, d5, d6, d7];
  const width = (d: number) => Math.max(1.6, s * 0.03 * Math.pow(0.7, d));

  const leaves = usePathValue((b) => {
    'worklet';
    const p = pose.value;
    const t = time.value;
    for (let k = 0; k < m.leafNode.length; k++) {
      const i = m.leafNode[k];
      const flutter = 0.22 * Math.sin(t * 2.4 + m.leafPhase[k]) + 0.08 * Math.sin(t * 5.1 + m.leafPhase[k] * 3);
      const a = p.world[i] + m.leafAngle[k] + flutter;
      const L = m.leafSize[k] * s;
      const dx = Math.sin(a);
      const dy = -Math.cos(a);
      const nx = -dy;
      const ny = dx;
      // Point on the branch's quadratic curve at leafT.
      const u = m.leafT[k];
      const v = 1 - u;
      const bx = v * v * p.x0[i] + 2 * v * u * p.cx[i] + u * u * p.x1[i];
      const by = v * v * p.y0[i] + 2 * v * u * p.cy[i] + u * u * p.y1[i];
      const tx = bx + dx * L;
      const ty = by + dy * L;
      b.moveTo(bx, by);
      b.cubicTo(bx + dx * L * 0.25 + nx * L * 0.42, by + dy * L * 0.25 + ny * L * 0.42, tx + nx * L * 0.18 - dx * L * 0.12, ty + ny * L * 0.18 - dy * L * 0.12, tx, ty);
      b.cubicTo(tx - nx * L * 0.18 - dx * L * 0.12, ty - ny * L * 0.18 - dy * L * 0.12, bx + dx * L * 0.25 - nx * L * 0.42, by + dy * L * 0.25 - ny * L * 0.42, bx, by);
      b.close();
    }
  });

  const blobs = usePathValue((b) => {
    'worklet';
    const p = pose.value;
    for (let k = 0; k < m.blobNode.length; k++) {
      const i = m.blobNode[k];
      b.addCircle(p.x1[i], p.y1[i], m.blobSize[k] * s);
    }
  });

  // Logo-like curls: a loop that spirals inward from a twig tip.
  const curls = usePathValue((b) => {
    'worklet';
    const p = pose.value;
    const t = time.value;
    for (let k = 0; k < m.curlNode.length; k++) {
      const i = m.curlNode[k];
      const side = m.curlSide[k];
      const R = m.curlSize[k] * s;
      const a0 = p.world[i] + side * (0.4 + 0.15 * Math.sin(t * 1.7 + k));
      let px = p.x1[i];
      let py = p.y1[i];
      b.moveTo(px, py);
      const steps = 14;
      let heading = a0;
      for (let j = 1; j <= steps; j++) {
        const f = j / steps;
        heading += side * (0.42 + 0.25 * f);
        const step = R * (0.55 - 0.3 * f);
        const nx = px + Math.sin(heading) * step;
        const ny = py - Math.cos(heading) * step;
        b.quadTo(px, py, (px + nx) / 2, (py + ny) / 2);
        px = nx;
        py = ny;
      }
    }
  });

  const petals = useFlowerPath(pose, time, bloom, m, shown, s, 'petal');
  const centers = useFlowerPath(pose, time, bloom, m, shown, s, 'center');
  const glows = useFlowerPath(pose, time, bloom, m, shown, s, 'glow');

  // Floating pollen drifting up through the crown.
  const pollen = usePathValue((b) => {
    'worklet';
    const t = time.value;
    const P = m.pollen;
    for (let k = 0; k < P.x.length; k++) {
      const y = (P.y[k] + t * P.speed[k]) % 1.25;
      const x = P.x[k] + 0.05 * Math.sin(t * 0.35 + P.phase[k]);
      const twinkle = 0.6 + 0.4 * Math.sin(t * 1.3 + P.phase[k]);
      b.addCircle(ox + x * s, oy - (y - 0.05) * s, P.r[k] * s * twinkle);
    }
  });

  // Hand-drawn ground line with curled ends, echoing the tails of the logo.
  const ground = useMemo(() => {
    const y = oy;
    const L = W * 0.08;
    const R = W * 0.92;
    const d = [
      `M ${L} ${y - 6}`,
      `C ${L + 22} ${y - 14} ${L + 44} ${y - 10} ${L + 50} ${y - 2}`,
      `C ${W * 0.3} ${y + 6} ${W * 0.42} ${y + 2} ${ox} ${y}`,
      `C ${W * 0.6} ${y - 2} ${W * 0.7} ${y + 8} ${R - 40} ${y + 2}`,
      `C ${R - 20} ${y - 2} ${R - 14} ${y - 14} ${R} ${y - 12}`,
    ].join(' ');
    return Skia.Path.MakeFromSVGString(d)!;
  }, [W, oy, ox]);

  const crownC = vec(ox, oy - s * 0.72);

  return (
    <Canvas style={{ width: W, height: H }} accessible={false}>
      {/* Soft dreamy light behind the crown */}
      <Circle c={crownC} r={s * 0.62}>
        <RadialGradient c={crownC} r={s * 0.62} colors={['#EAF3E6', 'rgba(246,244,239,0)']} />
      </Circle>

      {/* Watercolour-like canopy masses for a soft, dreamy crown */}
      <Path path={blobs} color={colors.canopy}>
        <BlurMask blur={s * 0.045} style="normal" />
      </Path>

      <Path path={ground} style="stroke" strokeWidth={Math.max(2.5, s * 0.012)} strokeCap="round" color={colors.primary} />

      {branches.map((path, d) => (
        <Path key={d} path={path} style="stroke" strokeWidth={width(d)} strokeCap="round" strokeJoin="round" color={colors.primary} />
      ))}

      <Group>
        <Path path={leaves} color={colors.leafFill} />
        <Path path={leaves} style="stroke" strokeWidth={Math.max(1.2, s * 0.006)} strokeJoin="round" color={colors.primary} />
      </Group>
      <Path path={curls} style="stroke" strokeWidth={Math.max(1.4, s * 0.006)} strokeCap="round" color={colors.primary} />

      <Path path={glows} color={colors.blossomGlow}>
        <BlurMask blur={s * 0.02} style="normal" />
      </Path>
      <Path path={petals} color={colors.blossom} />
      <Path path={centers} color={colors.blossomCenter} />

      <Path path={pollen} color="rgba(255, 236, 170, 0.85)">
        <BlurMask blur={2.5} style="solid" />
      </Path>
    </Canvas>
  );
}
