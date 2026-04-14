import { describe, it, expect } from 'vitest';
import { getStrokeColor, isRepeatedColor, MAX_UNIQUE_COLORS } from './colors';

describe('getStrokeColor', () => {
  it('liefert Rot für Schlag 1', () => {
    expect(getStrokeColor(1)).toBe('#ff453a');
  });

  it('liefert Cyan für Schlag 6', () => {
    expect(getStrokeColor(6)).toBe('#64d2ff');
  });

  it('wiederholt die Palette ab Schlag 7', () => {
    expect(getStrokeColor(7)).toBe(getStrokeColor(1));
    expect(getStrokeColor(8)).toBe(getStrokeColor(2));
    expect(getStrokeColor(13)).toBe(getStrokeColor(1));
  });

  it('wirft bei Schlag 0 oder negativ', () => {
    expect(() => getStrokeColor(0)).toThrow();
    expect(() => getStrokeColor(-1)).toThrow();
  });
});

describe('isRepeatedColor', () => {
  it('ist false für 1–6', () => {
    expect(isRepeatedColor(1)).toBe(false);
    expect(isRepeatedColor(6)).toBe(false);
  });

  it('ist true ab 7', () => {
    expect(isRepeatedColor(7)).toBe(true);
    expect(isRepeatedColor(12)).toBe(true);
  });
});

describe('MAX_UNIQUE_COLORS', () => {
  it('ist 6', () => {
    expect(MAX_UNIQUE_COLORS).toBe(6);
  });
});
