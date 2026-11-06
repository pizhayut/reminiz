// Web (dev preview only): Skia runs on CanvasKit, which must load before the canvas module.
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { TreeProps } from './TreeCanvas';

export function Tree(props: TreeProps) {
  const size = props.size ?? 300;
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('./TreeCanvas')}
      fallback={<View style={{ width: size, height: size }} />}
      componentProps={props}
    />
  );
}
