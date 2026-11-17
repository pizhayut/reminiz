// Web only: start downloading CanvasKit (the tree and sky renderer, ~7 MB) as soon as the app
// starts, in parallel with fonts and storage, instead of when the home screen first mounts.
// LoadSkiaWeb shares one promise, so the later WithSkiaWeb calls reuse this download.
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' }).catch(() => {});
