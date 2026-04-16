import { m } from '$lib/paraglide/messages';
import { isStrokeTypeCode, type StrokeTypeCode } from '$lib/constants/strokeTypes';

export interface StrokeTypeLabel {
  code: StrokeTypeCode;
  short: string;
  full: string;
}

export function strokeTypeShort(value: string | null): string {
  if (!value || !isStrokeTypeCode(value)) return '';
  return strokeTypeLabel(value).short;
}

export function strokeTypeLabel(code: StrokeTypeCode): StrokeTypeLabel {
  switch (code) {
    case 'SERVE':       return { code, short: m.stroke_serve_short(),       full: m.stroke_serve_full() };
    case 'RECEIVE':     return { code, short: m.stroke_receive_short(),     full: m.stroke_receive_full() };
    case 'FH_TOPSPIN':  return { code, short: m.stroke_fh_topspin_short(),  full: m.stroke_fh_topspin_full() };
    case 'BH_TOPSPIN':  return { code, short: m.stroke_bh_topspin_short(),  full: m.stroke_bh_topspin_full() };
    case 'FH_BLOCK':    return { code, short: m.stroke_fh_block_short(),    full: m.stroke_fh_block_full() };
    case 'BH_BLOCK':    return { code, short: m.stroke_bh_block_short(),    full: m.stroke_bh_block_full() };
    case 'PUSH':        return { code, short: m.stroke_push_short(),        full: m.stroke_push_full() };
    case 'FLIP':        return { code, short: m.stroke_flip_short(),        full: m.stroke_flip_full() };
    case 'FH_COUNTER':  return { code, short: m.stroke_fh_counter_short(),  full: m.stroke_fh_counter_full() };
    case 'BH_COUNTER':  return { code, short: m.stroke_bh_counter_short(),  full: m.stroke_bh_counter_full() };
  }
}
