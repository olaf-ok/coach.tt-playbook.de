import { describe, it, expect } from 'vitest';
import { nextSheetState, type SheetState } from './steps-sheet-state';

describe('nextSheetState', () => {
  it('toggle: peek → expanded', () => {
    expect(nextSheetState('peek', 'toggle')).toBe('expanded');
  });
  it('toggle: expanded → peek', () => {
    expect(nextSheetState('expanded', 'toggle')).toBe('peek');
  });
  it('open: peek → expanded', () => {
    expect(nextSheetState('peek', 'open')).toBe('expanded');
  });
  it('open: expanded bleibt', () => {
    expect(nextSheetState('expanded', 'open')).toBe('expanded');
  });
  it('close: expanded → peek', () => {
    expect(nextSheetState('expanded', 'close')).toBe('peek');
  });
  it('close: peek bleibt', () => {
    expect(nextSheetState('peek', 'close')).toBe('peek');
  });
});

describe('SheetState type', () => {
  it('nur peek und expanded sind gültig', () => {
    const peek: SheetState = 'peek';
    const expanded: SheetState = 'expanded';
    expect(peek).toBe('peek');
    expect(expanded).toBe('expanded');
  });
});
