import { isStrokeTypeCode, type StrokeTypeCode } from '../constants/strokeTypes';

const LEGACY_DE_TO_CODE: Record<string, StrokeTypeCode> = {
  AS: 'SERVE',
  RS: 'RECEIVE',
  'VH-TS': 'FH_TOPSPIN',
  'RH-TS': 'BH_TOPSPIN',
  'VH-Block': 'FH_BLOCK',
  'RH-Block': 'BH_BLOCK',
  'VH-BL': 'FH_BLOCK',
  Schupf: 'PUSH',
  Flip: 'FLIP',
  'VH-Konter': 'FH_COUNTER',
  'RH-Konter': 'BH_COUNTER'
};

export function migrateStrokeType(legacy: string | null): StrokeTypeCode | null {
  if (!legacy) return null;
  if (isStrokeTypeCode(legacy)) return legacy;
  return LEGACY_DE_TO_CODE[legacy] ?? null;
}
