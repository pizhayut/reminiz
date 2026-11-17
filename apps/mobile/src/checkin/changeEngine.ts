// Change Engine: compares each monthly check-in with the person's own baseline.
// Pure function, no React Native imports (tested with `node --test`). All numbers live in
// config.ts and are provisional until calibrated with healthy older Thai adults.
//
// Rules (doctor-approved wording; never a diagnosis):
// - Baseline = mean combined score of the first RCI_CONFIG.baselineCount check-ins.
// - Each later check-in gets a Reliable Change Index (Jacobson & Truax, 1991):
//     SEM   = SD × √(1 − r)
//     Sdiff = √(2 × SEM²)
//     RCI   = (score − baseline − practiceEffect) / Sdiff
// - RCI below the threshold (−1.645) = a decline. The first decline only asks to repeat the
//   check-in in 1–2 weeks. Two declines in a row = suggest talking to a doctor.
// - If the person said they slept badly or were unwell (or changed medicines), that check-in
//   is flagged as possibly affected, does not count as a decline, and a repeat is suggested.
import { RCI_CONFIG } from './config.ts';
import type { CheckIn } from './scoring.ts';

export type Status =
  /** Not enough check-ins yet to know the person's usual range. */
  | 'baseline'
  | 'stable'
  /** Repeat the check-in in 1–2 weeks (a first decline, or a result that may be affected). */
  | 'repeat'
  /** Two declines in a row: suggest talking to a doctor. */
  | 'seeDoctor';

export type CheckInResult = {
  id: string;
  date: string;
  composite: number;
  /** null while the baseline is being built. */
  rci: number | null;
  declined: boolean;
  /** Slept badly or unwell / changed medicines: this result may not reflect the usual day. */
  mayBeAffected: boolean;
  /** Declines in a row up to and including this check-in. */
  declineStreak: number;
  status: Status;
};

export type EngineSummary = {
  baseline: number | null;
  /** Combined-score drop that counts as a reliable decline (baseline + this = the line). */
  declineLine: number | null;
  results: CheckInResult[];
  status: Status;
  latest: CheckInResult | null;
};

export type RciParams = {
  compositeSd: number;
  testRetestR: number;
  practiceEffect: number;
  declineThreshold: number;
  baselineCount: number;
  declinesForDoctor: number;
};

/** Standard error of the difference between two scores (Jacobson & Truax). */
export function sDiff(params: Pick<RciParams, 'compositeSd' | 'testRetestR'> = RCI_CONFIG): number {
  const sem = params.compositeSd * Math.sqrt(1 - params.testRetestR);
  return Math.sqrt(2 * sem * sem);
}

export function reliableChangeIndex(
  score: number,
  baseline: number,
  params: Pick<RciParams, 'compositeSd' | 'testRetestR' | 'practiceEffect'> = RCI_CONFIG,
): number {
  return (score - baseline - params.practiceEffect) / sDiff(params);
}

export function mayBeAffected(context: CheckIn['context'] | undefined): boolean {
  if (!context) return false;
  return context.sleptWell === 'no' || context.unwell === 'yes';
}

const round = (v: number, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

export function runChangeEngine(checkIns: readonly CheckIn[], params: RciParams = RCI_CONFIG): EngineSummary {
  const sorted = checkIns.slice().sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));
  const n = params.baselineCount;
  const baseline =
    sorted.length >= n ? round(sorted.slice(0, n).reduce((sum, c) => sum + c.composite, 0) / n) : null;

  let streak = 0;
  const results: CheckInResult[] = sorted.map((c, i) => {
    const affected = mayBeAffected(c.context);
    if (baseline === null || i < n) {
      return {
        id: c.id,
        date: c.date,
        composite: c.composite,
        rci: null,
        declined: false,
        mayBeAffected: affected,
        declineStreak: 0,
        status: 'baseline',
      };
    }
    const rci = round(reliableChangeIndex(c.composite, baseline, params), 2);
    const declined = rci < params.declineThreshold;
    let status: Status;
    if (affected) {
      // Neither counts as a decline nor breaks a run of declines: it is set aside.
      status = 'repeat';
    } else if (declined) {
      streak += 1;
      status = streak >= params.declinesForDoctor ? 'seeDoctor' : 'repeat';
    } else {
      streak = 0;
      status = 'stable';
    }
    return {
      id: c.id,
      date: c.date,
      composite: c.composite,
      rci,
      declined,
      mayBeAffected: affected,
      declineStreak: streak,
      status,
    };
  });

  const latest = results.length ? results[results.length - 1] : null;
  return {
    baseline,
    declineLine: baseline === null ? null : round(baseline + params.practiceEffect + params.declineThreshold * sDiff(params)),
    results,
    status: latest ? latest.status : 'baseline',
    latest,
  };
}
