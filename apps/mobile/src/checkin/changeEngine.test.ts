/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { reliableChangeIndex, runChangeEngine, sDiff, type RciParams } from './changeEngine.ts';
import { RCI_CONFIG } from './config.ts';
import { attentionScore, compositeScore, memoryScore, type CheckIn, type ContextAnswers } from './scoring.ts';
import { makeDemoData } from './demo.ts';
import { familySuggestsDoctor, latestFamilyReport } from './family.ts';
import { attentionForm, formFor, memoryForm, symbolForm } from './forms.ts';

const fine: ContextAnswers = { sleptWell: 'yes', unwell: 'no', stressed: 'no', ready: 'yes' };

function checkIn(month: number, composite: number, context: Partial<ContextAnswers> = {}): CheckIn {
  return {
    id: `c${month}`,
    date: `2026-${String(month).padStart(2, '0')}-10`,
    form: formFor(month - 1),
    raw: { symbol: 0, memory: 0, attention: 0 },
    composite,
    context: { ...fine, ...context },
  };
}

// Simple numbers for hand-checked maths: SD 1, r 0.5 → SEM √0.5, Sdiff 1.
const simple: RciParams = { ...RCI_CONFIG, compositeSd: 1, testRetestR: 0.5, practiceEffect: 0 };

describe('Jacobson & Truax RCI', () => {
  test('Sdiff = √2 × SD × √(1 − r)', () => {
    assert.equal(sDiff(simple), 1);
    assert.ok(Math.abs(sDiff({ compositeSd: 0.8, testRetestR: 0.8 }) - Math.SQRT2 * 0.8 * Math.sqrt(0.2)) < 1e-12);
  });

  test('RCI is the change divided by Sdiff, minus the practice effect', () => {
    assert.equal(reliableChangeIndex(-2, 0, simple), -2);
    assert.equal(reliableChangeIndex(0.5, 0, { ...simple, practiceEffect: 0.5 }), 0);
  });
});

describe('runChangeEngine', () => {
  test('no check-ins: building baseline', () => {
    const r = runChangeEngine([], simple);
    assert.equal(r.status, 'baseline');
    assert.equal(r.baseline, null);
    assert.equal(r.latest, null);
  });

  test('baseline is the mean of the first two check-ins', () => {
    const r = runChangeEngine([checkIn(1, 0.2), checkIn(2, 0.4)], simple);
    assert.equal(r.baseline, 0.3);
    assert.equal(r.status, 'baseline');
    assert.deepEqual(
      r.results.map((x) => x.rci),
      [null, null],
    );
  });

  test('a small dip stays stable', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, -1.6)], simple);
    assert.equal(r.latest?.rci, -1.6);
    assert.equal(r.status, 'stable');
  });

  test('first decline below −1.645 asks to repeat, not to see a doctor', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, -1.7)], simple);
    assert.equal(r.latest?.declined, true);
    assert.equal(r.status, 'repeat');
  });

  test('two declines in a row suggest talking to a doctor', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, -1.7), checkIn(4, -2)], simple);
    assert.deepEqual(
      r.results.map((x) => x.status),
      ['baseline', 'baseline', 'repeat', 'seeDoctor'],
    );
    assert.equal(r.latest?.declineStreak, 2);
  });

  test('a recovery in between resets the run of declines', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, -1.7), checkIn(4, 0), checkIn(5, -1.8)], simple);
    assert.deepEqual(
      r.results.map((x) => x.status),
      ['baseline', 'baseline', 'repeat', 'stable', 'repeat'],
    );
  });

  test('poor sleep flags the result and asks to repeat, even when the score looks fine', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, 0.1, { sleptWell: 'no' })], simple);
    assert.equal(r.latest?.mayBeAffected, true);
    assert.equal(r.status, 'repeat');
  });

  test('being unwell or a medicine change is never counted as a decline', () => {
    const r = runChangeEngine(
      [checkIn(1, 0), checkIn(2, 0), checkIn(3, -1.7), checkIn(4, -2.5, { unwell: 'yes' })],
      simple,
    );
    assert.equal(r.latest?.mayBeAffected, true);
    assert.equal(r.status, 'repeat');
    // The flagged month is set aside: the next clean decline is the second in the run.
    const next = runChangeEngine(
      [checkIn(1, 0), checkIn(2, 0), checkIn(3, -1.7), checkIn(4, -2.5, { unwell: 'yes' }), checkIn(5, -1.9)],
      simple,
    );
    assert.equal(next.status, 'seeDoctor');
  });

  test('stress alone does not flag the result', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, 0, { stressed: 'yes' })], simple);
    assert.equal(r.latest?.mayBeAffected, false);
    assert.equal(r.status, 'stable');
  });

  test('order is by date, whatever order they were saved in', () => {
    const r = runChangeEngine([checkIn(4, -2), checkIn(1, 0), checkIn(3, -1.7), checkIn(2, 0)], simple);
    assert.equal(r.status, 'seeDoctor');
  });

  test('decline line sits 1.645 Sdiff below the baseline', () => {
    const r = runChangeEngine([checkIn(1, 1), checkIn(2, 1)], simple);
    assert.equal(r.declineLine, -0.645);
  });

  test('with the provisional config, a drop of about 0.83 is needed', () => {
    const r = runChangeEngine([checkIn(1, 0), checkIn(2, 0), checkIn(3, -0.8), checkIn(4, -0.9)]);
    assert.deepEqual(
      r.results.map((x) => x.status),
      ['baseline', 'baseline', 'stable', 'repeat'],
    );
  });
});

