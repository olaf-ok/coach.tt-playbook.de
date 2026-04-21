import { describe, it, expect } from 'vitest';
import { decideInitialAction } from './initial-sync';

describe('decideInitialAction', () => {
  it('returns noop when both empty', () => {
    expect(decideInitialAction(0, 0).kind).toBe('noop');
  });

  it('returns pull-only when only server has data', () => {
    expect(decideInitialAction(0, 5).kind).toBe('pullOnly');
  });

  it('returns push-only when only local has data', () => {
    expect(decideInitialAction(5, 0).kind).toBe('pushOnly');
  });

  it('returns merge-decision when both have data', () => {
    expect(decideInitialAction(3, 5).kind).toBe('needsMergeChoice');
  });
});
