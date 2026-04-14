export const STROKE_COLORS = [
  '#ff453a', // 1 Rot
  '#30d158', // 2 Grün
  '#ffd60a', // 3 Gelb
  '#bf5af2', // 4 Lila
  '#ff9f0a', // 5 Orange
  '#64d2ff', // 6 Cyan
] as const;

export const MAX_UNIQUE_COLORS = STROKE_COLORS.length;

export function getStrokeColor(strokeNumber: number): string {
  if (strokeNumber < 1) {
    throw new Error(`strokeNumber must be >= 1, got ${strokeNumber}`);
  }
  const index = (strokeNumber - 1) % MAX_UNIQUE_COLORS;
  return STROKE_COLORS[index];
}

export function isRepeatedColor(strokeNumber: number): boolean {
  return strokeNumber > MAX_UNIQUE_COLORS;
}
