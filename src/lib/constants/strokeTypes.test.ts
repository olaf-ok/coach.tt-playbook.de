import { describe, it, expect } from 'vitest';
import { DEFAULT_STROKE_TYPE_CODES, isStrokeTypeCode, type StrokeTypeCode } from './strokeTypes';

describe('DEFAULT_STROKE_TYPE_CODES', () => {
  it('enthält die 18 Default-Schlagarten als Codes in Rally-Reihenfolge', () => {
    const expected: StrokeTypeCode[] = [
      'SERVE', 'RECEIVE',
      'FH_TOPSPIN', 'BH_TOPSPIN',
      'FH_BLOCK', 'BH_BLOCK', 'COUNTER_BLOCK',
      'FH_COUNTER', 'BH_COUNTER',
      'PUSH', 'FLIP',
      'BANANA_FLICK', 'STRAWBERRY_FLICK', 'SIDESPIN',
      'SMASH', 'CHOP', 'LOB', 'LOB_DEFENSE',
    ];
    expect(DEFAULT_STROKE_TYPE_CODES).toEqual(expected);
  });
});

describe('isStrokeTypeCode', () => {
  it('erkennt gültige Codes (alt + neu)', () => {
    expect(isStrokeTypeCode('SERVE')).toBe(true);
    expect(isStrokeTypeCode('FH_TOPSPIN')).toBe(true);
    expect(isStrokeTypeCode('PUSH')).toBe(true);
    expect(isStrokeTypeCode('COUNTER_BLOCK')).toBe(true);
    expect(isStrokeTypeCode('BANANA_FLICK')).toBe(true);
    expect(isStrokeTypeCode('STRAWBERRY_FLICK')).toBe(true);
    expect(isStrokeTypeCode('SIDESPIN')).toBe(true);
    expect(isStrokeTypeCode('SMASH')).toBe(true);
    expect(isStrokeTypeCode('CHOP')).toBe(true);
    expect(isStrokeTypeCode('LOB')).toBe(true);
    expect(isStrokeTypeCode('LOB_DEFENSE')).toBe(true);
  });

  it('lehnt ungültige Strings ab', () => {
    expect(isStrokeTypeCode('VH-TS')).toBe(false);
    expect(isStrokeTypeCode('AS')).toBe(false);
    expect(isStrokeTypeCode('xyz')).toBe(false);
    expect(isStrokeTypeCode('')).toBe(false);
  });
});
