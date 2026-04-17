import { describe, it, expect } from 'vitest';
import { openDatabase } from '../auth/db';
import { markEventProcessed } from './events-log';

describe('stripe events idempotency', () => {
  it('returns true on first call for an event id', () => {
    const db = openDatabase(':memory:');
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(true);
    db.close();
  });

  it('returns false on duplicate event id', () => {
    const db = openDatabase(':memory:');
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(true);
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(false);
    db.close();
  });

  it('different ids are independent', () => {
    const db = openDatabase(':memory:');
    expect(markEventProcessed(db, 'evt_1', 1_000)).toBe(true);
    expect(markEventProcessed(db, 'evt_2', 2_000)).toBe(true);
    db.close();
  });
});
