// Raw scores of the three check-in tasks and the combined z-score.
// Pure logic: no React Native imports, so `node --test` can load it.
import { TASK_NORMS } from './config.ts';
import type { FormId } from './forms.ts';

export type YesNo = 'yes' | 'no';

/** Answers to the four questions before the tasks. */
export type ContextAnswers = {
  sleptWell: YesNo;
  /** Unwell lately, or a change of medicine. */
  unwell: YesNo;
  /** Stressed or tired today. */
  stressed: YesNo;
  /** Somewhere quiet, glasses on if used. */
  ready: YesNo;
};

export type RawScores = {
  /** Symbol match: correct answers in 60 seconds. */
  symbol: number;
  /** Picture memory: hits − false alarms (−6 to 6). */
  memory: number;
  /** Go/no-go: share of trials answered right (0 to 1). */
  attention: number;
};

/** Extra detail kept for later analysis; the primary metric will be chosen from pilot data. */
export type TaskDetail = {
  symbolAttempted?: number;
  memoryHits?: number;
  memoryFalseAlarms?: number;
  attentionHits?: number;
  attentionCommissions?: number;
  attentionOmissions?: number;
  attentionMeanRtMs?: number | null;
  totalSeconds?: number;
};

export type CheckIn = {
  id: string;
  /** Local day, YYYY-MM-DD. */
  date: string;
  form: FormId;
  raw: RawScores;
  composite: number;
  context: ContextAnswers;
  detail?: TaskDetail;
};

export function zScores(raw: RawScores): RawScores {
  return {
    symbol: (raw.symbol - TASK_NORMS.symbol.mean) / TASK_NORMS.symbol.sd,
    memory: (raw.memory - TASK_NORMS.memory.mean) / TASK_NORMS.memory.sd,
    attention: (raw.attention - TASK_NORMS.attention.mean) / TASK_NORMS.attention.sd,
  };
}

/** Mean of the three task z-scores, rounded to 3 decimals. */
export function compositeScore(raw: RawScores): number {
  const z = zScores(raw);
  return Math.round(((z.symbol + z.memory + z.attention) / 3) * 1000) / 1000;
}

export function memoryScore(answers: { seen: boolean; saidSeen: boolean }[]) {
  const hits = answers.filter((a) => a.seen && a.saidSeen).length;
  const falseAlarms = answers.filter((a) => !a.seen && a.saidSeen).length;
  return { hits, falseAlarms, score: hits - falseAlarms };
}

export function attentionScore(responses: { go: boolean; tapped: boolean; rtMs?: number }[]) {
  const hits = responses.filter((r) => r.go && r.tapped);
  const commissions = responses.filter((r) => !r.go && r.tapped).length;
  const omissions = responses.filter((r) => r.go && !r.tapped).length;
  const correct = responses.length - commissions - omissions;
  const rts = hits.map((r) => r.rtMs).filter((v): v is number => typeof v === 'number');
  return {
    hits: hits.length,
    commissions,
    omissions,
    accuracy: responses.length ? Math.round((correct / responses.length) * 1000) / 1000 : 0,
    meanRtMs: rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null,
  };
}
