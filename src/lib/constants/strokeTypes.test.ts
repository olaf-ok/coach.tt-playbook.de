import { describe, it, expect } from 'vitest';
import { DEFAULT_STROKE_TYPE_CODES, isStrokeTypeCode, type StrokeTypeCode } from './strokeTypes';

describe('DEFAULT_STROKE_TYPE_CODES', () => {
  it('enthält die 10 Default-Schlagarten als Codes', () => {
    const expected: StrokeTypeCode[] = [
      'SERVE', 'RECEIVE',
      'FH_TOPSPIN', 'BH_TOPSPIN',
      'FH_BLOCK', 'BH_BLOCK',
      'PUSH', 'FLIP',
      'FH_COUNTER', 'BH_COUNTER'
    ];
    expect(DEFAULT_STROKE_TYPE_CODES).toEqual(expected);
  });
});

describe('isStrokeTypeCode', () => {
  it('erkennt gültige Codes', () => {
    expect(isStrokeTypeCode('SERVE')).toBe(true);
    expect(isStrokeTypeCode('FH_TOPSPIN')).toBe(true);
    expect(isStrokeTypeCode('PUSH')).toBe(true);
  });

  it('lehnt ungültige Strings ab', () => {
    expect(isStrokeTypeCode('VH-TS')).toBe(false);
    expect(isStrokeTypeCode('AS')).toBe(false);
    expect(isStrokeTypeCode('xyz')).toBe(false);
    expect(isStrokeTypeCode('')).toBe(false);
  });
});
