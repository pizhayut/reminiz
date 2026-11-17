import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { useStore } from '@/state/store';
import { radius } from '@/theme/tokens';

/** "Demo data" label, shown wherever the synthetic demo data appears. Renders nothing otherwise. */
export function DemoBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const { demo } = useStore();
  if (!demo) return null;
  return (
    <View style={[styles.badge, style]} accessibilityRole="text" accessibilityLabel={t('demo.badge')}>
      <AppText variant="small" bold style={styles.text}>
        {t('demo.badge')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#5B3FA0',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  text: { color: '#FFFFFF' },
});
