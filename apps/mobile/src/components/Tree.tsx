// Native: Skia is ready at startup, so render the canvas directly.
import TreeCanvas, { type TreeProps } from './TreeCanvas';

export function Tree(props: TreeProps) {
  return <TreeCanvas {...props} />;
}
