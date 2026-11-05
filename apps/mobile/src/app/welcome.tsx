import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Tree } from '@/components/Tree';
import { AppText, BigButton, Screen, SpeakButton } from '@/components/ui';
import { CALL_NAME_OPTIONS } from '@/lib/names';
import { useStore } from '@/state/store';
import { colors, radius, space, tapTarget } from '@/theme/tokens';

export default function Welcome() {
  const { t } = useTranslation();
  const { language, callName, setCallName } = useStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [choice, setChoice] = useState<string | null>(callName && callName !== 'none' ? callName : null);

  const finish = (value: string) => {
    setCallName(value);
    if (edit) router.back();
    else router.replace('/');
  };

  return (
    <Screen
      footer={
        <>
          <BigButton label={t('welcome.start')} onPress={() => finish(choice ?? 'none')} />
          <BigButton kind="secondary" label={t('welcome.skip')} onPress={() => finish('none')} />
        </>
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <SpeakButton text={t('welcome.speak')} />
      </View>
      {!edit && <Tree stage={2} flowers={3} size={120} />}
      <AppText variant="title" bold center accessibilityRole="header">
        {t('welcome.title')}
      </AppText>
      {!edit && (
        <AppText variant="body" muted center>
          {t('welcome.subtitle')}
        </AppText>
      )}
      <AppText variant="title" bold style={{ marginTop: space.sm }}>
        {t('welcome.question')}
      </AppText>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {CALL_NAME_OPTIONS[language].map((id) => {
          const selected = choice === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setChoice(id)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <AppText variant="body" bold={selected}>
                {t(`callName.${id}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', marginBottom: -space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: tapTarget.secondary,
    minWidth: 120,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { borderColor: colors.primary, borderWidth: 3, backgroundColor: colors.primarySoft },
});
