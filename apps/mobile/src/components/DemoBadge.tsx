import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { fonts } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, maxFontScale, radius } from '@/theme/tokens';

/** "Demo data" label, shown wherever the synthetic demo data appears. Renders nothing otherwise. */
export function DemoBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const { demo, language } = useStore();
  if (!demo) return null;
  return (
    <View style={[styles.badge, style]} accessibilityRole="text" accessibilityLabel={t('demo.badge')}>
      {/* Own text metrics: a tight line box so the label sits in the middle of the pill in both scripts. */}
      <Text
        maxFontSizeMultiplier={maxFontScale}
        numberOfLines={1}
        style={[styles.text, { fontFamily: fonts[language].bold, lineHeight: language === 'th' ? 22 : 19 }]}
      >
        {t('demo.badge')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.demo,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
  },
  text: { color: colors.onPrimary, fontSize: 15, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
});
