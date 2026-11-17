// Pieces of the family / doctor report. Plain words, never a diagnosis.
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import type { CheckInResult, EngineSummary, Status } from '@/checkin/changeEngine';
import { chartGeometry, STATUS_COLOR } from '@/checkin/chart';
import { AppText, Card, fonts } from '@/components/ui';
import { formatDay, monthShort } from '@/lib/dates';
import { useStore } from '@/state/store';
import { colors, radius, space, tapTarget, type } from '@/theme/tokens';

/** Emergency number per country (CLAUDE.md: TH 1669, UAE 998). The MVP is Thailand only. */
export const EMERGENCY_NUMBER = '1669';

export function StatusCard({ engine, name }: { engine: EngineSummary; name: string }) {
  const { t } = useTranslation();
  const status = engine.status;
  const affected = engine.latest?.mayBeAffected;
  const bodyKey = status === 'repeat' && affected ? 'report.status.repeat.affected' : `report.status.${status}.body`;
  return (
    <View style={[styles.status, { borderColor: STATUS_COLOR[status] }]}>
      <View style={[styles.statusBar, { backgroundColor: STATUS_COLOR[status] }]} />
      <View style={{ flex: 1, gap: space.xs }}>
        <AppText variant="small" muted>
          {t('report.latestResult')}
        </AppText>
        <AppText variant="title" bold style={{ color: STATUS_COLOR[status] }} accessibilityRole="header">
          {t(`report.status.${status}.title`)}
        </AppText>
        <AppText variant="small">{t(bodyKey, { name, count: engine.results.length })}</AppText>
      </View>
    </View>
  );
}

export function TrendChart({ engine, width }: { engine: EngineSummary; width: number }) {
  const { t } = useTranslation();
  const { language } = useStore();
  const height = 220;
  const g = chartGeometry(engine, width, height);
  return (
    <View style={{ gap: space.sm }}>
      <Svg width={width} height={height} accessibilityLabel={t('report.chart.title')}>
        <Line x1={g.plot.left} x2={g.plot.right} y1={g.plot.bottom} y2={g.plot.bottom} stroke={colors.border} strokeWidth={1.5} />
        {g.declineY !== null ? (
          <Line
            x1={g.plot.left}
            x2={g.plot.right}
            y1={g.declineY}
            y2={g.declineY}
            stroke={STATUS_COLOR.seeDoctor}
            strokeWidth={1.5}
            strokeDasharray="3 5"
          />
        ) : null}
        {g.baselineY !== null ? (
          <Line
            x1={g.plot.left}
            x2={g.plot.right}
            y1={g.baselineY}
            y2={g.baselineY}
            stroke={colors.primary}
            strokeWidth={2}
            strokeDasharray="8 6"
          />
        ) : null}
        <Path d={g.path} stroke={colors.text} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        {g.points.map((p) => (
          <Circle
            key={`dot-${p.date}-${p.x}`}
            cx={p.x}
            cy={p.y}
            r={7}
            fill={p.mayBeAffected ? colors.surface : STATUS_COLOR[p.status]}
            stroke={STATUS_COLOR[p.status]}
            strokeWidth={3}
          />
        ))}
        {g.points.map((p) => (
          <SvgText
            key={`month-${p.date}-${p.x}`}
            x={p.x}
            y={height - 10}
            fontSize={15}
            fontFamily={fonts[language].regular}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {monthShort(p.date, language)}
          </SvgText>
        ))}
      </Svg>
      <View style={{ gap: space.xs }}>
        <LegendItem color={colors.primary} dash="8 6" label={t('report.chart.baseline')} />
        <LegendItem color={STATUS_COLOR.seeDoctor} dash="3 4" label={t('report.chart.declineLine')} />
      </View>
      <AppText variant="small" muted>
        {t('report.chart.note')}
      </AppText>
    </View>
  );
}

