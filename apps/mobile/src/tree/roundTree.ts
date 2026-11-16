// "Round tree" (design C): a big round crown of overlapping circles in three greens (shadow,
// middle, highlight), a Y-forked trunk and line-art grass. Built once from a fixed seed so
// everyone sees the same tree; wind is applied per frame in TreeCanvas.
// All crown values are in units of the crown radius R.

export type Puff = { x: number; y: number; r: number; p: number };

export type RoundTree = {
  back: Puff[];
  mid: Puff[];
  front: Puff[];
  /** Flower spots on the crown, in the order flowers appear (Monday's first). Up to 7. */
  spots: [number, number][];
  /** Pollen by day, fireflies by night: drifting specks around the crown. */
  pollen: { x: number; y: number; r: number; speed: number; p: number }[];
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildRoundTree(seed = 5): RoundTree {
  const r = mulberry32(seed);
  const back: Puff[] = [];
  const mid: Puff[] = [];
  const front: Puff[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + r() * 0.3;
    back.push({ x: Math.cos(a) * 0.62 + 0.06, y: Math.sin(a) * 0.5 + 0.12, r: 0.42 + r() * 0.1, p: r() * 6 });
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + r() * 0.4;
    mid.push({ x: Math.cos(a) * 0.5, y: Math.sin(a) * 0.42, r: 0.38 + r() * 0.1, p: r() * 6 });
  }
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI * 0.75 + (k / 5) * Math.PI * 0.9;
    front.push({ x: Math.cos(a) * 0.38 - 0.06, y: Math.sin(a) * 0.32 - 0.06, r: 0.2 + r() * 0.06, p: r() * 6 });
  }
  // Spread out so each new flower lands away from the last.
  const spots: [number, number][] = [
    [-0.45, -0.25],
    [0.15, -0.5],
    [0.52, -0.05],
    [-0.15, 0.25],
    [0.32, 0.38],
    [-0.62, 0.18],
    [0.05, -0.08],
  ];
  const pollen = Array.from({ length: 12 }, () => ({
    x: -1.3 + r() * 2.6,
    y: r() * 3,
    r: 0.012 + r() * 0.02,
    speed: 0.04 + r() * 0.06,
    p: r() * 6,
  }));
  return { back, mid, front, spots, pollen };
}

/** Shared wind: a slow sway with gusts. Returns roughly -1..1. */
export function windAt(t: number): number {
  'worklet';
  const gust = 0.6 + 0.4 * Math.sin(t * 0.23) * Math.sin(t * 0.071 + 1.3);
  return (Math.sin(t * 1.1) * 0.7 + Math.sin(t * 2.3 + 1) * 0.3) * gust;
}
