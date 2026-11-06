// Full-screen backdrop for the home screen, following the time of day:
// morning = warm sunrise with soft blue clouds; day = clear blue sky, high sun with slow rays,
// white clouds and line-art birds; night = dark sky with stars and fireflies, fading to the
// same paper colour at the bottom as the other scenes (it is not a dark mode).
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
// Line-art birds gliding across the daytime sky, drawn like the logo's strokes.
const BIRDS = [
  // Kept between the greeting and the tree so they never cross the text.
  { x: 0.1, y: 0.295, size: 9, speed: 11, p: 0 },
  { x: 0.17, y: 0.315, size: 7, speed: 11, p: 1.4 },
  { x: 0.62, y: 0.335, size: 8, speed: 8, p: 2.6 },
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
    return Array.from({ length: 30 }, () => ({ x: r() * w, y: r() * h * 0.42, r: 0.6 + r() * 1.1, p: r() * 6.28 }));
  }, [w, h]);
  const flies = useMemo(() => {
    const r = rng(19);
    return Array.from({ length: 22 }, () => ({
      x: 0.05 + r() * 0.9,
      y: 0.1 + r() * 0.5, // stay in the dark part of the sky
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
    if (scene === 'night') return;
    const t = time.value;
    const big = scene === 'day' ? 1.35 : 1; // fuller fair-weather clouds at midday
    for (let c = 0; c < CLOUDS.length; c++) {
      const cl = CLOUDS[c];
      const r = cl.r * big;
      const span = w * 1.6;
      const x0 = ((cl.x * w + t * cl.speed) % span) - w * 0.3;
      for (const [dx, dy, k] of CLOUD_PUFFS) b.addCircle(x0 + dx * r, cl.y * h + dy * r, r * k);
    }
  });

  // Midday sun sits high in the corner; its rays turn very slowly and breathe.
  const daySunC = vec(w * 0.86, h * 0.03);
  const rays = usePathValue((b) => {
    'worklet';
    if (scene !== 'day') return;
    const t = time.value;
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + t * 0.04;
      const inner = 52;
      const outer = inner + 34 + 14 * Math.sin(t * 0.8 + k * 1.7);
      b.moveTo(daySunC.x + Math.cos(a) * inner, daySunC.y + Math.sin(a) * inner);
      b.lineTo(daySunC.x + Math.cos(a) * outer, daySunC.y + Math.sin(a) * outer);
    }
  });

  const birds = usePathValue((b) => {
    'worklet';
    if (scene !== 'day') return;
    const t = time.value;
    for (const bd of BIRDS) {
      const span = w * 1.5;
      const x = ((bd.x * w + t * bd.speed) % span) - w * 0.25;
      const y = bd.y * h + Math.sin(t * 0.5 + bd.p) * 4;
      const flap = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 3.2 + bd.p));
      const sz = bd.size;
      b.moveTo(x - sz, y);
      b.quadTo(x - sz * 0.5, y - sz * flap, x, y);
      b.quadTo(x + sz * 0.5, y - sz * flap, x + sz, y);
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
      {scene === 'day' && (
        <>
          <Rect x={0} y={0} width={w} height={h}>
            <LinearGradient start={vec(0, 0)} end={vec(0, h * 0.72)} colors={['#BFE0F5', '#E2F0F3', colors.bg]} />
          </Rect>
          <Circle c={daySunC} r={150}>
            <RadialGradient c={daySunC} r={150} colors={['rgba(255, 250, 220, 0.95)', 'rgba(255, 246, 205, 0)']} />
          </Circle>
          <Path path={rays} style="stroke" strokeWidth={3} strokeCap="round" color="rgba(255, 226, 140, 0.7)" />
          <Circle c={daySunC} r={40} color="#FFE07A" />
          <Circle c={daySunC} r={31} color="#FFF1B0" />
          {/* Cloud shadow, then the white cloud on top */}
          <Path path={clouds} color="rgba(160, 196, 225, 0.55)" transform={[{ translateY: 5 }]}>
            <BlurMask blur={5} style="normal" />
          </Path>
          <Path path={clouds} color="rgba(255, 255, 255, 0.95)">
            <BlurMask blur={2.5} style="normal" />
          </Path>
          <Path path={birds} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" color="#3F5D4B" />
        </>
      )}
      {scene === 'night' && (
        <>
          <Rect x={0} y={0} width={w} height={h}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, h * 0.8)}
              positions={[0, 0.35, 0.68, 1]}
              colors={['#121B2B', '#263852', '#8D9AB2', colors.bg]}
            />
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
