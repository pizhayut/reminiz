// Five short questions for a family member, compared with 6 months ago. Team-written and NOT
// validated: they add context to the check-in and are reported separately from the RCI.
// Pure logic: no React Native imports.
import { FAMILY_YES_FOR_DOCTOR } from './config.ts';

export const FAMILY_ITEMS = ['repeats', 'misplaces', 'getsLost', 'moneyMedicine', 'moodChange'] as const;
export type FamilyItem = (typeof FAMILY_ITEMS)[number];
export type FamilyAnswer = 'yes' | 'no' | 'unsure';

export type FamilyReport = {
  id: string;
  /** Local day, YYYY-MM-DD. */
  date: string;
  answers: Record<FamilyItem, FamilyAnswer>;
};

export function familyYesCount(report: FamilyReport): number {
  return FAMILY_ITEMS.filter((k) => report.answers[k] === 'yes').length;
}

/** Two or more "yes" answers: suggest talking to a doctor (supporting information only). */
export function familySuggestsDoctor(report: FamilyReport | null | undefined): boolean {
  return !!report && familyYesCount(report) >= FAMILY_YES_FOR_DOCTOR;
}

export function latestFamilyReport(reports: readonly FamilyReport[]): FamilyReport | null {
  if (!reports.length) return null;
  return reports.slice().sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)))[
    reports.length - 1
  ];
}
