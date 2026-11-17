// Building blocks of the monthly check-in. Unlike the daily game, the check-in has a fixed
// difficulty and shows no score or right/wrong count while the person takes it (practice
// rounds give gentle feedback only).
import * as Haptics from 'expo-haptics';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TASK_SETTINGS } from '@/checkin/config';
import type { AttentionTrial, Picture, ShapeId, SymbolForm } from '@/checkin/forms';
import { Shape } from '@/components/Shape';
import { AppText, BackButton, BigButton, Screen, SpeakButton } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme/tokens';

/** Height of answer buttons in the check-in (the brief asks for at least 60pt). */
const ANSWER_HEIGHT = 72;

export function TopBar({ onBack, speak, progress }: { onBack: () => void; speak: string; progress?: string }) {
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

/** A page of explanation with one button to go on. */
export function InfoStep({
  title,
  body,
  button,
  onNext,
  onBack,
  progress,
  art,
  children,
}: {
  title: string;
  body: string;
  button: string;
  onNext: () => void;
  onBack: () => void;
  progress?: string;
  art?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Screen footer={<BigButton label={button} onPress={onNext} />}>
      <TopBar onBack={onBack} speak={`${title}. ${body}`} progress={progress} />
      {art ? <View style={styles.art}>{art}</View> : null}
      <AppText variant="display" bold center accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" center>
        {body}
      </AppText>
      {children}
    </Screen>
  );
}

export function AnswerButton({
  label,
  onPress,
  tone = 'plain',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'plain' | 'primary';
  disabled?: boolean;
}) {
  const primary = tone === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.answer,
        primary && { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && { backgroundColor: primary ? colors.primaryPressed : colors.primarySoft },
        disabled && { opacity: 0.5 },
      ]}
    >
      <AppText variant="title" bold center style={{ color: primary ? colors.onPrimary : colors.primary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Picture name for use inside a sentence ("Tap for the fish"). */
export function pictureInSentence(picture: Picture, language: 'en' | 'th'): string {
  return language === 'en' ? picture.en.toLowerCase() : picture.th;
}

export function PictureCard({ picture, size = 220, showName = true }: { picture: Picture; size?: number; showName?: boolean }) {
  const { language } = useStore();
  return (
    <View style={[styles.stage, { width: size, height: size }]} accessibilityLabel={picture[language]}>
      <Text style={{ fontSize: size * 0.5 }} allowFontScaling={false}>
        {picture.emoji}
      </Text>
      {showName ? (
        <AppText variant="small" muted style={styles.pictureName}>
          {picture[language]}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------- Context questions ----------

export function QuestionStep({
  question,
  progress,
  onBack,
  onAnswer,
  yes,
  no,
  note,
  icon,
}: {
  /** A picture that says what the question is about, for people who find reading hard. */
  icon?: string;
  question: string;
  progress: string;
  onBack: () => void;
  onAnswer: (yes: boolean) => void;
  yes: string;
  no: string;
  note?: string;
}) {
  return (
    <Screen
      style={{ flexGrow: 1 }}
      footer={
        <>
          <AnswerButton label={yes} onPress={() => onAnswer(true)} />
          <AnswerButton label={no} onPress={() => onAnswer(false)} />
        </>
      }
    >
      <TopBar onBack={onBack} speak={question} progress={progress} />
      <View style={styles.questionBody}>
        {icon ? (
          <Text style={styles.questionIcon} allowFontScaling={false} accessible={false}>
            {icon}
          </Text>
        ) : null}
        <AppText variant="display" bold center accessibilityRole="header">
          {question}
        </AppText>
        {note ? (
          <AppText variant="body" muted center style={{ marginTop: space.md }}>
            {note}
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

// ---------- Picture memory: study ----------

export function StudyPictures({ pictures, onBack, onDone }: { pictures: Picture[]; onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  // Read the latest onDone without restarting the picture timer when the parent re-renders.
  const advance = useEffectEvent((i: number) => {
    setShowing(false);
    if (i + 1 >= pictures.length) onDone();
    else setIndex(i + 1);
  });
  useEffect(() => {
    const gap = setTimeout(() => setShowing(true), 600);
    const next = setTimeout(() => advance(index), 600 + TASK_SETTINGS.memoryStudyMs);
    return () => {
      clearTimeout(gap);
      clearTimeout(next);
    };
  }, [index]);
  return (
    <Screen scroll={false}>
      <TopBar
        onBack={onBack}
        speak={t('checkin.memory.studyLabel')}
        progress={t('checkin.memory.studyProgress', { current: index + 1, total: pictures.length })}
      />
      <View style={styles.center}>
        <AppText variant="title" bold center>
          {t('checkin.memory.studyLabel')}
        </AppText>
        {showing ? <PictureCard picture={pictures[index]} size={260} /> : <View style={[styles.stage, { width: 260, height: 260 }]} />}
      </View>
    </Screen>
  );
}

// ---------- Picture memory: was it seen? ----------

export function RecallPictures({
  items,
  practice,
  onBack,
  onDone,
}: {
  items: { picture: Picture; seen: boolean }[];
  practice?: boolean;
  onBack: () => void;
  onDone: (answers: { seen: boolean; saidSeen: boolean }[]) => void;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const answers = useRef<{ seen: boolean; saidSeen: boolean }[]>([]);
  const question = practice ? t('checkin.memory.practiceQuestion') : t('checkin.memory.recallQuestion');

  const answer = (saidSeen: boolean) => {
    if (feedback) return;
    const item = items[index];
    answers.current.push({ seen: item.seen, saidSeen });
    const advance = () => {
      setFeedback(null);
      if (index + 1 >= items.length) onDone(answers.current);
      else setIndex(index + 1);
    };
    if (practice) {
      const right = item.seen === saidSeen;
      setFeedback(right ? t('checkin.good') : item.seen ? t('checkin.memory.practiceWasSeen') : t('checkin.memory.practiceWasNew'));
      setTimeout(advance, right ? 900 : 2200);
    } else {
      advance();
    }
  };

  return (
    <Screen
      footer={
        <>
          <AnswerButton label={t('checkin.memory.yesSeen')} onPress={() => answer(true)} disabled={!!feedback} />
          <AnswerButton label={t('checkin.memory.noSeen')} onPress={() => answer(false)} disabled={!!feedback} />
        </>
      }
    >
      <TopBar
        onBack={onBack}
        speak={question}
        progress={t('checkin.memory.studyProgress', { current: index + 1, total: items.length })}
      />
      <View style={styles.center}>
        <AppText variant="title" bold center accessibilityRole="header">
          {question}
        </AppText>
        <PictureCard picture={items[index].picture} size={230} />
        <AppText variant="body" bold center style={{ color: colors.primary, minHeight: 34 }}>
          {feedback ?? ''}
        </AppText>
      </View>
    </Screen>
  );
}

// ---------- Symbol match ----------

export function SymbolMatch({
  form,
  practice,
  onBack,
  onDone,
}: {
  form: SymbolForm;
  practice?: boolean;
  onBack: () => void;
  onDone: (result: { correct: number; attempted: number }) => void;
}) {
  const { t } = useTranslation();
  const items = practice ? form.practice : form.items;
  const [index, setIndex] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(TASK_SETTINGS.symbolSeconds);
  const correct = useRef(0);
  const attempted = useRef(0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone({ correct: correct.current, attempted: attempted.current });
  };
  const timeUp = useEffectEvent(finish);

  useEffect(() => {
    if (practice) return;
    const started = Date.now();
    const id = setInterval(() => {
      const left = TASK_SETTINGS.symbolSeconds - Math.floor((Date.now() - started) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        clearInterval(id);
        timeUp();
      }
    }, 250);
    return () => clearInterval(id);
  }, [practice]);

  const digitOf = (shape: ShapeId) => form.key.find((k) => k.shape === shape)?.digit ?? 0;

  const tap = (digit: number) => {
    if (finished.current) return;
    const right = digit === digitOf(items[index]);
    if (practice) {
      // Errorless practice: point at the right number and wait for it.
      if (!right) {
        setHint(digitOf(items[index]));
        return;
      }
      setHint(null);
      Haptics.selectionAsync().catch(() => {});
    } else {
      attempted.current += 1;
      if (right) correct.current += 1;
    }
    if (index + 1 >= items.length) finish();
    else setIndex(index + 1);
  };

  const keySize = 40;
  return (
    <Screen scroll={false}>
      <TopBar onBack={onBack} speak={t('checkin.symbol.instruction')} progress={practice ? t('checkin.practice') : undefined} />
      <View style={styles.keyRow} accessibilityLabel={t('checkin.symbol.keyLabel')}>
        {form.key.map((k) => (
          <View key={k.shape} style={[styles.keyCell, hint === k.digit && styles.keyCellHint]}>
            <Shape id={k.shape} size={keySize} />
            <AppText variant="title" bold center>
              {k.digit}
            </AppText>
          </View>
        ))}
      </View>
      {!practice ? (
        <View style={styles.timeTrack} accessibilityLabel={t('checkin.symbol.timeLeft')}>
          <View style={[styles.timeFill, { width: `${(remaining / TASK_SETTINGS.symbolSeconds) * 100}%` }]} />
        </View>
      ) : null}
      <View style={styles.center}>
        <AppText variant="body" muted center>
          {hint ? t('checkin.symbol.hint', { digit: hint }) : t('checkin.symbol.instruction')}
        </AppText>
        <View style={[styles.stage, { width: 180, height: 180 }]}>
          <Shape id={items[index]} size={130} />
        </View>
      </View>
      <View style={styles.digits}>
        {form.key.map((k) => (
          <Pressable
            key={k.digit}
            accessibilityRole="button"
            accessibilityLabel={String(k.digit)}
            onPress={() => tap(k.digit)}
            style={({ pressed }) => [styles.digit, pressed && { backgroundColor: colors.primarySoft }]}
          >
            <AppText variant="display" bold center style={{ color: colors.primary }}>
              {k.digit}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

// ---------- Attention (go/no-go) ----------

export type AttentionResponse = { go: boolean; tapped: boolean; rtMs?: number };

export function GoNoGo({
  trials,
  target,
  practice,
  onBack,
  onDone,
}: {
  trials: AttentionTrial[];
  target: Picture;
  practice?: boolean;
  onBack: () => void;
  onDone: (responses: AttentionResponse[]) => void;
}) {
  const { t } = useTranslation();
  const { language } = useStore();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [initialResponses] = useState(() => trials.map((tr): AttentionResponse => ({ go: tr.go, tapped: false })));
  const responses = useRef(initialResponses);
  const onset = useRef(0);
  const name = pictureInSentence(target, language);

  // Timer callbacks read the latest props without restarting the trial timing.
  const hidePicture = useEffectEvent((i: number) => {
    setVisible(false);
    if (!practice) return;
    const r = responses.current[i];
    setFeedback(
      r.go
        ? r.tapped
          ? t('checkin.good')
          : t('checkin.attention.missed', { target: name })
        : r.tapped
          ? t('checkin.attention.wrongTap', { target: name })
          : t('checkin.attention.rightSkip'),
    );
  });
  const nextTrial = useEffectEvent((i: number) => {
    if (i + 1 >= trials.length) onDone(responses.current);
    else setIndex(i + 1);
  });

  useEffect(() => {
    const lead = index === 0 ? 1200 : 0;
    const gap = practice ? 1800 : TASK_SETTINGS.attentionGapMs;
    const show = setTimeout(() => {
      onset.current = Date.now();
      setFeedback(null);
      setVisible(true);
    }, lead);
    const hide = setTimeout(() => hidePicture(index), lead + TASK_SETTINGS.attentionStimulusMs);
    const next = setTimeout(() => nextTrial(index), lead + TASK_SETTINGS.attentionStimulusMs + gap);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearTimeout(next);
    };
  }, [index, practice]);

  const tap = () => {
    const r = responses.current[index];
    // A tap counts for the current picture until the next one appears.
    if (!onset.current || r.tapped) return;
    r.tapped = true;
    r.rtMs = Date.now() - onset.current;
    Haptics.selectionAsync().catch(() => {});
  };

  const instruction = t('checkin.attention.instruction', { target: name });
  return (
    <Screen scroll={false}>
      <TopBar onBack={onBack} speak={instruction} progress={practice ? t('checkin.practice') : undefined} />
      <View style={styles.center}>
        <AppText variant="body" muted center>
          {instruction}
        </AppText>
        <View style={[styles.stage, { width: 240, height: 240 }]}>
          {visible ? (
            <Text style={{ fontSize: 130 }} allowFontScaling={false}>
              {trials[index].picture.emoji}
            </Text>
          ) : null}
        </View>
        <AppText variant="body" bold center style={{ color: colors.primary, minHeight: 34 }}>
          {feedback ?? ''}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('checkin.attention.tap')}
        onPressIn={tap}
        // Fallback for keyboards and switch access, which only send a press; tap() ignores a second call.
        onPress={tap}
        style={({ pressed }) => [styles.tapButton, pressed && { backgroundColor: colors.primaryPressed }]}
      >
        <AppText variant="display" bold center style={{ color: colors.onPrimary }}>
          {t('checkin.attention.tap')}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  art: { alignItems: 'center', marginVertical: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  questionBody: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  questionIcon: { fontSize: 88, textAlign: 'center' },
  stage: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pictureName: { position: 'absolute', bottom: space.sm },
  answer: {
    minHeight: ANSWER_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: space.xs,
  },
  keyCell: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 4 },
  keyCellHint: { backgroundColor: colors.warmSoft, borderWidth: 2, borderColor: colors.accent },
  timeTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  timeFill: { height: 8, backgroundColor: colors.primary },
  digits: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  digit: {
    width: '30%',
    minHeight: ANSWER_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapButton: {
    minHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