describe('scoring', () => {
  test('memory score is hits minus false alarms', () => {
    const s = memoryScore([
      { seen: true, saidSeen: true },
      { seen: true, saidSeen: false },
      { seen: false, saidSeen: true },
      { seen: false, saidSeen: false },
      { seen: true, saidSeen: true },
    ]);
    assert.deepEqual(s, { hits: 2, falseAlarms: 1, score: 1 });
  });

  test('attention accuracy counts taps on targets and no taps on others', () => {
    const s = attentionScore([
      { go: true, tapped: true, rtMs: 400 },
      { go: true, tapped: false },
      { go: false, tapped: true, rtMs: 300 },
      { go: false, tapped: false },
    ]);
    assert.equal(s.accuracy, 0.5);
    assert.equal(s.commissions, 1);
    assert.equal(s.omissions, 1);
    assert.equal(s.meanRtMs, 400);
  });

  test('typical scores give a combined score near 0', () => {
    assert.equal(compositeScore({ symbol: 24, memory: 4, attention: 0.9 }), 0);
    assert.ok(compositeScore({ symbol: 18, memory: 2.5, attention: 0.84 }) < -0.9);
  });
});

describe('alternate forms', () => {
  test('forms rotate A, B, C', () => {
    assert.deepEqual([0, 1, 2, 3, 4].map(formFor), ['A', 'B', 'C', 'A', 'B']);
  });

  test('every form has the same structure', () => {
    for (const f of ['A', 'B', 'C'] as const) {
      const sym = symbolForm(f);
      assert.equal(sym.key.length, 6);
      assert.ok(sym.items.every((s, i) => i === 0 || s !== sym.items[i - 1]), 'no symbol twice in a row');
      const mem = memoryForm(f);
      assert.equal(mem.study.length, 6);
      assert.equal(mem.recall.length, 12);
      assert.equal(mem.recall.filter((r) => r.seen).length, 6);
      const att = attentionForm(f);
      assert.equal(att.trials.length, 40);
      assert.equal(att.trials.filter((t) => t.go).length, 30);
      assert.ok(att.trials[0].go && att.trials[1].go);
    }
  });

  test('forms are fixed: the same sequence every time', () => {
    assert.deepEqual(symbolForm('B').items, symbolForm('B').items);
    assert.deepEqual(attentionForm('C').trials, attentionForm('C').trials);
  });

  test('no picture is shared between forms or between memory and attention', () => {
    const ids: string[] = [];
    for (const f of ['A', 'B', 'C'] as const) {
      const mem = memoryForm(f);
      const att = attentionForm(f);
      ids.push(...mem.study.map((p) => p.id), ...mem.foils.map((p) => p.id), att.target.id);
    }
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('demo data', () => {
  test('walks through every status and ends on "see a doctor"', () => {
    for (const today of [new Date(2026, 10, 17), new Date(2026, 0, 5), new Date(2027, 2, 31)]) {
      const demo = makeDemoData(today);
      assert.deepEqual(
        runChangeEngine(demo.checkIns).results.map((r) => r.status),
        ['baseline', 'baseline', 'stable', 'stable', 'repeat', 'seeDoctor'],
      );
      assert.equal(familySuggestsDoctor(latestFamilyReport(demo.familyReports)), true);
    }
  });

  test('check-in dates are a month apart and in order', () => {
    const dates = makeDemoData(new Date(2026, 2, 31)).checkIns.map((c) => c.date);
    assert.deepEqual(dates, dates.slice().sort());
    assert.equal(new Set(dates.map((d) => d.slice(0, 7))).size, 6);
  });

  test('leaves today unplayed so the judge can earn today\'s flower', () => {
    const today = new Date(2026, 10, 19); // a Thursday
    const days = makeDemoData(today).playDays;
    assert.ok(!days.includes('2026-11-19'));
    for (const d of ['2026-11-16', '2026-11-17', '2026-11-18']) assert.ok(days.includes(d));
  });
});

describe('family questions', () => {
  const report = (yes: number, unsure = 0) => {
    const keys = ['repeats', 'misplaces', 'getsLost', 'moneyMedicine', 'moodChange'] as const;
    const answers = Object.fromEntries(
      keys.map((k, i) => [k, i < yes ? 'yes' : i < yes + unsure ? 'unsure' : 'no']),
    ) as Record<(typeof keys)[number], 'yes' | 'no' | 'unsure'>;
    return { id: 'f', date: '2026-11-01', answers };
  };
  test('two or more "yes" suggest a doctor; "not sure" does not count', () => {
    assert.equal(familySuggestsDoctor(report(1, 4)), false);
    assert.equal(familySuggestsDoctor(report(2)), true);
    assert.equal(familySuggestsDoctor(null), false);
  });
  test('latest report is by date', () => {
    const a = { ...report(0), id: 'a', date: '2026-05-01' };
    const b = { ...report(3), id: 'b', date: '2026-11-01' };
    assert.equal(latestFamilyReport([b, a])?.id, 'b');
  });
});
