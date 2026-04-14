import type { StrokeType } from '../types/exercise';

export const DEFAULT_STROKE_TYPES: StrokeType[] = [
  { shortLabel: 'AS', fullLabel: 'Aufschlag', isDefault: true },
  { shortLabel: 'RS', fullLabel: 'Rückschlag', isDefault: true },
  { shortLabel: 'VH-TS', fullLabel: 'Vorhand-Topspin', isDefault: true },
  { shortLabel: 'RH-TS', fullLabel: 'Rückhand-Topspin', isDefault: true },
  { shortLabel: 'VH-Block', fullLabel: 'Vorhand-Block', isDefault: true },
  { shortLabel: 'RH-Block', fullLabel: 'Rückhand-Block', isDefault: true },
  { shortLabel: 'Schupf', fullLabel: 'Schupf', isDefault: true },
  { shortLabel: 'Flip', fullLabel: 'Flip', isDefault: true },
  { shortLabel: 'VH-Konter', fullLabel: 'Vorhand-Konter', isDefault: true },
  { shortLabel: 'RH-Konter', fullLabel: 'Rückhand-Konter', isDefault: true },
];

export function findStrokeType(shortLabel: string): StrokeType | undefined {
  return DEFAULT_STROKE_TYPES.find((t) => t.shortLabel === shortLabel);
}
