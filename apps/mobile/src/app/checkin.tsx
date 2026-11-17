// Monthly check-in: 4 context questions, then 3 fixed-difficulty tasks on alternate forms
// (A/B/C rotate each check-in). Picture memory is studied first and recalled at the end, after
// Symbol match and Attention. No score is shown to the person; results stay on this phone.
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { attentionForm, formFor, memoryForm, MEMORY_PRACTICE, symbolForm } from '@/checkin/forms';
import {
  attentionScore,
  compositeScore,
  CONTEXT_KEYS,
  memoryScore,
  type CheckIn,
  type ContextAnswers,
} from '@/checkin/scoring';
import {
  GoNoGo,
  InfoStep,
  PictureCard,
  pictureInSentence,
  QuestionStep,
  RecallPictures,
  StudyPictures,
  SymbolMatch,
  type AttentionResponse,
} from '@/components/checkin';
import { Shape } from '@/components/Shape';
import { AppText, BigButton, Card, Screen } from '@/components/ui';
import { displayName } from '@/lib/names';
import { say, stopSpeaking, useCanSpeak } from '@/lib/speech';
import { localDay } from '@/lib/tree';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';

// Pictures for the context questions (Unicode ≤ 11, like the game).
const CONTEXT_ICONS: Record<(typeof CONTEXT_KEYS)[number], string> = {
  sleptWell: '😴',
  unwell: '💊',
  stressed: '😟',
  ready: '👓',
};

// A frame, not one of the pictures to remember.
const MEMORY_INTRO_ART = { id: 'frame', emoji: '🖼️', en: 'Picture', th: 'ภาพ' };


type Step =
  | { name: 'intro' }
  | { name: 'context'; q: number; note?: boolean }
  | { name: 'memoryIntro' }
  | { name: 'memoryPracticeStudy' }
  | { name: 'memoryPracticeRecall' }
  | { name: 'memoryReady' }
  | { name: 'memoryStudy' }
  | { name: 'symbolIntro' }
  | { name: 'symbolPractice' }
  | { name: 'symbolReady' }
  | { name: 'symbol' }
  | { name: 'attentionIntro' }
  | { name: 'attentionPractice' }
  | { name: 'attentionReady' }
  | { name: 'attention' }
  | { name: 'recallIntro' }
  | { name: 'recall' }
  | { name: 'thanks' };

