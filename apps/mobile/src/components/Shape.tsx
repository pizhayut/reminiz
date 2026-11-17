// Simple bold shapes for Symbol match, drawn with SVG so every phone shows them the same way.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ShapeId } from '@/checkin/forms';
import { colors } from '@/theme/tokens';

export function Shape({ id, size, color = colors.text }: { id: ShapeId; size: number; color?: string }) {
  const sw = 7;
  const common = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  let body;
  switch (id) {
    case 'circle':
      body = <Circle cx={50} cy={50} r={34} {...common} />;
      break;
    case 'triangle':
      body = <Path d="M50 14 L88 82 L12 82 Z" {...common} />;
      break;
    case 'square':
      body = <Rect x={18} y={18} width={64} height={64} rx={4} {...common} />;
      break;
    case 'star':
      body = <Path d="M50 10 L61 38 L91 39 L67 58 L76 88 L50 70 L24 88 L33 58 L9 39 L39 38 Z" {...common} />;
      break;
    case 'diamond':
      body = <Path d="M50 10 L86 50 L50 90 L14 50 Z" {...common} />;
      break;
    case 'cross':
      body = <Path d="M50 14 V86 M14 50 H86" {...common} strokeWidth={sw + 4} />;
      break;
    case 'heart':
      body = <Path d="M50 86 C20 64 10 48 14 32 C18 16 40 12 50 30 C60 12 82 16 86 32 C90 48 80 64 50 86 Z" {...common} />;
      break;
    case 'moon':
      body = <Path d="M62 12 A38 38 0 1 0 88 66 A30 30 0 1 1 62 12 Z" {...common} />;
      break;
    case 'drop':
      body = <Path d="M50 10 C64 32 80 48 80 64 A30 30 0 0 1 20 64 C20 48 36 32 50 10 Z" {...common} />;
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {body}
    </Svg>
  );
}
