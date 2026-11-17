// One-page summary to print (or save as PDF) and bring to a doctor visit.
// Built as a self-contained HTML page: printed through a hidden iframe on the web
// (window.print with print CSS) and through expo-print on phones.
import type { TFunction } from 'i18next';

import type { EngineSummary } from '@/checkin/changeEngine';
import { chartGeometry, STATUS_COLOR } from '@/checkin/chart';
import { FAMILY_ITEMS, familySuggestsDoctor, familyYesCount, type FamilyReport } from '@/checkin/family';
import { CONTEXT_KEYS, contextConcern, type CheckIn } from '@/checkin/scoring';
import type { Language } from '@/i18n';
import { formatDay, monthShort } from '@/lib/dates';
import { localDay } from '@/lib/tree';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function chartSvg(engine: EngineSummary, language: Language): string {
  const width = 640;
  const height = 200;
  const g = chartGeometry(engine, width, height);
  const line = (y: number | null, color: string, dash: string) =>
    y === null ? '' : `<line x1="${g.plot.left}" x2="${g.plot.right}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${dash}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${height}">
  <line x1="${g.plot.left}" x2="${g.plot.right}" y1="${g.plot.bottom}" y2="${g.plot.bottom}" stroke="#D9D5CC"/>
  ${line(g.declineY, STATUS_COLOR.seeDoctor, '3 5')}
  ${line(g.baselineY, '#2E6C34', '8 6')}
  <path d="${g.path}" stroke="#1E2422" stroke-width="2.5" fill="none"/>
  ${g.points
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${p.mayBeAffected ? '#fff' : STATUS_COLOR[p.status]}" stroke="${STATUS_COLOR[p.status]}" stroke-width="3"/>` +
        `<text x="${p.x}" y="${height - 10}" font-size="13" fill="#4F5753" text-anchor="middle">${esc(monthShort(p.date, language))}</text>`,
    )
    .join('')}
</svg>`;
}

export function buildSummaryHtml({
  t,
  language,
  name,
  engine,
  checkIns,
  family,
  demo,
}: {
  t: TFunction;
  language: Language;
  name: string;
  engine: EngineSummary;
  checkIns: readonly CheckIn[];
  family: FamilyReport | null;
  demo: boolean;
}): string {
  const status = engine.status;
  const affected = engine.latest?.mayBeAffected;
  const statusBody = t(status === 'repeat' && affected ? 'report.status.repeat.affected' : `report.status.${status}.body`, {
    name,
    count: engine.results.length,
  });
  const byId = new Map(checkIns.map((c) => [c.id, c]));
  const rows = engine.results
    .map((r) => {
      const c = byId.get(r.id);
      const notes = c
        ? CONTEXT_KEYS.filter((k) => contextConcern(k, c.context[k]))
            .map((k) => t(`report.contextFlag.${k}`))
            .join(', ')
        : '';
      return `<tr>
        <td>${esc(formatDay(r.date, language))}</td>
        <td>${c ? c.form : ''}</td>
        <td class="num">${c ? c.raw.symbol : ''}</td>
        <td class="num">${c ? c.raw.memory : ''}</td>
        <td class="num">${c ? Math.round(c.raw.attention * 100) + '%' : ''}</td>
        <td class="num">${r.composite.toFixed(2)}</td>
        <td class="num">${r.rci === null ? '–' : r.rci.toFixed(2)}</td>
        <td style="color:${STATUS_COLOR[r.status]};font-weight:700">${esc(t(`report.chip.${r.status}`))}</td>
        <td>${esc(notes)}</td>
      </tr>`;
    })
    .join('');
  const familyHtml = family
    ? `<p class="muted">${esc(t('report.family.answeredOn', { date: formatDay(family.date, language) }))}</p>
       <table class="family">${FAMILY_ITEMS.map(
         (k) => `<tr><td>${esc(t(`family.items.${k}`))}</td><td class="ans">${esc(t(`family.answer.${family.answers[k]}`))}</td></tr>`,
       ).join('')}</table>
       <p><b>${esc(
         familySuggestsDoctor(family)
           ? t('report.family.suggestsDoctor', { count: familyYesCount(family) })
           : t('report.family.noConcern', { count: familyYesCount(family) }),
       )}</b> ${esc(t('family.notValidated'))}</p>`
    : `<p class="muted">${esc(t('report.family.none'))}</p>`;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(t('summary.title'))}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", "Noto Sans Thai", "Sarabun", Roboto, Arial, sans-serif; color: #1E2422; font-size: 11.5pt; line-height: 1.4; margin: 0; }
  h1 { font-size: 17pt; margin: 0; color: #2E6C34; }
  h2 { font-size: 12pt; margin: 10px 0 4px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2E6C34; padding-bottom: 6px; }
  .muted { color: #4F5753; margin: 2px 0; }
  .demo { display: inline-block; background: #5B3FA0; color: #fff; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
  .status { border: 2px solid ${STATUS_COLOR[status]}; border-left-width: 10px; border-radius: 8px; padding: 6px 10px; margin-top: 8px; }
  .status b { color: ${STATUS_COLOR[status]}; font-size: 13pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { border-bottom: 1px solid #D9D5CC; padding: 3px 4px; text-align: left; vertical-align: top; }
  th { background: #F6F4EF; }
  .num { text-align: right; white-space: nowrap; }
  table.family td { font-size: 10.5pt; }
  .ans { width: 110px; font-weight: 700; }
  .legend { font-size: 9pt; color: #4F5753; }
  .box { background: #FBEBDD; border: 1px solid #E8C3A0; border-radius: 8px; padding: 6px 10px; margin-top: 8px; }
  .foot { margin-top: 8px; font-size: 8.5pt; color: #4F5753; border-top: 1px solid #D9D5CC; padding-top: 4px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="top">
    <div>
      <h1>${esc(t('summary.title'))}</h1>
      <p class="muted">${esc(t('summary.forPerson', { name }))} · ${esc(t('summary.printed', { date: formatDay(localDay(), language) }))}</p>
    </div>
    ${demo ? `<span class="demo">${esc(t('demo.badge'))}</span>` : ''}
  </div>

  <div class="status"><b>${esc(t(`report.status.${status}.title`))}</b><br/>${esc(statusBody)}</div>

  <h2>${esc(t('report.chart.title'))}</h2>
  ${engine.results.length ? chartSvg(engine, language) : `<p class="muted">${esc(t('report.empty'))}</p>`}
  <p class="legend">${esc(t('summary.legend'))}</p>

  <h2>${esc(t('report.history.title'))}</h2>
  <table>
    <tr><th>${esc(t('summary.cols.date'))}</th><th>${esc(t('summary.cols.form'))}</th><th class="num">${esc(t('summary.cols.symbol'))}</th><th class="num">${esc(t('summary.cols.memory'))}</th><th class="num">${esc(t('summary.cols.attention'))}</th><th class="num">${esc(t('summary.cols.composite'))}</th><th class="num">RCI</th><th>${esc(t('summary.cols.status'))}</th><th>${esc(t('summary.cols.notes'))}</th></tr>
    ${rows}
  </table>
  <p class="legend">${esc(t('summary.method'))}</p>

  <h2>${esc(t('report.family.title'))}</h2>
  ${familyHtml}

  <div class="box"><b>${esc(t('report.next.title'))}</b><br/>${esc(t('report.next.body'))}</div>
  <div class="box"><b>${esc(t('emergency.title'))}</b> ${esc(t('summary.emergency'))}</div>

  <p class="foot">${esc(t('report.disclaimer'))}${demo ? ' ' + esc(t('demo.printNote')) : ''}</p>
</body>
</html>`;
}
