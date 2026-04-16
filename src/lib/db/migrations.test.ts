import { describe, it, expect } from 'vitest';
import { migrateStrokeType } from './migrations';

describe('migrateStrokeType', () => {
  it('mappt alte deutsche Strings auf Codes', () => {
    expect(migrateStrokeType('AS')).toBe('SERVE');
    expect(migrateStrokeType('RS')).toBe('RECEIVE');
    expect(migrateStrokeType('VH-TS')).toBe('FH_TOPSPIN');
    expect(migrateStrokeType('RH-TS')).toBe('BH_TOPSPIN');
    expect(migrateStrokeType('VH-Block')).toBe('FH_BLOCK');
    expect(migrateStrokeType('RH-Block')).toBe('BH_BLOCK');
    expect(migrateStrokeType('Schupf')).toBe('PUSH');
    expect(migrateStrokeType('Flip')).toBe('FLIP');
    expect(migrateStrokeType('VH-Konter')).toBe('FH_COUNTER');
    expect(migrateStrokeType('RH-Konter')).toBe('BH_COUNTER');
  });

  it('toleriert den Tippfehler VH-BL aus seed.ts', () => {
    expect(migrateStrokeType('VH-BL')).toBe('FH_BLOCK');
  });

  it('ist idempotent für bereits migrierte Codes', () => {
    expect(migrateStrokeType('FH_TOPSPIN')).toBe('FH_TOPSPIN');
    expect(migrateStrokeType('SERVE')).toBe('SERVE');
  });

  it('returns null für null oder unbekannte Werte', () => {
    expect(migrateStrokeType(null)).toBeNull();
    expect(migrateStrokeType('Unbekannt')).toBeNull();
    expect(migrateStrokeType('')).toBeNull();
  });
});
