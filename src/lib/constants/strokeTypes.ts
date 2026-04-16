export type StrokeTypeCode =
  | 'SERVE'
  | 'RECEIVE'
  | 'FH_TOPSPIN'
  | 'BH_TOPSPIN'
  | 'FH_BLOCK'
  | 'BH_BLOCK'
  | 'PUSH'
  | 'FLIP'
  | 'FH_COUNTER'
  | 'BH_COUNTER';

export const DEFAULT_STROKE_TYPE_CODES: StrokeTypeCode[] = [
  'SERVE',
  'RECEIVE',
  'FH_TOPSPIN',
  'BH_TOPSPIN',
  'FH_BLOCK',
  'BH_BLOCK',
  'PUSH',
  'FLIP',
  'FH_COUNTER',
  'BH_COUNTER'
];

export function isStrokeTypeCode(v: unknown): v is StrokeTypeCode {
  return typeof v === 'string' && (DEFAULT_STROKE_TYPE_CODES as string[]).includes(v);
}
