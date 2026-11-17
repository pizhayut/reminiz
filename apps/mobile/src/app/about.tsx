import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DemoBadge } from '@/components/DemoBadge';
import { AppText, BigButton, Card, Screen, TextLink } from '@/components/ui';
import { languages, type Language } from '@/i18n';
import { displayName } from '@/lib/names';
import { useStore } from '@/state/store';
import { colors, radius, space, tapTarget } from '@/theme/tokens';

const SITE = 'https://reminiz.renzoft.com';
const LANGUAGE_LABEL: Record<Language, string> = { th: 'ไทย', en: 'English' };

export default function About() {
  const { t } = useTranslation();
  const { callName, language, setLanguage, demo, loadDemo, clearData } = useStore();
  const [confirmErase, setConfirmErase] = useState(false);
  const name = displayName(callName, t);
  const lang = language === 'th' ? 'th' : 'en';
  const open = (path: string) => WebBrowser.openBrowserAsync(`${SITE}/${path}#${lang}`).catch(() => {});

  return (
    <Screen footer={<BigButton kind="secondary" label={t('about.close')} onPress={() => router.back()} />}>
      <AppText variant="display" bold accessibilityRole="header">
        {t('about.title')}
      </AppText>
      <AppText variant="small" muted>
        {t('about.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </AppText>
      <AppText variant="body">{t('about.body')}</AppText>

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText variant="small" muted>
              {t('about.callName')}
            </AppText>
            <AppText variant="body" bold>
              {name ?? '—'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/welcome', params: { edit: '1' } })}
            style={({ pressed }) => [styles.smallButton, pressed && { backgroundColor: colors.primarySoft }]}
          >
            <AppText variant="small" bold style={{ color: colors.primary }}>
              {t('about.change')}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.divider} />
        <AppText variant="small" muted>
          {t('about.language')}
        </AppText>
        <View style={styles.row} accessibilityRole="radiogroup">
          {languages.map((l) => {
            const selected = l === language;
            return (
              <Pressable
                key={l}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setLanguage(l)}
                style={[styles.langChip, selected && styles.langChipSelected]}
              >
                <AppText variant="body" bold={selected}>
                  {LANGUAGE_LABEL[l]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <DemoBadge style={{ alignSelf: 'flex-start' }} />
        <AppText variant="body" bold>
          {t('demo.title')}
        </AppText>
        <AppText variant="small">{t('demo.body')}</AppText>
        {demo ? (
          <>
            <BigButton size="compact" label={t('demo.openReport')} onPress={() => router.push('/report')} />
            <BigButton kind="secondary" label={t('demo.clear')} onPress={clearData} />
            <AppText variant="small" muted>
              {t('demo.clearHint')}
            </AppText>
          </>
        ) : (
          <>
            <BigButton
              size="compact"
              label={t('demo.load')}
              onPress={() => {
                loadDemo();
                router.dismissTo('/');
              }}
            />
            <BigButton
              kind="secondary"
              label={confirmErase ? t('demo.eraseConfirm') : t('demo.erase')}
              onPress={() => {
                if (!confirmErase) {
                  setConfirmErase(true);
                  return;
                }
                clearData();
                router.dismissTo('/');
              }}
            />
          </>
        )}
      </Card>

      {/* In demo mode the demo card already links to the report. */}
      {!demo ? <TextLink label={t('about.report')} onPress={() => router.push('/report')} /> : null}

      <Card warm>
        <AppText variant="small">{t('about.privacy')}</AppText>
        <AppText variant="small">{t('about.notMedical')}</AppText>
      </Card>

      <View style={{ gap: space.xs }}>
        <TextLink label={t('about.privacyLink')} onPress={() => open('privacy')} />
        <TextLink label={t('about.termsLink')} onPress={() => open('terms')} />
        <TextLink label={t('about.supportLink')} onPress={() => open('support')} />
      </View>
      <AppText variant="small" muted center>
        {t('about.credits')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
  smallButton: {
    minHeight: 52,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
  },
  langChip: {
    flex: 1,
    minHeight: tapTarget.secondary,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipSelected: { borderColor: colors.primary, borderWidth: 3, backgroundColor: colors.primarySoft },
});
