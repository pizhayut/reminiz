// Alternate forms A, B and C of the monthly check-in. Every form has the same difficulty and
// the same structure; only the pictures and symbol keys change, so a month-to-month change is
// not just memory of last month's answers. Sequences are fixed (seeded), not random per run.
// Pure data and logic only: no React Native imports, so `node --test` can load it.
import { TASK_SETTINGS } from './config.ts';

export type FormId = 'A' | 'B' | 'C';
export const FORM_IDS: readonly FormId[] = ['A', 'B', 'C'];

/** Forms rotate with each check-in: A, B, C, A, ... */
export function formFor(previousCheckIns: number): FormId {
  return FORM_IDS[((previousCheckIns % 3) + 3) % 3];
}

export type Picture = { id: string; emoji: string; en: string; th: string };
const p = (id: string, emoji: string, en: string, th: string): Picture => ({ id, emoji, en, th });

/** Shapes drawn with SVG (see components/Shape.tsx), not with font glyphs that can turn into emoji. */
export type ShapeId = 'circle' | 'triangle' | 'square' | 'star' | 'diamond' | 'cross' | 'heart' | 'moon' | 'drop';

// Small deterministic PRNG so every form shows the same sequence on every phone.
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

// ---------- Symbol match ----------

export type SymbolKey = { shape: ShapeId; digit: number }[];
export type SymbolForm = { key: SymbolKey; items: ShapeId[]; practice: ShapeId[] };

const SYMBOL_KEYS: Record<FormId, ShapeId[]> = {
  // Shape for digits 1..6.
  A: ['star', 'circle', 'triangle', 'heart', 'square', 'moon'],
  B: ['diamond', 'heart', 'circle', 'drop', 'star', 'cross'],
  C: ['moon', 'square', 'drop', 'triangle', 'cross', 'diamond'],
};
const SEEDS: Record<FormId, number> = { A: 1101, B: 2202, C: 3303 };

/** More items than anyone finishes in 60 seconds; no shape repeats twice in a row. */
const SYMBOL_ITEMS = 90;

function symbolSequence(shapes: ShapeId[], count: number, rand: () => number): ShapeId[] {
  const out: ShapeId[] = [];
  while (out.length < count) {
    for (const s of shuffle(shapes, rand)) {
      if (out.length && out[out.length - 1] === s) continue;
      out.push(s);
      if (out.length === count) break;
    }
  }
  return out;
}

export function symbolForm(form: FormId): SymbolForm {
  const shapes = SYMBOL_KEYS[form];
  const rand = seeded(SEEDS[form]);
  return {
    key: shapes.map((shape, i) => ({ shape, digit: i + 1 })),
    items: symbolSequence(shapes, SYMBOL_ITEMS, rand),
    practice: [shapes[2], shapes[0], shapes[4]],
  };
}

// ---------- Picture memory (delayed recognition) ----------

export type MemoryForm = { study: Picture[]; foils: Picture[]; recall: { picture: Picture; seen: boolean }[] };

const MEMORY: Record<FormId, { study: Picture[]; foils: Picture[] }> = {
  A: {
    study: [
      p('bicycle', '🚲', 'Bicycle', 'จักรยาน'),
      p('frog', '🐸', 'Frog', 'กบ'),
      p('guitar', '🎸', 'Guitar', 'กีตาร์'),
      p('donut', '🍩', 'Doughnut', 'โดนัท'),
      p('sailboat', '⛵', 'Sailboat', 'เรือใบ'),
      p('socks', '🧦', 'Socks', 'ถุงเท้า'),
    ],
    foils: [
      p('car', '🚗', 'Car', 'รถยนต์'),
      p('bee', '🐝', 'Bee', 'ผึ้ง'),
      p('trumpet', '🎺', 'Trumpet', 'แตร'),
      p('cookie', '🍪', 'Cookie', 'คุกกี้'),
      p('airplane', '✈️', 'Aeroplane', 'เครื่องบิน'),
      p('gloves', '🧤', 'Gloves', 'ถุงมือ'),
    ],
  },
  B: {
    study: [
      p('train', '🚂', 'Train', 'รถไฟ'),
      p('owl', '🦉', 'Owl', 'นกฮูก'),
      p('drum', '🥁', 'Drum', 'กลอง'),
      p('peach', '🍑', 'Peach', 'ลูกพีช'),
      p('balloon', '🎈', 'Balloon', 'ลูกโป่ง'),
      p('shoe', '👟', 'Shoe', 'รองเท้า'),
    ],
    foils: [
      p('bus', '🚌', 'Bus', 'รถเมล์'),
      p('penguin', '🐧', 'Penguin', 'เพนกวิน'),
      p('camera', '📷', 'Camera', 'กล้องถ่ายรูป'),
      p('tomato', '🍅', 'Tomato', 'มะเขือเทศ'),
      p('gift', '🎁', 'Gift', 'กล่องของขวัญ'),
      p('tophat', '🎩', 'Top hat', 'หมวกทรงสูง'),
    ],
  },
  C: {
    study: [
      p('scooter', '🛵', 'Scooter', 'มอเตอร์ไซค์'),
      p('crab', '🦀', 'Crab', 'ปู'),
      p('pencil', '✏️', 'Pencil', 'ดินสอ'),
      p('kiwi', '🥝', 'Kiwi fruit', 'กีวี'),
      p('teddy', '🧸', 'Teddy bear', 'ตุ๊กตาหมี'),
      p('candle', '🕯️', 'Candle', 'เทียน'),
    ],
    foils: [
      p('rocket', '🚀', 'Rocket', 'จรวด'),
      p('snail', '🐌', 'Snail', 'หอยทาก'),
      p('books', '📚', 'Books', 'กองหนังสือ'),
      p('eggplant', '🍆', 'Aubergine', 'มะเขือม่วง'),
      p('ribbon', '🎀', 'Ribbon', 'โบว์'),
      p('football', '⚽', 'Football', 'ลูกฟุตบอล'),
    ],
  },
};

