import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DemoBadge } from '@/components/DemoBadge';
import { Sky } from '@/components/Sky';
import { Tree } from '@/components/Tree';
import { AppText, BigButton, Screen, SpeakButton, TextLink } from '@/components/ui';
import { displayName, greetingKey } from '@/lib/names';
import { sceneFor, sceneInk, type Scene } from '@/lib/scene';
import { localDay, treeState } from '@/lib/tree';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme/tokens';

const SCENES: Scene[] = ['morning', 'day', 'night'];

export default function Home() {
  const { t } = useTranslation();
  const { callName, playDays, demo } = useStore();
  const window = useWindowDimensions();
  // The tree fills whatever space is left between the greeting and the Play button.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const treeSize = Math.floor(Math.min(area.w, area.h - 8, 420));

  // Follow the phone's clock: re-read it on focus and every minute (the app may stay open).
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => setNow(new Date()), []));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Dev-only override for checking each look: /?scene=night
  const { scene: forced } = useLocalSearchParams<{ scene?: string }>();
  const scene: Scene = __DEV__ && SCENES.includes(forced as Scene) ? (forced as Scene) : sceneFor(now);
  const ink = sceneInk[scene];
  // Light status bar text on the night sky, only while this screen is in front.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(ink.statusBar);
      return () => setStatusBarStyle('dark');
    }, [ink.statusBar]),
  );

  if (callName === null) return <Redirect href="/welcome" />;

  const tree = treeState(playDays, localDay(now));
  const newWeek = tree.flowers === 0 && tree.lastWeekFlowers > 0;
  const name = displayName(callName, t);
  const greeting = t(`home.${greetingKey(scene)}`);
  const title = name ? t('home.greetingWithName', { greeting, name }) : greeting;
  const status = tree.playedToday ? t('home.playedToday') : newWeek ? t('home.newWeek') : t('home.readyToday');
  const spoken = [title, status].join('. ');

  return (
    <View style={{ flex: 1 }}>
      <Sky scene={scene} width={window.width} height={window.height} />
      <Screen
        transparent
        scroll={false}
        footer={
          <>
            <BigButton
              label={tree.playedToday ? t('home.playAgain') : t('home.playToday')}
              onPress={() => router.push('/play')}
              color={ink.button}
              pressedColor={ink.buttonPressed}
            />
            <BigButton kind="secondary" label={t('home.checkIn')} onPress={() => router.push('/checkin')} />
            <TextLink label={t('home.about')} onPress={() => router.push('/about')} style={{ color: ink.footerLink }} />
          </>
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1, gap: space.xs }}>
            <AppText variant="display" bold accessibilityRole="header" style={{ color: ink.text }}>
              {title}
            </AppText>
            <AppText variant="body" bold={!tree.playedToday} style={{ color: tree.playedToday ? ink.textMuted : ink.accentText }}>
              {status}
            </AppText>
          </View>
          <SpeakButton text={spoken} />
        </View>

        {demo ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/report')}
            style={({ pressed }) => [styles.demoBanner, pressed && { opacity: 0.85 }]}
          >
            {/* Badge and link stacked: side by side they do not fit a small phone in Thai. */}
            <View style={{ flex: 1, gap: 4 }}>
              <DemoBadge style={{ alignSelf: 'flex-start' }} />
              <AppText variant="small" bold style={{ color: colors.primary }}>
                {t('demo.openReport')}
              </AppText>
            </View>
            <AppText variant="title" bold style={{ color: colors.primary }}>
              ›
            </AppText>
          </Pressable>
        ) : null}

        <View
          style={styles.treeWrap}
          onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {treeSize > 120 ? (
            <Tree flowerDays={tree.flowerDays} fallenDays={newWeek ? tree.lastWeekDays : []} scene={scene} size={treeSize} />
          ) : null}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, marginTop: space.sm },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  treeWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
