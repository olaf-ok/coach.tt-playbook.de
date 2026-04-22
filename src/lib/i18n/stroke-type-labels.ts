import { m } from '$lib/paraglide/messages';
import { isStrokeTypeCode, type StrokeTypeCode } from '$lib/constants/strokeTypes';

export interface StrokeTypeLabel {
  code: StrokeTypeCode;
  short: string;
  full: string;
  desc: string;
}

export function strokeTypeShort(value: string | null): string {
  if (!value || !isStrokeTypeCode(value)) return '';
  return strokeTypeLabel(value).short;
}

export function strokeTypeDesc(value: string | null): string {
  if (!value || !isStrokeTypeCode(value)) return '';
  return strokeTypeLabel(value).desc;
}

export function strokeTypeLabel(code: StrokeTypeCode): StrokeTypeLabel {
  switch (code) {
    case 'SERVE':             return { code, short: m.stroke_serve_short(),             full: m.stroke_serve_full(),             desc: m.stroke_serve_desc() };
    case 'RECEIVE':           return { code, short: m.stroke_receive_short(),           full: m.stroke_receive_full(),           desc: m.stroke_receive_desc() };
    case 'FH_TOPSPIN':        return { code, short: m.stroke_fh_topspin_short(),        full: m.stroke_fh_topspin_full(),        desc: m.stroke_fh_topspin_desc() };
    case 'BH_TOPSPIN':        return { code, short: m.stroke_bh_topspin_short(),        full: m.stroke_bh_topspin_full(),        desc: m.stroke_bh_topspin_desc() };
    case 'FH_BLOCK':          return { code, short: m.stroke_fh_block_short(),          full: m.stroke_fh_block_full(),          desc: m.stroke_fh_block_desc() };
    case 'BH_BLOCK':          return { code, short: m.stroke_bh_block_short(),          full: m.stroke_bh_block_full(),          desc: m.stroke_bh_block_desc() };
    case 'COUNTER_BLOCK':     return { code, short: m.stroke_counter_block_short(),     full: m.stroke_counter_block_full(),     desc: m.stroke_counter_block_desc() };
    case 'FH_COUNTER':        return { code, short: m.stroke_fh_counter_short(),        full: m.stroke_fh_counter_full(),        desc: m.stroke_fh_counter_desc() };
    case 'BH_COUNTER':        return { code, short: m.stroke_bh_counter_short(),        full: m.stroke_bh_counter_full(),        desc: m.stroke_bh_counter_desc() };
    case 'PUSH':              return { code, short: m.stroke_push_short(),              full: m.stroke_push_full(),              desc: m.stroke_push_desc() };
    case 'FLIP':              return { code, short: m.stroke_flip_short(),              full: m.stroke_flip_full(),              desc: m.stroke_flip_desc() };
    case 'BANANA_FLICK':      return { code, short: m.stroke_banana_flick_short(),      full: m.stroke_banana_flick_full(),      desc: m.stroke_banana_flick_desc() };
    case 'STRAWBERRY_FLICK':  return { code, short: m.stroke_strawberry_flick_short(),  full: m.stroke_strawberry_flick_full(),  desc: m.stroke_strawberry_flick_desc() };
    case 'SIDESPIN':          return { code, short: m.stroke_sidespin_short(),          full: m.stroke_sidespin_full(),          desc: m.stroke_sidespin_desc() };
    case 'SMASH':             return { code, short: m.stroke_smash_short(),             full: m.stroke_smash_full(),             desc: m.stroke_smash_desc() };
    case 'CHOP':              return { code, short: m.stroke_chop_short(),              full: m.stroke_chop_full(),              desc: m.stroke_chop_desc() };
    case 'LOB':               return { code, short: m.stroke_lob_short(),               full: m.stroke_lob_full(),               desc: m.stroke_lob_desc() };
    case 'LOB_DEFENSE':       return { code, short: m.stroke_lob_defense_short(),       full: m.stroke_lob_defense_full(),       desc: m.stroke_lob_defense_desc() };
  }
}
