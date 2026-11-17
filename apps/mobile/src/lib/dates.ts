// Short, readable dates without depending on Intl data being present on every phone.
import type { Language } from '@/i18n';

const MONTHS: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
};

function parts(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return { y, m, d };
}

/** "Jun" / "มิ.ย." */
export function monthShort(day: string, lang: Language): string {
  return MONTHS[lang][parts(day).m - 1] ?? '';
}

/** "14 Jun 2026" / "14 มิ.ย. 2569" (Thai uses the Buddhist year). */
export function formatDay(day: string, lang: Language): string {
  const { y, m, d } = parts(day);
  return `${d} ${MONTHS[lang][m - 1]} ${lang === 'th' ? y + 543 : y}`;
}
