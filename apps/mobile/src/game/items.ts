// Familiar pictures drawn with the phone's own emoji font (no image assets, no licences).
// Only emoji from Unicode 11 or earlier, so older Android phones show them too.
import type { Language } from '@/i18n';

export type Category = 'fruit' | 'animal' | 'home' | 'food' | 'nature';
export type Item = { id: string; emoji: string; category: Category; name: Record<Language, string> };

const i = (id: string, emoji: string, category: Category, en: string, th: string): Item => ({
  id,
  emoji,
  category,
  name: { en, th },
});

export const ITEMS: readonly Item[] = [
  i('banana', '🍌', 'fruit', 'Banana', 'กล้วย'),
  i('mango', '🥭', 'fruit', 'Mango', 'มะม่วง'),
  i('watermelon', '🍉', 'fruit', 'Watermelon', 'แตงโม'),
  i('pineapple', '🍍', 'fruit', 'Pineapple', 'สับปะรด'),
  i('grapes', '🍇', 'fruit', 'Grapes', 'องุ่น'),
  i('orange', '🍊', 'fruit', 'Orange', 'ส้ม'),
  i('apple', '🍎', 'fruit', 'Apple', 'แอปเปิล'),
  i('coconut', '🥥', 'fruit', 'Coconut', 'มะพร้าว'),
  i('strawberry', '🍓', 'fruit', 'Strawberry', 'สตรอว์เบอร์รี'),
  i('cherries', '🍒', 'fruit', 'Cherries', 'เชอร์รี'),
  i('lemon', '🍋', 'fruit', 'Lemon', 'มะนาว'),
  i('pear', '🍐', 'fruit', 'Pear', 'สาลี่'),

  i('cat', '🐈', 'animal', 'Cat', 'แมว'),
  i('dog', '🐕', 'animal', 'Dog', 'สุนัข'),
  i('elephant', '🐘', 'animal', 'Elephant', 'ช้าง'),
  i('chicken', '🐓', 'animal', 'Rooster', 'ไก่'),
  i('fish', '🐟', 'animal', 'Fish', 'ปลา'),
  i('duck', '🦆', 'animal', 'Duck', 'เป็ด'),
  i('buffalo', '🐃', 'animal', 'Buffalo', 'ควาย'),
  i('pig', '🐖', 'animal', 'Pig', 'หมู'),
  i('turtle', '🐢', 'animal', 'Turtle', 'เต่า'),
  i('butterfly', '🦋', 'animal', 'Butterfly', 'ผีเสื้อ'),
  i('rabbit', '🐇', 'animal', 'Rabbit', 'กระต่าย'),
  i('horse', '🐎', 'animal', 'Horse', 'ม้า'),

  i('umbrella', '☂️', 'home', 'Umbrella', 'ร่ม'),
  i('key', '🔑', 'home', 'Key', 'กุญแจ'),
  i('glasses', '👓', 'home', 'Glasses', 'แว่นตา'),
  i('clock', '⏰', 'home', 'Alarm clock', 'นาฬิกาปลุก'),
  i('scissors', '✂️', 'home', 'Scissors', 'กรรไกร'),
  i('lamp', '💡', 'home', 'Light bulb', 'หลอดไฟ'),
  i('phone', '☎️', 'home', 'Telephone', 'โทรศัพท์'),
  i('book', '📖', 'home', 'Book', 'หนังสือ'),
  i('couch', '🛋️', 'home', 'Sofa', 'โซฟา'),
  i('bell', '🔔', 'home', 'Bell', 'กระดิ่ง'),
  i('hat', '👒', 'home', 'Hat', 'หมวก'),
  i('basket', '🧺', 'home', 'Basket', 'ตะกร้า'),

  i('rice', '🍚', 'food', 'Rice', 'ข้าวสวย'),
  i('noodles', '🍜', 'food', 'Noodle soup', 'ก๋วยเตี๋ยว'),
  i('egg', '🍳', 'food', 'Fried egg', 'ไข่ดาว'),
  i('bread', '🍞', 'food', 'Bread', 'ขนมปัง'),
  i('corn', '🌽', 'food', 'Corn', 'ข้าวโพด'),
  i('chili', '🌶️', 'food', 'Chili', 'พริก'),
  i('carrot', '🥕', 'food', 'Carrot', 'แครอท'),
  i('cake', '🎂', 'food', 'Cake', 'เค้ก'),
  i('tea', '🍵', 'food', 'Tea', 'ชา'),
  i('milk', '🥛', 'food', 'Milk', 'นม'),
  i('dumpling', '🥟', 'food', 'Dumpling', 'เกี๊ยว'),
  i('icecream', '🍦', 'food', 'Ice cream', 'ไอศกรีม'),

  i('sun', '☀️', 'nature', 'Sun', 'ดวงอาทิตย์'),
  i('moon', '🌙', 'nature', 'Moon', 'พระจันทร์'),
  i('star', '⭐', 'nature', 'Star', 'ดาว'),
  i('rainbow', '🌈', 'nature', 'Rainbow', 'รุ้ง'),
  i('cloud', '☁️', 'nature', 'Cloud', 'เมฆ'),
  i('tulip', '🌷', 'nature', 'Tulip', 'ดอกทิวลิป'),
  i('sunflower', '🌻', 'nature', 'Sunflower', 'ดอกทานตะวัน'),
  i('tree', '🌳', 'nature', 'Tree', 'ต้นไม้'),
  i('palm', '🌴', 'nature', 'Palm tree', 'ต้นมะพร้าว'),
  i('mushroom', '🍄', 'nature', 'Mushroom', 'เห็ด'),
  i('leaf', '🍁', 'nature', 'Maple leaf', 'ใบเมเปิล'),
  i('rose', '🌹', 'nature', 'Rose', 'ดอกกุหลาบ'),
];

function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

export type Trial = { target: Item; options: Item[] };

/** Pictures for one round; none repeats within the round. */
export function pickTargets(count: number, rand: () => number = Math.random): Item[] {
  return shuffle(ITEMS, rand).slice(0, count);
}

/**
 * Distractors come from the target's category when `sameCategory` is set (harder),
 * otherwise from other categories (easier).
 */
export function makeTrial(
  target: Item,
  { options, sameCategory }: { options: number; sameCategory: boolean },
  rand: () => number = Math.random,
): Trial {
  const pool = ITEMS.filter(
    (it) => it.id !== target.id && (sameCategory ? it.category === target.category : it.category !== target.category),
  );
  const distractors = shuffle(pool, rand).slice(0, options - 1);
  return { target, options: shuffle([target, ...distractors], rand) };
}
