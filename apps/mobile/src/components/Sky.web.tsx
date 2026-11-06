// Web (dev preview only): wait for CanvasKit before loading the Skia canvas.
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import type { SkyProps } from './SkyCanvas';

export function Sky(props: SkyProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('./SkyCanvas')}
      componentProps={props}
    />
  );
}
