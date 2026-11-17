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
import { CONTEXT_KEYS, contextConcern } from '@/checkin/scoring';
import { DemoBadge } from '@/components/DemoBadge';
import { AnswerRow, EmergencyCard, HistoryRow, Section, StatusCard, TrendChart } from '@/components/report';
import { AppText, BackButton, BigButton, Card, Screen } from '@/components/ui';
import { formatDay } from '@/lib/dates';
import { displayName } from '@/lib/names';
import { buildSummaryHtml } from '@/lib/summary';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';

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
  const latestId = engine.latest?.id;
  const latest = checkIns.find((c) => c.id === latestId);

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
          <View>
            {engine.results
              .slice()
              .reverse()
              .map((r, i) => (
                <HistoryRow key={r.id} result={r} last={i === engine.results.length - 1} />
              ))}
          </View>
        </Section>
      ) : null}

      {latest ? (
        <Section title={t('report.context.title')}>
          <AppText variant="small" muted>
            {t('report.context.subtitle', { date: formatDay(latest.date, language) })}
          </AppText>
          <View>
            {CONTEXT_KEYS.map((k, i) => (
              <AnswerRow
                key={k}
                question={t(`checkin.context.${k}`)}
                answer={t(`checkin.${latest.context[k]}`)}
                highlight={contextConcern(k, latest.context[k])}
                last={i === CONTEXT_KEYS.length - 1}
              />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title={t('report.family.title')}>
        {family ? (
          <>
            <AppText variant="small" muted>
              {t('report.family.answeredOn', { date: formatDay(family.date, language) })}
            </AppText>
            <View>
              {FAMILY_ITEMS.map((k, i) => (
                <AnswerRow
                  key={k}
                  question={t(`family.items.${k}`)}
                  answer={t(`family.answer.${family.answers[k]}`)}
                  highlight={family.answers[k] === 'yes'}
                  last={i === FAMILY_ITEMS.length - 1}
                />
              ))}
            </View>
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
});
