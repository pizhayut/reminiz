// Report for family and doctors: trend against the person's own usual range, the latest
// status in one sentence, context and family answers, and a one-page summary to print.
// Reached from About (and the demo banner), not from the older adult's main screen.
import { router } from 'expo-router';
import * as Print from 'expo-print';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { runChangeEngine } from '@/checkin/changeEngine';
import { FAMILY_ITEMS, familySuggestsDoctor, familyYesCount, latestFamilyReport } from '@/checkin/family';
import { DemoBadge } from '@/components/DemoBadge';
import { EmergencyCard, Section, StatusCard, StatusChip, TrendChart } from '@/components/report';
import { AppText, BackButton, BigButton, Card, Screen } from '@/components/ui';
import { formatDay } from '@/lib/dates';
import { displayName } from '@/lib/names';
import { buildSummaryHtml } from '@/lib/summary';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme/tokens';

const CONTEXT_KEYS = ['sleptWell', 'unwell', 'stressed', 'ready'] as const;

/** Print an HTML page: a hidden iframe on the web (window.print), the system print sheet on phones. */
async function printHtml(html: string) {
  if (Platform.OS === 'web') {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    // Give the iframe a moment to lay out before opening the print dialog.
    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 60_000);
    }, 300);
    return;
  }
  await Print.printAsync({ html });
}

export default function Report() {
  const { t } = useTranslation();
  const { checkIns, familyReports, callName, language, demo } = useStore();
  const [width, setWidth] = useState(0);
  const engine = useMemo(() => runChangeEngine(checkIns), [checkIns]);
  const family = useMemo(() => latestFamilyReport(familyReports), [familyReports]);
  const name = displayName(callName, t) ?? t('report.defaultName');
  const latest = engine.latest ? checkIns.find((c) => c.id === engine.latest!.id) : undefined;

  const print = () =>
    printHtml(buildSummaryHtml({ t, language, name, engine, checkIns, family, demo })).catch(() => {});

  return (
    <Screen
      footer={<BigButton kind="secondary" label={t('report.print')} onPress={print} />}
    >
      <View style={styles.top}>
        <BackButton onPress={() => router.back()} />
        <DemoBadge />
      </View>
      <AppText variant="display" bold accessibilityRole="header">
        {t('report.title')}
      </AppText>
      <AppText variant="small" muted>
        {t('report.subtitle', { name })}
      </AppText>

      <StatusCard engine={engine} name={name} />
      {familySuggestsDoctor(family) ? (
        <Card warm>
          <AppText variant="small" bold>
            {t('report.family.suggestsDoctor', { count: family ? familyYesCount(family) : 0 })}
          </AppText>
          <AppText variant="small">{t('report.family.separateNote')}</AppText>
        </Card>
      ) : null}

      <Section title={t('report.chart.title')}>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {engine.results.length === 0 ? (
            <AppText variant="small" muted>
              {t('report.empty')}
            </AppText>
          ) : width > 0 ? (
            <TrendChart engine={engine} width={width} />
          ) : null}
        </View>
      </Section>

      {engine.results.length ? (
        <Section title={t('report.history.title')}>
          {engine.results
            .slice()
            .reverse()
            .map((r) => (
              <View key={r.id} style={styles.row}>
                <AppText variant="small" bold style={{ width: 112 }}>
                  {formatDay(r.date, language)}
                </AppText>
                <View style={{ flex: 1 }}>
                  <StatusChip status={r.status} affected={r.mayBeAffected} />
                </View>
              </View>
            ))}
        </Section>
      ) : null}

      {latest ? (
        <Section title={t('report.context.title')}>
          <AppText variant="small" muted>
            {t('report.context.subtitle', { date: formatDay(latest.date, language) })}
          </AppText>
          {CONTEXT_KEYS.map((k) => (
            <View key={k} style={styles.qa}>
              <AppText variant="small" style={{ flex: 1 }}>
                {t(`checkin.context.${k}`)}
              </AppText>
              <AppText variant="small" bold>
                {t(`checkin.${latest.context[k]}`)}
              </AppText>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title={t('report.family.title')}>
        {family ? (
          <>
            <AppText variant="small" muted>
              {t('report.family.answeredOn', { date: formatDay(family.date, language) })}
            </AppText>
            {FAMILY_ITEMS.map((k) => (
              <View key={k} style={styles.qa}>
                <AppText variant="small" style={{ flex: 1 }}>
                  {t(`family.items.${k}`)}
                </AppText>
                <AppText variant="small" bold style={family.answers[k] === 'yes' ? { color: colors.accent } : undefined}>
                  {t(`family.answer.${family.answers[k]}`)}
                </AppText>
              </View>
            ))}
            <AppText variant="small" bold>
              {familySuggestsDoctor(family)
                ? t('report.family.suggestsDoctor', { count: familyYesCount(family) })
                : t('report.family.noConcern', { count: familyYesCount(family) })}
            </AppText>
          </>
        ) : (
          <AppText variant="small" muted>
            {t('report.family.none')}
          </AppText>
        )}
        <AppText variant="small" muted>
          {t('family.notValidated')}
        </AppText>
        <BigButton kind="secondary" label={t('report.family.answer')} onPress={() => router.push('/family')} />
      </Section>

      <Section title={t('report.next.title')}>
        <AppText variant="small">{t('report.next.body')}</AppText>
      </Section>

      <EmergencyCard />

      <AppText variant="small" muted>
        {t('report.disclaimer')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  qa: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
});
