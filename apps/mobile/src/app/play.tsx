import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, BigButton, Screen, SpeakButton } from '@/components/ui';
import { makeTrial, pickTargets, type Item, type Trial } from '@/game/items';
import { LEVELS, step, type Staircase } from '@/lib/staircase';
import { say, stopSpeaking, useCanSpeak } from '@/lib/speech';
import { DAYS_PER_FLOWER_WEEK, treeState } from '@/lib/tree';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme/tokens';

const ROUND_LENGTH = 10;
const FIXATION_MS = 900;
const BLANK_MS = 250;
const FEEDBACK_MS = 1300;

type Phase = 'intro' | 'fixation' | 'show' | 'blank' | 'choose' | 'correct';

export default function Play() {
  const { t } = useTranslation();
  const { level: savedLevel, language, playDays, finishRound } = useStore();
  const canSpeak = useCanSpeak(language);

  const [targets] = useState(() => pickTargets(ROUND_LENGTH));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [trial, setTrial] = useState<Trial | null>(null);
  const [faded, setFaded] = useState<string[]>([]);
  const stairs = useRef<Staircase>({ level: savedLevel, streak: 0 });
  const missed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stopSpeaking();
    },
    [],
  );

  useEffect(() => {
    if (phase === 'intro' && canSpeak) say(t('game.speakIntro'), language);
  }, [phase, canSpeak, language, t]);

  const startTrial = (i: number) => {
    stopSpeaking();
    const lvl = LEVELS[stairs.current.level];
    setTrial(makeTrial(targets[i], { options: lvl.options, sameCategory: lvl.sameCategory }));
    setFaded([]);
    missed.current = false;
    setPhase('fixation');
    // Only the picture's display time is limited. Choosing is never timed.
    later(FIXATION_MS, () => {
      setPhase('show');
      later(lvl.displayMs, () => {
        setPhase('blank');
        later(BLANK_MS, () => {
          setPhase('choose');
          if (i === 0 && canSpeak) say(t('game.speakQuestion'), language);
        });
      });
    });
  };

  const finish = () => {
    const before = treeState(playDays);
    const first = finishRound(stairs.current.level);
    const newFlower = first && before.daysThisWeek === DAYS_PER_FLOWER_WEEK - 1;
    router.replace({ pathname: '/done', params: { first: first ? '1' : '0', flower: newFlower ? '1' : '0' } });
  };

  const choose = (item: Item) => {
    if (!trial || phase !== 'choose' || faded.includes(item.id)) return;
    if (item.id !== trial.target.id) {
      // Errorless: the wrong picture quietly fades away; no sound, no cross.
      missed.current = true;
      setFaded((f) => [...f, item.id]);
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (canSpeak) say(item.name[language], language);
    stairs.current = step(stairs.current, !missed.current);
    setPhase('correct');
    later(FEEDBACK_MS, () => {
      const next = index + 1;
      if (next >= ROUND_LENGTH) finish();
      else {
        setIndex(next);
        startTrial(next);
      }
    });
  };

  if (phase === 'intro') {
    return (
      <Screen footer={<BigButton label={t('game.introStart')} onPress={() => startTrial(0)} />}>
        <TopBar onBack={() => router.back()} speak={t('game.speakIntro')} />
        <View style={styles.introArt}>
          <View style={[styles.stage, styles.introStage]}>
            <Text style={styles.emojiBig} allowFontScaling={false}>
              🍌
            </Text>
          </View>
        </View>
        <AppText variant="display" bold center accessibilityRole="header">
          {t('game.introTitle')}
        </AppText>
        <AppText variant="body" center muted>
          {t('game.introBody')}
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <TopBar
        onBack={() => router.back()}
        speak={t('game.speakQuestion')}
        progress={t('game.progress', { current: index + 1, total: ROUND_LENGTH })}
      />
      <View style={styles.main}>
        {(phase === 'fixation' || phase === 'show' || phase === 'blank') && (
          <View style={styles.stage} accessibilityLabel={t('game.lookHere')}>
            {phase === 'show' && trial ? (
              <Text style={styles.emojiBig} allowFontScaling={false} accessibilityLabel={trial.target.name[language]}>
                {trial.target.emoji}
              </Text>
            ) : phase === 'blank' ? null : (
              <>
                <View style={styles.fixRing} />
                <AppText variant="body" muted style={styles.fixLabel}>
                  {t('game.lookHere')}
                </AppText>
              </>
            )}
          </View>
        )}
        {(phase === 'choose' || phase === 'correct') && trial && (
          <Animated.View entering={FadeIn.duration(250)} style={{ gap: space.lg, width: '100%' }}>
            <AppText variant="title" bold center accessibilityRole="header">
              {phase === 'correct' ? t('game.rightAnswer') : faded.length ? t('game.tryAnother') : t('game.whichOne')}
            </AppText>
            <Options
              trial={trial}
              faded={faded}
              solved={phase === 'correct'}
              language={language}
              onChoose={choose}
            />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

function TopBar({ onBack, speak, progress }: { onBack: () => void; speak: string; progress?: string }) {
  return (
    <View style={styles.topBar}>
      <BackButton onPress={onBack} />
      <AppText variant="small" muted center style={{ flex: 1 }}>
        {progress ?? ''}
      </AppText>
      <SpeakButton text={speak} />
    </View>
  );
}

function Options({
  trial,
  faded,
  solved,
  language,
  onChoose,
}: {
  trial: Trial;
  faded: string[];
  solved: boolean;
  language: 'en' | 'th';
  onChoose: (item: Item) => void;
}) {
  const { width } = useWindowDimensions();
  const tile = Math.min(190, (width - space.lg * 2 - space.md) / 2);
  return (
    <View style={styles.grid}>
      {trial.options.map((item) => (
        <OptionTile
          key={item.id}
          item={item}
          size={tile}
          label={item.name[language]}
          faded={faded.includes(item.id) || (solved && item.id !== trial.target.id)}
          highlighted={solved && item.id === trial.target.id}
          onPress={() => onChoose(item)}
        />
      ))}
    </View>
  );
}

function OptionTile({
  item,
  size,
  label,
  faded,
  highlighted,
  onPress,
}: {
  item: Item;
  size: number;
  label: string;
  faded: boolean;
  highlighted: boolean;
  onPress: () => void;
}) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  useEffect(() => {
    opacity.value = withTiming(faded ? 0.15 : 1, { duration: 450 });
  }, [faded, opacity]);
  useEffect(() => {
    scale.value = withTiming(highlighted ? 1.06 : 1, { duration: 250 });
  }, [highlighted, scale]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: faded }}
        disabled={faded}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          { width: size, height: size },
          pressed && { backgroundColor: colors.primarySoft },
          highlighted && styles.tileRight,
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }} allowFontScaling={false}>
          {item.emoji}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  introArt: { alignItems: 'center', marginVertical: space.md },
  stage: {
    width: 260,
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introStage: { width: 200, height: 200 },
  emojiBig: { fontSize: 130 },
  fixRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  fixLabel: { position: 'absolute', bottom: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  tile: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileRight: { borderColor: colors.primary, borderWidth: 4, backgroundColor: colors.primarySoft },
});
