// Numbers the monthly check-in and the Change Engine depend on. Kept here, not in code,
// so they can be recalibrated without touching the logic.
//
// PROVISIONAL VALUES — awaiting calibration with healthy older Thai adults who repeat the
// Reminiz check-in at least twice (planned for MVP2). Until then these are educated guesses
// and every result is a signal to look closer, never a diagnosis.
// ค่าชั่วคราว รอ calibrate กับผู้สูงอายุไทยสุขภาพดี

/**
 * Typical score and spread of each task in healthy older adults, used to turn raw scores
 * into z-scores before averaging them into one combined score.
 * Provisional (ค่าชั่วคราว รอ calibrate กับผู้สูงอายุไทยสุขภาพดี).
 */
export const TASK_NORMS = {
  /** Symbol match: correct answers in 60 seconds. */
  symbol: { mean: 24, sd: 6 },
  /** Picture memory: hits minus false alarms, from −6 to 6. */
  memory: { mean: 4, sd: 1.5 },
  /** Attention go/no-go: share of the 40 trials answered right, 0 to 1. */
  attention: { mean: 0.9, sd: 0.06 },
} as const;

/**
 * Reliable Change Index (Jacobson & Truax, 1991) of the combined score.
 * Provisional (ค่าชั่วคราว รอ calibrate กับผู้สูงอายุไทยสุขภาพดี).
 */
export const RCI_CONFIG = {
  /** Between-person SD of the combined z-score at baseline. */
  compositeSd: 0.8,
  /** Test-retest reliability of the combined z-score (one month apart). */
  testRetestR: 0.8,
  /**
   * Expected gain from simply having done the check-in before, subtracted from each change.
   * 0 = the classic Jacobson & Truax formula; set from repeat data once it exists.
   */
  practiceEffect: 0,
  /** One-sided 95%: a change below this counts as a decline. */
  declineThreshold: -1.645,
  /** How many check-ins are averaged into the person's own baseline. */
  baselineCount: 2,
  /** Consecutive declines that lead to "talk to a doctor". */
  declinesForDoctor: 2,
} as const;

/** Family questions: this many "yes" answers suggests talking to a doctor (team-written, not validated). */
export const FAMILY_YES_FOR_DOCTOR = 2;

/** Check-in task settings. Difficulty is fixed: the same for everyone, every month. */
export const TASK_SETTINGS = {
  symbolSeconds: 60,
  attentionTrials: 40,
  attentionGoShare: 0.75,
  /** Picture on screen in go/no-go, then a blank gap; a tap counts until the next picture. */
  attentionStimulusMs: 900,
  attentionGapMs: 600,
  /** Each picture to remember stays on screen this long. */
  memoryStudyMs: 3000,
} as const;
