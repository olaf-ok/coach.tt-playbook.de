export type StrokeTypeCode =
  | 'SERVE'
  | 'RECEIVE'
  | 'FH_TOPSPIN'
  | 'BH_TOPSPIN'
  | 'FH_BLOCK'
  | 'BH_BLOCK'
  | 'COUNTER_BLOCK'
  | 'FH_COUNTER'
  | 'BH_COUNTER'
  | 'PUSH'
  | 'FLIP'
  | 'BANANA_FLICK'
  | 'STRAWBERRY_FLICK'
  | 'SIDESPIN'
  | 'SMASH'
  | 'CHOP'
  | 'LOB'
  | 'LOB_DEFENSE';

export const DEFAULT_STROKE_TYPE_CODES: StrokeTypeCode[] = [
  'SERVE',
  'RECEIVE',
  'FH_TOPSPIN',
  'BH_TOPSPIN',
  'FH_BLOCK',
  'BH_BLOCK',
  'COUNTER_BLOCK',
  'FH_COUNTER',
  'BH_COUNTER',
  'PUSH',
  'FLIP',
  'BANANA_FLICK',
  'STRAWBERRY_FLICK',
  'SIDESPIN',
  'SMASH',
  'CHOP',
  'LOB',
  'LOB_DEFENSE',
];

export function isStrokeTypeCode(v: unknown): v is StrokeTypeCode {
  return typeof v === 'string' && (DEFAULT_STROKE_TYPE_CODES as string[]).includes(v);
}
