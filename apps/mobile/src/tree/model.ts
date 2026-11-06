// Procedural tree: a seeded recursive fractal, drawn as line art like the Reminiz logo.
// `buildTree` runs once on the JS thread. `poseTree` runs every frame on the UI thread
// (it is a worklet) and bends each branch with a layered, spring-like wind sway.

export type TreeModel = {
  n: number;
  parent: number[];
  depth: number[];
  angle: number[]; // radians, relative to the parent's direction; 0 = straight up
  len: number[]; // in tree units (whole tree is about 1 unit tall)
  bend: number[]; // sideways curve of the branch, fraction of its length
  phase: number[];
  maxDepth: number;
  // Leaves (teardrops) and curls (logo-like loops) hang off branch ends.
  leafNode: number[];
  /** Where along the branch the leaf sits (0 = start, 1 = tip). */
  leafT: number[];
  /** Soft canopy masses behind the line art, attached to mid-level branch ends. */
  blobNode: number[];
  blobSize: number[];
  leafAngle: number[];
  leafSize: number[];
  leafPhase: number[];
  curlNode: number[];
  curlSide: number[];
  curlSize: number[];
  /** Branch tips in the order flowers appear (spread around the crown). */
  flowerNode: number[];
  pollen: { x: number[]; y: number[]; r: number[]; speed: number[]; phase: number[] };
  flowerSize: number;
  blobBlur: number;
  blobColor: string;
  /** Rest-pose extent in tree units (x right, y up from the trunk base), leaves included. */
  bounds: { minX: number; maxX: number; maxY: number };
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

export const MAX_FLOWERS = 36;

/** Look of the tree. Kept small on purpose so older phones animate it smoothly. */
export type TreeStyle = {
  maxDepth: number;
  triChance: number; // chance a branch splits in three
  targetNodes: number; // preferred branch count when picking a seed
  leavesPerTip: number; // teardrop leaves at each twig end
  leafSize: [number, number];
  curlChance: number; // chance a twig end gets a logo-like curl
  curlSize: [number, number];
  blobDepths: number[]; // branch depths whose ends get a soft canopy cloud
  blobSize: [number, number];
  pollen: number;
  flowerSize: number;
  blobBlur: number; // blur radius, fraction of tree size
  blobColor: string;
  /** Branch spread (radians) at the first forks and further up. */
  spread: [number, number];
  lenRatio: [number, number];
};

export const TREE_STYLES = {
  // A: a few big leaves at the twig ends, clean line art.
  leaf: {
    maxDepth: 4,
    triChance: 0.3,
    targetNodes: 46,
    leavesPerTip: 2,
    leafSize: [0.075, 0.1],
    curlChance: 0,
    curlSize: [0, 0],
    blobDepths: [],
    blobSize: [0, 0],
    pollen: 8,
    flowerSize: 0.05,
    blobBlur: 0,
    blobColor: 'transparent',
    spread: [0.62, 0.5],
    lenRatio: [0.8, 0.9],
  },
  // B: soft watercolour clouds for the crown, no single leaves.
  cloud: {
    maxDepth: 4,
    triChance: 0.3,
    targetNodes: 46,
    leavesPerTip: 0,
    leafSize: [0, 0],
    curlChance: 0,
    curlSize: [0, 0],
    blobDepths: [3, 4],
    blobSize: [0.13, 0.18],
    pollen: 12,
    flowerSize: 0.05,
    blobBlur: 0.018,
    blobColor: 'rgba(188, 222, 176, 0.8)',
    spread: [0.62, 0.5],
    lenRatio: [0.8, 0.9],
  },
  // C: every twig ends in a loop, like the logo's line.
  loop: {
    maxDepth: 4,
    triChance: 0.25,
    targetNodes: 40,
    leavesPerTip: 0,
    leafSize: [0, 0],
    curlChance: 1,
    curlSize: [0.06, 0.085],
    blobDepths: [],
    blobSize: [0, 0],
    pollen: 8,
    flowerSize: 0.05,
    blobBlur: 0,
    blobColor: 'transparent',
    spread: [0.62, 0.5],
    lenRatio: [0.8, 0.9],
  },
} satisfies Record<string, TreeStyle>;

export type TreeStyleName = keyof typeof TREE_STYLES;

function buildOne(seed: number, style: TreeStyle): TreeModel {
  const rand = mulberry32(seed);
  const r = (lo: number, hi: number) => lo + (hi - lo) * rand();
  const maxDepth = style.maxDepth;
  const m: TreeModel = {
    n: 0,
    parent: [],
    depth: [],
    angle: [],
    len: [],
    bend: [],
    phase: [],
    maxDepth,
    leafNode: [],
    leafT: [],
    blobNode: [],
    blobSize: [],
    leafAngle: [],
    leafSize: [],
    leafPhase: [],
    curlNode: [],
    curlSide: [],
    curlSize: [],
    flowerNode: [],
    pollen: { x: [], y: [], r: [], speed: [], phase: [] },
    flowerSize: style.flowerSize,
    blobBlur: style.blobBlur,
    blobColor: style.blobColor,
    bounds: { minX: 0, maxX: 0, maxY: 0 },
  };
  const tips: { node: number; world: number; x: number; y: number }[] = [];

  const add = (parent: number, depth: number, angle: number, len: number, bend: number, phase: number) => {
    const i = m.n++;
    m.parent.push(parent);
    m.depth.push(depth);
    m.angle.push(angle);
    m.len.push(len);
    m.bend.push(bend);
    m.phase.push(phase);
    return i;
  };

  const grow = (parent: number, depth: number, world: number, x: number, y: number, len: number, phase: number) => {
    if (depth > maxDepth) return;
    const children = depth === 0 ? 2 : rand() < (depth <= 2 ? style.triChance : style.triChance / 2) ? 3 : 2;
    const spread = (depth <= 1 ? style.spread[0] : style.spread[1]) * r(0.85, 1.15);
    for (let k = 0; k < children; k++) {
      if (depth >= 3 && rand() < 0.08) continue; // prune a few for an organic outline
      const side = children === 3 ? k - 1 : k === 0 ? -1 : 1;
      let rel = side * spread * r(0.8, 1.15) + r(-0.08, 0.08);
      // Gentle pull back toward upright so the crown stays round, like the logo circle.
      rel += -world * 0.1;
      const childLen = len * r(style.lenRatio[0], style.lenRatio[1]) * (side === 0 ? 0.9 : 1);
      const w = world + rel;
      const nx = x + Math.sin(w) * childLen;
      const ny = y + Math.cos(w) * childLen;
      const i = add(parent, depth, rel, childLen, r(-0.22, 0.22), phase + r(0.25, 0.6));
      if (depth === maxDepth) tips.push({ node: i, world: w, x: nx, y: ny });
      grow(i, depth + 1, w, nx, ny, childLen, m.phase[i]);
    }
  };

  // Trunk, with a slight hand-drawn lean and curve.
  const trunkLen = 0.2;
  const trunk = add(-1, 0, r(-0.05, 0.05), trunkLen, r(-0.12, 0.12), 0);
  grow(trunk, 1, m.angle[trunk], Math.sin(m.angle[trunk]) * trunkLen, Math.cos(m.angle[trunk]) * trunkLen, trunkLen, 0);

  // Leaves and curls on the twig ends; soft clouds on chosen branch levels.
  for (let i = 0; i < m.n; i++) {
    if (m.depth[i] !== maxDepth) continue;
    for (let k = 0; k < style.leavesPerTip; k++) {
      m.leafNode.push(i);
      m.leafT.push(k === 0 ? 1 : r(0.55, 0.8));
      m.leafAngle.push((k === 0 ? -1 : 1) * r(0.3, 0.8));
      m.leafSize.push(r(style.leafSize[0], style.leafSize[1]));
      m.leafPhase.push(r(0, Math.PI * 2));
    }
    if (rand() < style.curlChance) {
      m.curlNode.push(i);
      m.curlSide.push(rand() < 0.5 ? -1 : 1);
      m.curlSize.push(r(style.curlSize[0], style.curlSize[1]));
    }
  }
  for (let i = 0; i < m.n; i++) {
    if (style.blobDepths.includes(m.depth[i])) {
      m.blobNode.push(i);
      m.blobSize.push(r(style.blobSize[0], style.blobSize[1]));
    }
  }

  // Flowers: farthest-point order over the tips, so each new flower lands far from the others
  // and the crown fills evenly as the weeks go by.
  if (tips.length) {
    const used = new Array(tips.length).fill(false);
    const top = tips.reduce((best, t, k) => (t.y > tips[best].y ? k : best), 0);
    const dist = tips.map(() => Infinity);
    let cur = top;
    for (let c = 0; c < Math.min(MAX_FLOWERS, tips.length); c++) {
      used[cur] = true;
      m.flowerNode.push(tips[cur].node);
      let next = -1;
      for (let k = 0; k < tips.length; k++) {
        if (used[k]) continue;
        const dx = tips[k].x - tips[cur].x;
        const dy = tips[k].y - tips[cur].y;
        dist[k] = Math.min(dist[k], dx * dx + dy * dy);
        if (next < 0 || dist[k] > dist[next]) next = k;
      }
      if (next < 0) break;
      cur = next;
    }
  }

  for (let k = 0; k < style.pollen; k++) {
    m.pollen.x.push(r(-0.6, 0.6));
    m.pollen.y.push(r(0, 1.2));
    m.pollen.r.push(r(0.004, 0.011));
    m.pollen.speed.push(r(0.012, 0.03));
    m.pollen.phase.push(r(0, Math.PI * 2));
  }

  const rest = poseTree(m, 0, 0, 0, 1);
  const pad = Math.max(0.07, style.leafSize[1], style.curlSize[1] * 1.2, style.flowerSize * 1.6, style.blobSize[1] + style.blobBlur * 2);
  let minX = 0;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < m.n; i++) {
    minX = Math.min(minX, rest.x1[i] - pad);
    maxX = Math.max(maxX, rest.x1[i] + pad);
    maxY = Math.max(maxY, -rest.y1[i] + pad);
  }
  m.bounds = { minX, maxX, maxY };

  return m;
}