export default function CheckInScreen() {
  const { t } = useTranslation();
  const { checkIns, addCheckIn, callName, language } = useStore();
  const canSpeak = useCanSpeak(language);
  // The form is fixed when the check-in starts, so saving it cannot shift the next one.
  const [form] = useState(() => formFor(checkIns.length));
  const symbol = useMemo(() => symbolForm(form), [form]);
  const memory = useMemo(() => memoryForm(form), [form]);
  const attention = useMemo(() => attentionForm(form), [form]);

  const [step, setStep] = useState<Step>({ name: 'intro' });
  const context = useRef<Partial<ContextAnswers>>({});
  const results = useRef<{
    symbol?: { correct: number; attempted: number };
    attention?: AttentionResponse[];
  }>({});
  const [startedAt] = useState(() => Date.now());

  const go = (next: Step) => {
    stopSpeaking();
    setStep(next);
  };
  const leave = () => {
    stopSpeaking();
    router.back();
  };
  useEffect(() => () => stopSpeaking(), []);

  const save = (recall: { seen: boolean; saidSeen: boolean }[]) => {
    const mem = memoryScore(recall);
    const att = attentionScore(results.current.attention ?? []);
    const sym = results.current.symbol ?? { correct: 0, attempted: 0 };
    const raw = { symbol: sym.correct, memory: mem.score, attention: att.accuracy };
    const checkIn: CheckIn = {
      id: `${Date.now()}`,
      date: localDay(),
      form,
      raw,
      composite: compositeScore(raw),
      context: context.current as ContextAnswers,
      detail: {
        symbolAttempted: sym.attempted,
        memoryHits: mem.hits,
        memoryFalseAlarms: mem.falseAlarms,
        attentionHits: att.hits,
        attentionCommissions: att.commissions,
        attentionOmissions: att.omissions,
        attentionMeanRtMs: att.meanRtMs,
        totalSeconds: Math.round((Date.now() - startedAt) / 1000),
      },
    };
    addCheckIn(checkIn);
    go({ name: 'thanks' });
  };

  const targetName = pictureInSentence(attention.target, language);
  const next = t('checkin.next');
  const startPractice = t('checkin.startPractice');
  const startReal = t('checkin.startReal');

  switch (step.name) {
    case 'intro':
      return (
        <InfoStep
          title={t('checkin.intro.title')}
          body={t('checkin.intro.body')}
          button={t('checkin.intro.start')}
          onNext={() => go({ name: 'context', q: 0 })}
          onBack={leave}
        >
          <Card warm>
            <AppText variant="small">{t('checkin.intro.note')}</AppText>
          </Card>
        </InfoStep>
      );

    case 'context': {
      const key = CONTEXT_KEYS[step.q];
      const isReady = key === 'ready';
      return (
        <QuestionStep
          key={`${step.q}-${step.note ? 1 : 0}`}
          icon={CONTEXT_ICONS[key]}
          question={t(`checkin.context.${key}`)}
          progress={t('checkin.context.progress', { current: step.q + 1, total: CONTEXT_KEYS.length })}
          note={step.note ? t('checkin.context.readyTip') : undefined}
          yes={t('checkin.yes')}
          no={step.note ? t('checkin.context.continueAnyway') : t('checkin.no')}
          onBack={leave}
          onAnswer={(yes) => {
            // "Not ready" gets one gentle tip, then the person can go on anyway.
            if (isReady && !yes && !step.note) {
              go({ name: 'context', q: step.q, note: true });
              return;
            }
            context.current[key] = yes ? 'yes' : 'no';
            if (step.q + 1 < CONTEXT_KEYS.length) go({ name: 'context', q: step.q + 1 });
            else go({ name: 'memoryIntro' });
          }}
        />
      );
    }

    case 'memoryIntro':
      return (
        <InfoStep
          title={t('checkin.memory.title')}
          body={t('checkin.memory.intro')}
          button={startPractice}
          progress={t('checkin.part', { current: 1, total: 3 })}
          onNext={() => go({ name: 'memoryPracticeStudy' })}
          onBack={leave}
          art={<PictureCard picture={MEMORY_INTRO_ART} size={150} showName={false} />}
        />
      );
    case 'memoryPracticeStudy':
      return <StudyPictures pictures={MEMORY_PRACTICE.study} onBack={leave} onDone={() => go({ name: 'memoryPracticeRecall' })} />;
    case 'memoryPracticeRecall':
      return (
        <RecallPictures items={MEMORY_PRACTICE.recall} practice onBack={leave} onDone={() => go({ name: 'memoryReady' })} />
      );
    case 'memoryReady':
      return (
        <InfoStep
          title={t('checkin.practiceDone')}
          body={t('checkin.memory.ready')}
          button={startReal}
          onNext={() => go({ name: 'memoryStudy' })}
          onBack={leave}
        />
      );
    case 'memoryStudy':
      return <StudyPictures pictures={memory.study} onBack={leave} onDone={() => go({ name: 'symbolIntro' })} />;

    case 'symbolIntro':
      return (
        <InfoStep
          title={t('checkin.symbol.title')}
          body={t('checkin.symbol.intro')}
          button={startPractice}
          progress={t('checkin.part', { current: 2, total: 3 })}
          onNext={() => go({ name: 'symbolPractice' })}
          onBack={leave}
          art={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Shape id={symbol.key[0].shape} size={90} />
              <AppText variant="display" bold>
                = {symbol.key[0].digit}
              </AppText>
            </View>
          }
        />
      );
    case 'symbolPractice':
      return <SymbolMatch form={symbol} practice onBack={leave} onDone={() => go({ name: 'symbolReady' })} />;
    case 'symbolReady':
      return (
        <InfoStep
          title={t('checkin.practiceDone')}
          body={t('checkin.symbol.ready')}
          button={startReal}
          onNext={() => go({ name: 'symbol' })}
          onBack={leave}
        />
      );
    case 'symbol':
      return (
        <SymbolMatch
          form={symbol}
          onBack={leave}
          onDone={(r) => {
            results.current.symbol = r;
            go({ name: 'attentionIntro' });
          }}
        />
      );

    case 'attentionIntro':
      return (
        <InfoStep
          title={t('checkin.attention.title', { target: targetName })}
          body={t('checkin.attention.intro', { target: targetName })}
          button={startPractice}
          progress={t('checkin.part', { current: 3, total: 3 })}
          onNext={() => go({ name: 'attentionPractice' })}
          onBack={leave}
          art={<PictureCard picture={attention.target} size={160} />}
        />
      );
    case 'attentionPractice':
      return (
        <GoNoGo
          trials={attention.practice}
          target={attention.target}
          practice
          onBack={leave}
          onDone={() => go({ name: 'attentionReady' })}
        />
      );
    case 'attentionReady':
      return (
        <InfoStep
          title={t('checkin.practiceDone')}
          body={t('checkin.attention.ready', { target: targetName })}
          button={startReal}
          onNext={() => go({ name: 'attention' })}
          onBack={leave}
        />
      );
    case 'attention':
      return (
        <GoNoGo
          trials={attention.trials}
          target={attention.target}
          onBack={leave}
          onDone={(r) => {
            results.current.attention = r;
            go({ name: 'recallIntro' });
          }}
        />
      );

    case 'recallIntro':
      return (
        <InfoStep
          title={t('checkin.memory.recallTitle')}
          body={t('checkin.memory.recallIntro')}
          button={next}
          onNext={() => go({ name: 'recall' })}
          onBack={leave}
        />
      );
    case 'recall':
      return <RecallPictures items={memory.recall} onBack={leave} onDone={save} />;

    case 'thanks':
      return <Thanks name={displayName(callName, t)} canSpeak={canSpeak} />;
  }
}

function Thanks({ name, canSpeak }: { name: string | null; canSpeak: boolean }) {
  const { t } = useTranslation();
  const { language } = useStore();
  const title = name ? t('checkin.thanks.titleWithName', { name }) : t('checkin.thanks.title');
  const body = t('checkin.thanks.body');
  useEffect(() => {
    if (canSpeak) say(`${title}. ${body}`, language);
  }, [canSpeak, title, body, language]);
  return (
    <Screen footer={<BigButton label={t('checkin.thanks.home')} onPress={() => router.replace('/')} />}>
      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <Text style={{ fontSize: 96 }} allowFontScaling={false}>
          🌿
        </Text>
      </View>
      <AppText variant="display" bold center accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" center>
        {body}
      </AppText>
    </Screen>
  );
}
