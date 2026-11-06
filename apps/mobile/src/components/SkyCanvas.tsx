// Full-screen backdrop for the home screen, following the time of day:
// morning = warm sunrise with soft blue clouds, day = plain paper, night = dark sky with fireflies.
import { BlurMask, Canvas, Circle, LinearGradient, Path, RadialGradient, Rect, useClock, usePathValue, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Scene } from '@/lib/scene';
import { colors } from '@/theme/tokens';

export type SkyProps = { scene: Scene; width: number; height: number };

// Fixed pseudo-random layout so the sky looks the same every visit.
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 16807) % 2147483647;
    return (a - 1) / 2147483646;
  };
}

// A cloud is a few overlapping puffs with a flat-ish base, the same soft style as the canopy.
const CLOUD_PUFFS: [number, number, number][] = [
  [0, 0.25, 0.75],
  [0.75, -0.2, 1],
  [1.6, -0.35, 1.15],
  [2.45, 0, 0.9],
  [3.1, 0.3, 0.65],
  [1.5, 0.45, 0.85],
];
const CLOUDS = [
  { x: 0.02, y: 0.1, r: 22, speed: 5 },
  { x: 0.55, y: 0.27, r: 17, speed: 3.5 },
  { x: 0.95, y: 0.05, r: 13, speed: 7 },
];

export default function SkyCanvas({ scene, width: w, height: h }: SkyProps) {
  const reduce = useReducedMotion();
  const clock = useClock();
  const time = useDerivedValue(() => (reduce ? 0 : clock.value / 1000));

  // The sun rises a little when the screen opens.
  const rise = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce) rise.value = withTiming(1, { duration: 2600 });
  }, [reduce, rise]);

  const stars = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 34 }, () => ({ x: r() * w, y: r() * h * 0.55, r: 0.6 + r() * 1.1, p: r() * 6.28 }));
  }, [w, h]);
  const flies = useMemo(() => {
    const r = rng(19);
    return Array.from({ length: 22 }, () => ({
      x: 0.05 + r() * 0.9,
      y: 0.12 + r() * 0.8,
      r: 2 + r() * 2.2,
      a: 0.15 + r() * 0.25,
      b: 0.1 + r() * 0.2,
      blink: 0.6 + r() * 0.9,
      p: r() * 6.28,
    }));
  }, []);

  const sunY = useDerivedValue(() => h * 0.16 + (1 - rise.value) * 70);
  const sunC = useDerivedValue(() => vec(w * 0.78, sunY.value));
  const sunGlowR = useDerivedValue(() => 92 * (1 + 0.04 * Math.sin(time.value * 0.9)));

  const clouds = usePathValue((b) => {
    'worklet';
    if (scene !== 'morning') return;
    const t = time.value;
    for (let c = 0; c < CLOUDS.length; c++) {
      const cl = CLOUDS[c];
      const span = w * 1.6;
      const x0 = ((cl.x * w + t * cl.speed) % span) - w * 0.3;
      for (const [dx, dy, k] of CLOUD_PUFFS) b.addCircle(x0 + dx * cl.r, cl.y * h + dy * cl.r, cl.r * k);
    }
  });

  const starPath = usePathValue((b) => {
    'worklet';
    if (scene !== 'night') return;
    const t = time.value;
    for (const st of stars) b.addCircle(st.x, st.y, st.r * (0.7 + 0.3 * Math.sin(t * 1.1 + st.p)));
  });

  const fireflies = usePathValue((b) => {
    'worklet';
    if (scene !== 'night') return;
    const t = time.value;
    for (const f of flies) {
      const x = (f.x + 0.06 * Math.sin(t * f.a + f.p) + 0.03 * Math.sin(t * f.b * 2.3 + f.p * 2)) * w;
      const y = (f.y + 0.05 * Math.cos(t * f.b + f.p) + 0.02 * Math.sin(t * f.a * 1.7)) * h;
      const on = Math.max(0, Math.sin(t * f.blink + f.p));
      b.addCircle(x, y, f.r * (0.35 + 0.65 * on * on));
    }
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {scene === 'morning' && (
        <>
          <Rect x={0} y={0} width={w} height={h}>
            <LinearGradient start={vec(0, 0)} end={vec(0, h * 0.7)} colors={['#FFE4BA', '#FCEFD9', colors.bg]} />
          </Rect>
          <Circle c={sunC} r={sunGlowR}>
            <RadialGradient c={sunC} r={sunGlowR} colors={['rgba(255, 205, 120, 0.7)', 'rgba(255, 214, 140, 0)']} />
          </Circle>
          <Circle c={sunC} r={30} color="#FFC65C" />
          <Circle c={sunC} r={22} color="#FFD887" />
          <Path path={clouds} color="rgba(170, 204, 238, 0.85)">
            <BlurMask blur={5} style="normal" />
          </Path>
        </>
      )}
      {scene === 'day' && <Rect x={0} y={0} width={w} height={h} color={colors.bg} />}
      {scene === 'night' && (
        <>
          <Rect x={0} y={0} width={w} height={h}>
            <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#101827', '#1A283B', '#243749']} />
          </Rect>
          <Path path={starPath} color="rgba(255, 255, 240, 0.7)" />
          <Path path={fireflies} color="rgba(205, 255, 120, 0.5)">
            <BlurMask blur={9} style="normal" />
          </Path>
          <Path path={fireflies} color="#F1FFB8">
            <BlurMask blur={1.5} style="solid" />
          </Path>
        </>
      )}
    </Canvas>
  );
}