/**
 * Pick the most balanced tree among a few seeds: a round crown (like the logo circle),
 * centred over the trunk. Deterministic, so everyone gets the same tree.
 */
export function buildTree(name: TreeStyleName = 'cloud'): TreeModel {
  const style: TreeStyle = TREE_STYLES[name];
  let best: TreeModel | null = null;
  let bestScore = Infinity;
  for (let seed = 1; seed <= 60; seed++) {
    const m = buildOne(seed, style);
    const { minX, maxX, maxY } = m.bounds;
    const w = maxX - minX;
    const centre = Math.abs((maxX + minX) / 2) / w;
    const aspect = Math.abs(w / maxY - 0.92);
    const score = centre * 4 + aspect * 0.6 + Math.abs(m.n - style.targetNodes) / 40;
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best!;
}

export type Pose = {
  // Canvas coordinates for each branch: start, curve control, end; plus world angle.
  x0: number[];
  y0: number[];
  cx: number[];
  cy: number[];
  x1: number[];
  y1: number[];
  world: number[];
  t: number;
};

/** Place every branch for time `t` (seconds). `ox, oy` is the trunk base; `s` is pixels per tree unit. */
export function poseTree(m: TreeModel, t: number, ox: number, oy: number, s: number): Pose {
  'worklet';
  const x0: number[] = new Array(m.n);
  const y0: number[] = new Array(m.n);
  const cx: number[] = new Array(m.n);
  const cy: number[] = new Array(m.n);
  const x1: number[] = new Array(m.n);
  const y1: number[] = new Array(m.n);
  const world: number[] = new Array(m.n);
  // Slow gusts: two incommensurate waves so the breeze never repeats exactly.
  const gust = 0.55 + 0.45 * Math.sin(t * 0.23) * Math.sin(t * 0.071 + 1.3);
  for (let i = 0; i < m.n; i++) {
    const p = m.parent[i];
    const d = m.depth[i];
    // Sway grows toward the twigs; phase lag up the tree reads as a springy wave.
    const amp = 0.006 + 0.011 * Math.pow(d, 1.25) * gust;
    const sway = amp * (Math.sin(t * 1.25 - m.phase[i] * 1.6) + 0.35 * Math.sin(t * 2.9 + m.phase[i] * 2.3));
    const w = (p >= 0 ? world[p] : 0) + m.angle[i] + sway + (d === 0 ? 0.012 * gust * Math.sin(t * 0.6) : 0);
    const sx = p >= 0 ? x1[p] : ox;
    const sy = p >= 0 ? y1[p] : oy;
    const L = m.len[i] * s;
    const ex = sx + Math.sin(w) * L;
    const ey = sy - Math.cos(w) * L;
    const b = m.bend[i] * L;
    x0[i] = sx;
    y0[i] = sy;
    cx[i] = (sx + ex) / 2 + Math.cos(w) * b;
    cy[i] = (sy + ey) / 2 + Math.sin(w) * b;
    x1[i] = ex;
    y1[i] = ey;
    world[i] = w;
  }
  return { x0, y0, cx, cy, x1, y1, world, t };
}
