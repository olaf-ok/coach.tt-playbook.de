import { describe, it, expect } from 'vitest';
import { pixelToRelative, relativeToPixel } from './coords';

const tableBox = { x: 100, y: 50, width: 400, height: 610 };

describe('pixelToRelative', () => {
  it('linke obere Ecke wird (0,0)', () => {
    expect(pixelToRelative({ x: 100, y: 50 }, tableBox)).toEqual({ x: 0, y: 0 });
  });

  it('rechte untere Ecke wird (1,1)', () => {
    expect(pixelToRelative({ x: 500, y: 660 }, tableBox)).toEqual({ x: 1, y: 1 });
  });

  it('Mitte wird (0.5, 0.5)', () => {
    expect(pixelToRelative({ x: 300, y: 355 }, tableBox)).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe('relativeToPixel', () => {
  it('(0,0) → linke obere Ecke', () => {
    expect(relativeToPixel({ x: 0, y: 0 }, tableBox)).toEqual({ x: 100, y: 50 });
  });

  it('(1,1) → rechte untere Ecke', () => {
    expect(relativeToPixel({ x: 1, y: 1 }, tableBox)).toEqual({ x: 500, y: 660 });
  });

  it('Hin- und Rückkonvertierung bleibt stabil', () => {
    const original = { x: 0.37, y: 0.82 };
    const px = relativeToPixel(original, tableBox);
    const back = pixelToRelative(px, tableBox);
    expect(back.x).toBeCloseTo(original.x, 5);
    expect(back.y).toBeCloseTo(original.y, 5);
  });
});
