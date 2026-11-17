// Geometry of the monthly trend chart, shared by the report screen (react-native-svg) and the
// printable summary (an SVG string), so both always draw the same picture.
import type { EngineSummary, Status } from './changeEngine.ts';

export type ChartPoint = { x: number; y: number; value: number; status: Status; mayBeAffected: boolean; date: string };

export type ChartGeometry = {
  width: number;
  height: number;
  plot: { left: number; right: number; top: number; bottom: number };
  points: ChartPoint[];
  /** y of the person's own baseline, or null while it is being built. */
  baselineY: number | null;
  /** y below which a change counts as a reliable decline. */
  declineY: number | null;
  path: string;
};

export function chartGeometry(engine: EngineSummary, width: number, height: number): ChartGeometry {
  const plot = { left: 16, right: width - 16, top: 18, bottom: height - 34 };
  const values = engine.results.map((r) => r.composite);
  const refs = [engine.baseline, engine.declineLine].filter((v): v is number => v !== null);
  const all = [...values, ...refs];
  const lo = Math.min(-1.5, ...all) - 0.25;
  const hi = Math.max(1, ...all) + 0.25;
  const y = (v: number) => plot.top + ((hi - v) / (hi - lo)) * (plot.bottom - plot.top);
  const n = engine.results.length;
  const x = (i: number) => (n <= 1 ? (plot.left + plot.right) / 2 : plot.left + 14 + (i * (plot.right - plot.left - 28)) / (n - 1));
  const points = engine.results.map((r, i) => ({
    x: x(i),
    y: y(r.composite),
    value: r.composite,
    status: r.status,
    mayBeAffected: r.mayBeAffected,
    date: r.date,
  }));
  return {
    width,
    height,
    plot,
    points,
    baselineY: engine.baseline === null ? null : y(engine.baseline),
    declineY: engine.declineLine === null ? null : y(engine.declineLine),
    path: points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),
  };
}

export const STATUS_COLOR: Record<Status, string> = {
  baseline: '#8A8F8C',
  stable: '#2E6C34',
  repeat: '#C77A12',
  seeDoctor: '#B4442C',
};
