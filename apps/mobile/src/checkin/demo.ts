// Synthetic demo data for the Future Health Challenge judges. NOT real people.
// Six monthly check-ins: the first four are steady, then two lower ones in a row, so the
// demo walks through every status: building the usual range → stable → repeat → see a doctor.
// Two family question sets (6 months ago: all "no"; latest: 2 "yes"), and play days so the
// tree has flowers this week. Pure logic: no React Native imports.
import type { FamilyReport } from './family.ts';
import { formFor } from './forms.ts';
import { compositeScore, type CheckIn, type ContextAnswers, type RawScores } from './scoring.ts';

function day(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() + n);
  return out;
}

const fine: ContextAnswers = { sleptWell: 'yes', unwell: 'no', stressed: 'no', ready: 'yes' };

/** Raw scores, oldest first. The combined scores come out as about 0.06, 0.36, 0.11, 0.17, −0.78, −1.19. */
const MONTHS: { raw: RawScores; context?: Partial<ContextAnswers>; rt: number }[] = [
  { raw: { symbol: 25, memory: 4, attention: 0.9 }, rt: 512 },
  { raw: { symbol: 24, memory: 5, attention: 0.925 }, rt: 498 },
  { raw: { symbol: 26, memory: 4, attention: 0.9 }, context: { stressed: 'yes' }, rt: 505 },
  { raw: { symbol: 23, memory: 5, attention: 0.9 }, rt: 509 },
  { raw: { symbol: 19, memory: 3, attention: 0.85 }, rt: 561 },
  { raw: { symbol: 18, memory: 2, attention: 0.825 }, rt: 588 },
];

export type DemoData = { checkIns: CheckIn[]; familyReports: FamilyReport[]; playDays: string[] };

export function makeDemoData(today: Date = new Date()): DemoData {
  const latest = addDays(today, -3);
  const checkIns: CheckIn[] = MONTHS.map((m, i) => {
    const monthsAgo = MONTHS.length - 1 - i;
    const date = new Date(latest.getFullYear(), latest.getMonth() - monthsAgo, Math.min(latest.getDate(), 28));
    const attentionHits = Math.round(m.raw.attention * 40) - 9;
    return {
      id: `demo-${i + 1}`,
      date: day(date),
      form: formFor(i),
      raw: m.raw,
      composite: compositeScore(m.raw),
      context: { ...fine, ...m.context },
      detail: {
        symbolAttempted: m.raw.symbol + 1,
        memoryHits: Math.min(6, m.raw.memory + 1),
        memoryFalseAlarms: Math.min(6, m.raw.memory + 1) - m.raw.memory,
        attentionHits,
        attentionCommissions: 10 - (Math.round(m.raw.attention * 40) - attentionHits),
        attentionOmissions: 30 - attentionHits,
        attentionMeanRtMs: m.rt,
        totalSeconds: 290 + i * 7,
      },
    };
  });

  const familyReports: FamilyReport[] = [
    {
      id: 'demo-family-1',
      date: checkIns[0].date,
      answers: { repeats: 'no', misplaces: 'no', getsLost: 'no', moneyMedicine: 'no', moodChange: 'no' },
    },
    {
      id: 'demo-family-2',
      date: checkIns[checkIns.length - 1].date,
      answers: { repeats: 'yes', misplaces: 'yes', getsLost: 'no', moneyMedicine: 'unsure', moodChange: 'no' },
    },
  ];

  // About 4 play days a week for 6 months, and every day this week up to yesterday, so the
  // tree has flowers and today's flower is still there to earn.
  const playDays: string[] = [];
  const mondayOffset = (today.getDay() + 6) % 7;
  for (let back = 182; back >= 1; back--) {
    const d = addDays(today, -back);
    const thisWeek = back <= mondayOffset;
    const lastWeek = back <= mondayOffset + 7;
    if (thisWeek || (lastWeek && d.getDay() % 2 === 1) || (!lastWeek && [1, 2, 4, 6].includes(d.getDay()))) {
      playDays.push(day(d));
    }
  }

  return { checkIns, familyReports, playDays };
}

