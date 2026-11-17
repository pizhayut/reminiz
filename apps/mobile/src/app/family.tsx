// Five short questions for a family member (yes / no / not sure), compared with 6 months ago.
// Team-written, not validated: shown in the report as supporting information, apart from the RCI.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FAMILY_ITEMS, type FamilyAnswer, type FamilyItem } from '@/checkin/family';
import { DemoBadge } from '@/components/DemoBadge';
import { AppText, BackButton, BigButton, Card, Screen, SpeakButton } from '@/components/ui';
import { displayName } from '@/lib/names';
import { localDay } from '@/lib/tree';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme/tokens';

const ANSWERS: FamilyAnswer[] = ['yes', 'no', 'unsure'];

export default function Family() {
  const { t } = useTranslation();
  const { callName, addFamilyReport } = useStore();
  const name = displayName(callName, t) ?? t('report.defaultName');
  const [answers, setAnswers] = useState<Partial<Record<FamilyItem, FamilyAnswer>>>({});
  const [missing, setMissing] = useState(false);
  const intro = t('family.intro', { name });

  const save = () => {
    if (FAMILY_ITEMS.some((k) => !answers[k])) {
      setMissing(true);
      return;
    }
    addFamilyReport({ id: `${Date.now()}`, date: localDay(), answers: answers as Record<FamilyItem, FamilyAnswer> });
    router.back();
  };

  return (
    <Screen footer={<BigButton label={t('family.save')} onPress={save} />}>
      <View style={styles.top}>
        <BackButton onPress={() => router.back()} />
        <DemoBadge />
        <SpeakButton text={[intro, ...FAMILY_ITEMS.map((k) => t(`family.items.${k}`))].join(' ')} />
      </View>
      <AppText variant="display" bold accessibilityRole="header">
        {t('family.title')}
      </AppText>
      <AppText variant="body">{intro}</AppText>

      {FAMILY_ITEMS.map((k, i) => (
        <Card key={k} style={missing && !answers[k] ? { borderColor: colors.accent, borderWidth: 2.5 } : undefined}>
          <AppText variant="body" bold>
            {i + 1}. {t(`family.items.${k}`)}
          </AppText>
          <View style={styles.choices} accessibilityRole="radiogroup">
            {ANSWERS.map((a) => {
              const selected = answers[k] === a;
              return (
                <Pressable
                  key={a}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setAnswers((prev) => ({ ...prev, [k]: a }))}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <AppText variant="body" bold={selected} center>
                    {t(`family.answer.${a}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
      {missing ? (
        <AppText variant="body" bold style={{ color: colors.accent }}>
          {t('family.missing')}
        </AppText>
      ) : null}
      <AppText variant="small" muted>
        {t('family.notValidated')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  choices: { flexDirection: 'row', gap: space.xs },
  choice: {
    flex: 1,
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  choiceSelected: { borderColor: colors.primary, borderWidth: 3, backgroundColor: colors.primarySoft },
});