/** Practice round: study two pictures, then answer straight away. Same for every form. */
export const MEMORY_PRACTICE = {
  study: [p('house', '🏠', 'House', 'บ้าน'), p('cactus', '🌵', 'Cactus', 'ต้นกระบองเพชร')],
  recall: [
    { picture: p('monkey', '🐒', 'Monkey', 'ลิง'), seen: false },
    { picture: p('house', '🏠', 'House', 'บ้าน'), seen: true },
    { picture: p('burger', '🍔', 'Burger', 'แฮมเบอร์เกอร์'), seen: false },
    { picture: p('cactus', '🌵', 'Cactus', 'ต้นกระบองเพชร'), seen: true },
  ],
};

export function memoryForm(form: FormId): MemoryForm {
  const { study, foils } = MEMORY[form];
  const rand = seeded(SEEDS[form] + 7);
  const recall = shuffle(
    [...study.map((picture) => ({ picture, seen: true })), ...foils.map((picture) => ({ picture, seen: false }))],
    rand,
  );
  return { study, foils, recall };
}

// ---------- Attention (go/no-go) ----------

export type AttentionTrial = { picture: Picture; go: boolean };
export type AttentionForm = { target: Picture; trials: AttentionTrial[]; practice: AttentionTrial[] };

const ATTENTION: Record<FormId, { target: Picture; others: Picture[] }> = {
  A: {
    target: p('fish', '🐟', 'Fish', 'ปลา'),
    others: [p('turtle', '🐢', 'Turtle', 'เต่า'), p('duck', '🦆', 'Duck', 'เป็ด'), p('rabbit', '🐇', 'Rabbit', 'กระต่าย')],
  },
  B: {
    target: p('sunflower', '🌻', 'Sunflower', 'ดอกทานตะวัน'),
    others: [p('tulip', '🌷', 'Tulip', 'ดอกทิวลิป'), p('rose', '🌹', 'Rose', 'ดอกกุหลาบ'), p('mushroom', '🍄', 'Mushroom', 'เห็ด')],
  },
  C: {
    target: p('bell', '🔔', 'Bell', 'กระดิ่ง'),
    others: [p('key', '🔑', 'Key', 'กุญแจ'), p('clock', '⏰', 'Alarm clock', 'นาฬิกาปลุก'), p('bulb', '💡', 'Light bulb', 'หลอดไฟ')],
  },
};

export function attentionForm(form: FormId): AttentionForm {
  const { target, others } = ATTENTION[form];
  const rand = seeded(SEEDS[form] + 13);
  const total = TASK_SETTINGS.attentionTrials;
  const goCount = Math.round(total * TASK_SETTINGS.attentionGoShare);
  // Shuffle until no more than two "do not tap" pictures come in a row and the first two are targets.
  let order: boolean[] = [];
  for (let attempt = 0; attempt < 200; attempt++) {
    order = shuffle([...Array(goCount).fill(true), ...Array(total - goCount).fill(false)], rand);
    const ok = order[0] && order[1] && !order.some((g, i) => i >= 2 && !g && !order[i - 1] && !order[i - 2]);
    if (ok) break;
  }
  let o = 0;
  const trials = order.map((go) => ({ go, picture: go ? target : others[o++ % others.length] }));
  const practice: AttentionTrial[] = [
    { go: true, picture: target },
    { go: false, picture: others[0] },
    { go: true, picture: target },
    { go: true, picture: target },
    { go: false, picture: others[1] },
    { go: true, picture: target },
  ];
  return { target, trials, practice };
}
