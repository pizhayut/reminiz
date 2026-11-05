import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import type { TreeStage } from '@/lib/tree';
import { colors } from '@/theme/tokens';

// Flower spots as fractions of the crown radius, spread so dots never overlap.
const SPOTS: [number, number][] = [
  [-0.4, -0.25], [0.3, -0.35], [-0.3, 0.3], [0.38, 0.22], [0, -0.6], [0.02, 0.05],
  [-0.65, 0.02], [0.66, -0.05], [-0.1, 0.6], [0.32, 0.6], [-0.48, -0.58], [0.56, -0.58],
  [-0.62, 0.46], [0.62, 0.44],
];

const STROKE = 5;

function Crown({ cx, cy, r, flowers, lobes }: { cx: number; cy: number; r: number; flowers: number; lobes?: boolean }) {
  const dot = Math.max(9, r * 0.13);
  return (
    <>
      {lobes && (
        <>
          <Circle cx={cx - r * 0.78} cy={cy + r * 0.38} r={r * 0.52} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={STROKE} />
          <Circle cx={cx + r * 0.78} cy={cy + r * 0.38} r={r * 0.52} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={STROKE} />
        </>
      )}
      <Circle cx={cx} cy={cy} r={r} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={STROKE} />
      {lobes && (
        // Hide the lobe outlines where they overlap the main crown.
        <Circle cx={cx} cy={cy} r={r - STROKE / 2} fill={colors.primarySoft} />
      )}
      {SPOTS.slice(0, flowers).map(([x, y], k) => (
        <Circle key={k} cx={cx + x * r} cy={cy + y * r} r={dot} fill={colors.accent} />
      ))}
    </>
  );
}

function Drawing({ stage, flowers }: { stage: TreeStage; flowers: number }) {
  const ground = 272;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 300">
      {stage === 0 && (
        <>
          <Path d={`M92 ${ground} Q150 ${ground - 52} 208 ${ground} Z`} fill={colors.trunk} opacity={0.35} />
          <Ellipse cx={150} cy={ground - 18} rx={11} ry={8} fill={colors.trunk} />
          <Path d={`M150 ${ground - 26} q-2 -14 -14 -20 q14 0 16 16`} fill={colors.primary} />
        </>
      )}
      {stage === 1 && (
        <>
          <Ellipse cx={150} cy={ground} rx={46} ry={12} fill={colors.trunk} opacity={0.3} />
          <Path d={`M150 ${ground} L150 ${ground - 58}`} stroke={colors.primary} strokeWidth={STROKE} strokeLinecap="round" />
          <Ellipse cx={130} cy={ground - 58} rx={22} ry={11} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={4} rotation={-25} origin={`130, ${ground - 58}`} />
          <Ellipse cx={170} cy={ground - 66} rx={22} ry={11} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={4} rotation={25} origin={`170, ${ground - 66}`} />
        </>
      )}
      {stage === 2 && (
        <>
          <Rect x={142} y={200} width={16} height={ground - 200} fill={colors.trunk} />
          <Crown cx={150} cy={160} r={58} flowers={flowers} />
        </>
      )}
      {stage === 3 && (
        <>
          <Rect x={139} y={180} width={22} height={ground - 180} fill={colors.trunk} />
          <Crown cx={150} cy={130} r={82} flowers={flowers} />
        </>
      )}
      {stage === 4 && (
        <>
          <Rect x={136} y={170} width={28} height={ground - 170} fill={colors.trunk} />
          <Crown cx={150} cy={112} r={92} flowers={flowers} lobes />
        </>
      )}
      <Line x1={60} y1={ground} x2={240} y2={ground} stroke={colors.text} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function Tree({
  stage,
  flowers,
  size = 280,
  grow = false,
}: {
  stage: TreeStage;
  flowers: number;
  size?: number;
  /** Play a gentle grow-in animation (used after a round). */
  grow?: boolean;
}) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(grow && !reduce ? 0.82 : 1);
  useEffect(() => {
    if (grow && !reduce) scale.value = withDelay(250, withSpring(1, { damping: 9, stiffness: 90 }));
  }, [grow, reduce, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[{ width: size, height: size, alignSelf: 'center', transformOrigin: 'bottom' }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Drawing stage={stage} flowers={Math.min(flowers, SPOTS.length)} />
    </Animated.View>
  );
}