function LegendItem({ color, label, dash }: { color: string; label: string; dash: string }) {
  const { language } = useStore();
  // Marker box as tall as one line of text, so it lines up with the first line when the label wraps.
  const lineHeight = Math.round(type.small * (language === 'th' ? 1.55 : 1.35));
  return (
    <View style={styles.legendItem}>
      <View style={{ height: lineHeight, justifyContent: 'center' }}>
        <Svg width={28} height={4}>
          <Line x1={0} x2={28} y1={2} y2={2} stroke={color} strokeWidth={2.5} strokeDasharray={dash} />
        </Svg>
      </View>
      <AppText variant="small" muted style={{ flex: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

/** Short, one-line status label. Never wraps: the labels are kept short in every language. */
export function StatusChip({ status }: { status: Status }) {
  const { t } = useTranslation();
  const { language } = useStore();
  return (
    <View style={[styles.chip, { borderColor: STATUS_COLOR[status] }]}>
      {/* Line box matched to the font size so the label sits in the middle of the pill. */}
      <AppText
        variant="small"
        bold
        numberOfLines={1}
        style={{ color: STATUS_COLOR[status], fontSize: 16, lineHeight: language === 'th' ? 24 : 20 }}
      >
        {t(`report.chip.${status}`)}
      </AppText>
    </View>
  );
}

/** One check-in in the history list: dot, date and status on one line, a note below when flagged. */
export function HistoryRow({ result, last }: { result: CheckInResult; last?: boolean }) {
  const { t } = useTranslation();
  const { language } = useStore();
  const color = STATUS_COLOR[result.status];
  return (
    <View style={[styles.historyRow, !last && styles.rowDivider]}>
      <View style={styles.historyMain}>
        <View style={[styles.dot, { borderColor: color, backgroundColor: result.mayBeAffected ? colors.surface : color }]} />
        <AppText variant="small" bold numberOfLines={1} style={{ flex: 1 }}>
          {formatDay(result.date, language)}
        </AppText>
        <StatusChip status={result.status} />
      </View>
      {result.mayBeAffected ? (
        <AppText variant="small" muted style={styles.historyNote}>
          {t('report.chip.affected')}
        </AppText>
      ) : null}
    </View>
  );
}

/** A question with its answer in a fixed right-hand column, so answers line up down the list. */
export function AnswerRow({
  question,
  answer,
  highlight,
  last,
}: {
  question: string;
  answer: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.answerRow, !last && styles.rowDivider]}>
      <AppText variant="small" style={{ flex: 1 }}>
        {question}
      </AppText>
      <AppText variant="small" bold style={[styles.answer, highlight && { color: STATUS_COLOR.repeat }]}>
        {answer}
      </AppText>
    </View>
  );
}

/** Emergency signs: call the emergency number straight away, do not wait for a check-in. */
export function EmergencyCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.emergency, open && styles.emergencyOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [styles.emergencyButton, pressed && { opacity: 0.85 }]}
      >
        <AppText variant="body" bold center style={{ color: colors.onPrimary }}>
          {t('emergency.button')}
        </AppText>
      </Pressable>
      {open ? (
        <View style={styles.emergencyBody}>
          <AppText variant="body" bold>
            {t('emergency.title')}
          </AppText>
          {(['weakness', 'face', 'speech', 'confusion', 'fall'] as const).map((k) => (
            <View key={k} style={styles.bullet}>
              <AppText variant="body">•</AppText>
              <AppText variant="body" style={{ flex: 1 }}>
                {t(`emergency.signs.${k}`)}
              </AppText>
            </View>
          ))}
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch(() => {})}
            style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.85 }]}
          >
            <AppText variant="title" bold center style={{ color: colors.onPrimary }}>
              {t('emergency.call', { number: EMERGENCY_NUMBER })}
            </AppText>
          </Pressable>
          <AppText variant="small" muted>
            {t('emergency.note')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <Card>
      <View style={styles.sectionHead}>
        <AppText variant="body" bold style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </AppText>
        {right}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: space.md,
    overflow: 'hidden',
  },
  statusBar: { width: 8, borderRadius: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  chip: {
    flexShrink: 0,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    minHeight: 30,
    justifyContent: 'center',
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  historyRow: { paddingVertical: space.sm, gap: 2 },
  historyMain: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  historyNote: { marginLeft: 14 + space.xs + 2 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  answerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm },
  answer: { width: 84, textAlign: 'right' },
  emergency: { borderRadius: radius.md, overflow: 'hidden' },
  emergencyOpen: { backgroundColor: colors.dangerSoft, borderWidth: 2, borderColor: colors.danger },
  emergencyButton: {
    minHeight: tapTarget.secondary,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  emergencyBody: { gap: space.sm, padding: space.md },
  bullet: { flexDirection: 'row', gap: space.xs },
  callButton: { minHeight: tapTarget.primary, borderRadius: radius.md, backgroundColor: colors.danger, justifyContent: 'center' },
});
