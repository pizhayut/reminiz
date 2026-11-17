// Pieces of the family / doctor report. Plain words, never a diagnosis.
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import type { EngineSummary, Status } from '@/checkin/changeEngine';
import { chartGeometry, STATUS_COLOR } from '@/checkin/chart';
import { AppText, Card } from '@/components/ui';
import { monthShort } from '@/lib/dates';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme/tokens';

/** Emergency number per country (CLAUDE.md: TH 1669, UAE 998). The MVP is Thailand only. */
export const EMERGENCY_NUMBER = '1669';

export function statusTitleKey(status: Status): string {
  return `report.status.${status}.title`;
}

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
          {t(statusTitleKey(status))}
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
    <View>
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
            key={p.date + p.x}
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
            key={`m${p.date}${p.x}`}
            x={p.x}
            y={height - 10}
            fontSize={14}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {monthShort(p.date, language)}
          </SvgText>
        ))}
      </Svg>
      <View style={styles.legend}>
        <LegendItem dash color={colors.primary} label={t('report.chart.baseline')} />
        <LegendItem dash dotted color={STATUS_COLOR.seeDoctor} label={t('report.chart.declineLine')} />
      </View>
      <AppText variant="small" muted>
        {t('report.chart.note')}
      </AppText>
    </View>
  );
}

function LegendItem({ color, label, dash, dotted }: { color: string; label: string; dash?: boolean; dotted?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <Svg width={28} height={10}>
        <Line x1={0} x2={28} y1={5} y2={5} stroke={color} strokeWidth={2} strokeDasharray={dash ? (dotted ? '3 4' : '8 6') : undefined} />
      </Svg>
      <AppText variant="small" muted style={{ flexShrink: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

export function StatusChip({ status, affected }: { status: Status; affected?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      <View style={[styles.chip, { borderColor: STATUS_COLOR[status] }]}>
        <AppText variant="small" bold style={{ color: STATUS_COLOR[status] }}>
          {t(`report.chip.${status}`)}
        </AppText>
      </View>
      {affected ? (
        <View style={[styles.chip, { borderColor: colors.warmBorder, backgroundColor: colors.warmSoft }]}>
          <AppText variant="small">{t('report.chip.affected')}</AppText>
        </View>
      ) : null}
    </View>
  );
}

/** Emergency signs: call the emergency number straight away, do not wait for a check-in. */
export function EmergencyCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.emergency}>
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
        <View style={{ gap: space.sm, paddingTop: space.sm }}>
          <AppText variant="body" bold>
            {t('emergency.title')}
          </AppText>
          {(['weakness', 'face', 'speech', 'confusion', 'fall'] as const).map((k) => (
            <AppText key={k} variant="body">
              • {t(`emergency.signs.${k}`)}
            </AppText>
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

export function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <AppText variant="body" bold style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </AppText>
        {right}
      </View>
      {children}
    </Card>
  );
}

const EMERGENCY_RED = '#B3261E';

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
  legend: { gap: 4, marginTop: space.xs, marginBottom: space.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, maxWidth: '100%' },
  chip: { flexShrink: 1, maxWidth: '100%', borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  emergency: { borderWidth: 2, borderColor: EMERGENCY_RED, borderRadius: radius.md, padding: space.sm },
  emergencyButton: {
    minHeight: 60,
    borderRadius: radius.md,
    backgroundColor: EMERGENCY_RED,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  callButton: { minHeight: 72, borderRadius: radius.md, backgroundColor: EMERGENCY_RED, justifyContent: 'center' },
});
