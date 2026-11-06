import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Tree } from '@/components/Tree';
import { AppText, BigButton, Screen, SpeakButton, TextLink } from '@/components/ui';
import { displayName, greetingKey } from '@/lib/names';
import { DAYS_PER_FLOWER_WEEK, localDay, treeState } from '@/lib/tree';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme/tokens';

export default function Home() {
  const { t } = useTranslation();
  const { callName, playDays } = useStore();
  // The tree fills whatever space is left between the status card and the Play button.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const treeSize = Math.floor(Math.min(area.w, area.h - 96, 400));
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
      scroll={false}
      footer={
        <>
          <BigButton label={tree.playedToday ? t('home.playAgain') : t('home.playToday')} onPress={() => router.push('/play')} />
          <TextLink label={t('home.about')} onPress={() => router.push('/about')} />
        </>
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1, gap: space.xs }}>
          <AppText variant="display" bold accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="body" muted>
            {status}
          </AppText>
        </View>
        <SpeakButton text={spoken} />
      </View>

      <View
        style={styles.treeWrap}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {treeSize > 120 ? <Tree flowers={tree.flowers} size={treeSize} /> : null}
        <AppText variant="small" muted center>
          {caption}
        </AppText>
        {weekHint ? (
          <AppText variant="small" bold center style={{ color: colors.primary }}>
            {weekHint}
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: space.sm },
  treeWrap: { flex: 1, gap: space.sm, justifyContent: 'center', alignItems: 'center' },
});
