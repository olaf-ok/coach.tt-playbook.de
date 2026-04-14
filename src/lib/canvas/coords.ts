import type { Point } from '../types/exercise';

export interface TableBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function pixelToRelative(px: Point, box: TableBox): Point {
  return {
    x: (px.x - box.x) / box.width,
    y: (px.y - box.y) / box.height,
  };
}

export function relativeToPixel(rel: Point, box: TableBox): Point {
  return {
    x: box.x + rel.x * box.width,
    y: box.y + rel.y * box.height,
  };
}
