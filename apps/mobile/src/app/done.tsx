import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Tree } from '@/components/Tree';
import { AppText, BigButton, Card, Screen } from '@/components/ui';
import { say, stopSpeaking, useCanSpeak } from '@/lib/speech';
import { treeState } from '@/lib/tree';
import { useStore } from '@/state/store';

export default function Done() {
  const { t } = useTranslation();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const { playDays, language } = useStore();
  const canSpeak = useCanSpeak(language);
  const tree = treeState(playDays);
  const isFirst = first === '1';
  const newFlower = isFirst;

  const message = newFlower ? t('done.newFlower') : t('done.againToday');

  useEffect(() => {
    if (canSpeak) say(`${t('done.title')}. ${message}`, language);
    return () => {
      stopSpeaking();
    };
  }, [canSpeak, language, message, t]);

  return (
    <Screen footer={<BigButton label={t('done.home')} onPress={() => router.replace('/')} />}>
      <AppText variant="display" bold center accessibilityRole="header" style={{ marginTop: 24 }}>
        {t('done.title')}
      </AppText>
      <Tree flowerDays={tree.flowerDays} newFlower={newFlower} size={300} />
      <Card warm={newFlower}>
        <AppText variant="body" bold center>
          {message}
        </AppText>
      </Card>
    </Screen>
  );
}
