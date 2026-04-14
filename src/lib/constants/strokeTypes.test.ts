import { describe, it, expect } from 'vitest';
import { DEFAULT_STROKE_TYPES, findStrokeType } from './strokeTypes';

describe('DEFAULT_STROKE_TYPES', () => {
  it('enthält mindestens AS, RS, VH-TS, RH-TS', () => {
    const labels = DEFAULT_STROKE_TYPES.map((t) => t.shortLabel);
    expect(labels).toContain('AS');
    expect(labels).toContain('RS');
    expect(labels).toContain('VH-TS');
    expect(labels).toContain('RH-TS');
  });

  it('alle Default-Tags haben isDefault=true', () => {
    for (const t of DEFAULT_STROKE_TYPES) {
      expect(t.isDefault).toBe(true);
    }
  });

  it('alle Default-Tags haben einzigartige Kürzel', () => {
    const labels = DEFAULT_STROKE_TYPES.map((t) => t.shortLabel);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('findStrokeType', () => {
  it('findet AS', () => {
    const t = findStrokeType('AS');
    expect(t?.fullLabel).toBe('Aufschlag');
  });

  it('gibt undefined für unbekanntes Kürzel', () => {
    expect(findStrokeType('XYZ')).toBeUndefined();
  });
});
