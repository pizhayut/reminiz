import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Tree } from '@/components/Tree';
import { AppText, BigButton, Card, Screen, SpeakButton, TextLink } from '@/components/ui';
import { displayName, greetingKey } from '@/lib/names';
import { DAYS_PER_FLOWER_WEEK, localDay, treeState } from '@/lib/tree';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';

export default function Home() {
  const { t } = useTranslation();
  const { callName, playDays } = useStore();
  const { height } = useWindowDimensions();
  // Leave room for the greeting, status card, caption and the Play button on small phones.
  const treeSize = Math.max(170, Math.min(300, height - 590));
  // Re-read the clock whenever the screen comes back into view (the app may stay open overnight).
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => setNow(new Date()), []));

  if (callName === null) return <Redirect href="/welcome" />;

  const tree = treeState(playDays, localDay(now));
  const name = displayName(callName, t);
  const greeting = t(`home.${greetingKey(now)}`);
  const title = name ? t('home.greetingWithName', { greeting, name }) : greeting;

  const caption =
    tree.careDays === 0
      ? t('home.treeEmpty')
      : [t('home.treeCaption', { count: tree.careDays }), tree.flowers > 0 ? t('home.flowers', { count: tree.flowers }) : null]
          .filter(Boolean)
          .join(' · ');
  const left = DAYS_PER_FLOWER_WEEK - tree.daysThisWeek;
  const weekHint = tree.careDays === 0 ? null : left > 0 ? t('home.weekHint', { count: left }) : t('home.weekDone');
  const status = tree.playedToday ? t('home.playedToday') : t('home.readyToday');

  const spoken = [title, caption, weekHint, status, tree.playedToday ? null : t('home.speak')].filter(Boolean).join('. ');

  return (
    <Screen
      footer={
        <>
          <BigButton label={tree.playedToday ? t('home.playAgain') : t('home.playToday')} onPress={() => router.push('/play')} />
          <TextLink label={t('home.about')} onPress={() => router.push('/about')} />
        </>
      }
    >
      <View style={styles.header}>
        <AppText variant="display" bold style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </AppText>
        <SpeakButton text={spoken} />
      </View>

      <Card>
        <AppText variant="body" bold>
          {status}
        </AppText>
        {weekHint ? (
          <AppText variant="small" muted>
            {weekHint}
          </AppText>
        ) : null}
      </Card>

      <View style={styles.treeWrap}>
        <Tree stage={tree.stage} flowers={tree.flowers} size={treeSize} />
        <AppText variant="small" muted center>
          {caption}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  treeWrap: { gap: space.sm, marginTop: space.sm },
});
