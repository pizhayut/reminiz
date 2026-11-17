import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors, contentMaxWidth, maxFontScale, radius, space, tapTarget, type } from '@/theme/tokens';
import { useStore } from '@/state/store';
import { say, stopSpeaking, useCanSpeak } from '@/lib/speech';

export const fonts = {
  en: { regular: 'AtkinsonHyperlegible_400Regular', bold: 'AtkinsonHyperlegible_700Bold' },
  // Looped Thai letters are easier to read for older eyes; this face also covers Latin.
  th: { regular: 'IBMPlexSansThaiLooped_400Regular', bold: 'IBMPlexSansThaiLooped_700Bold' },
} as const;

type Variant = keyof typeof type;

export function AppText({
  variant = 'body',
  bold,
  muted,
  center,
  style,
  ...rest
}: TextProps & { variant?: Variant; bold?: boolean; muted?: boolean; center?: boolean }) {
  const { language } = useStore();
  const size = type[variant];
  // Thai stacks vowels and tone marks above and below, so it needs taller lines.
  const lineHeight = Math.round(size * (language === 'th' ? 1.55 : 1.35));
  return (
    <Text
      maxFontSizeMultiplier={maxFontScale}
      style={[
        {
          fontFamily: fonts[language][bold ? 'bold' : 'regular'],
          fontSize: size,
          lineHeight,
          color: muted ? colors.textMuted : colors.text,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}

export function Screen({
  children,
  scroll = true,
  footer,
  style,
  transparent,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Let a backdrop behind the screen show through. */
  transparent?: boolean;
}) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, styles.column, style]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.column, { flex: 1 }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.screen, transparent && { backgroundColor: 'transparent' }]} edges={['top', 'bottom', 'left', 'right']}>
      {body}
      {footer ? <View style={[styles.footer, styles.column]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function BigButton({
  label,
  onPress,
  kind = 'primary',
  size = 'large',
  style,
  accessibilityHint,
  color = colors.primary,
  pressedColor = colors.primaryPressed,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary';
  /** 'compact' for buttons inside cards: secondary height and body-size text. */
  size?: 'large' | 'compact';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  color?: string;
  pressedColor?: string;
}) {
  const primary = kind === 'primary';
  const large = primary && size === 'large';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: pressed ? pressedColor : color, minHeight: large ? tapTarget.primary : tapTarget.secondary }
          : {
              backgroundColor: pressed ? colors.primarySoft : colors.surface,
              borderColor: colors.primary,
              borderWidth: 2.5,
              minHeight: tapTarget.secondary,
            },
        style,
      ]}
    >
      <AppText
        variant={large ? 'title' : 'body'}
        bold
        center
        style={{ color: primary ? colors.onPrimary : colors.primary }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function Card({ children, style, warm }: { children: ReactNode; style?: StyleProp<ViewStyle>; warm?: boolean }) {
  return (
    <View
      style={[
        styles.card,
        warm && { backgroundColor: colors.warmSoft, borderColor: colors.warmBorder },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CircleButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.circle, pressed && { backgroundColor: colors.primarySoft }]}
    >
      {children}
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <CircleButton label={t('game.back')} onPress={onPress}>
      <Svg width={30} height={30} viewBox="0 0 24 24">
        <Path d="M15 5l-7 7 7 7" stroke={colors.text} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </CircleButton>
  );
}

/** Speaker button that reads `text` aloud. Renders nothing when the phone has no voice for the language. */
export function SpeakButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const { language } = useStore();
  const canSpeak = useCanSpeak(language);
  if (!canSpeak) return <View style={{ width: tapTarget.icon }} />;
  return (
    <CircleButton
      label={t('common.speak')}
      onPress={() => {
        stopSpeaking();
        say(text, language);
      }}
    >
      <Svg width={32} height={32} viewBox="0 0 24 24">
        <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" stroke={colors.text} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" stroke={colors.text} strokeWidth={2} fill="none" strokeLinecap="round" />
      </Svg>
    </CircleButton>
  );
}

export function TextLink({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<TextStyle> }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10} style={styles.link}>
      <AppText variant="small" style={[{ color: colors.primary, textDecorationLine: 'underline' }, style]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl, gap: space.md },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md, paddingTop: space.sm, gap: space.sm },
  column: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  circle: {
    width: tapTarget.icon,
    height: tapTarget.icon,
    borderRadius: tapTarget.icon / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { minHeight: 48, justifyContent: 'center', alignSelf: 'center' },
});
