import { describe, it, expect } from 'vitest';
import { timezoneToCurrency } from './currency-detection';

describe('timezoneToCurrency', () => {
  it('maps Europe/* to EUR', () => {
    expect(timezoneToCurrency('Europe/Berlin')).toBe('eur');
    expect(timezoneToCurrency('Europe/Madrid')).toBe('eur');
    expect(timezoneToCurrency('Europe/Paris')).toBe('eur');
  });

  it('maps America/* to USD (incl. Costa Rica)', () => {
    expect(timezoneToCurrency('America/Costa_Rica')).toBe('usd');
    expect(timezoneToCurrency('America/New_York')).toBe('usd');
    expect(timezoneToCurrency('America/Mexico_City')).toBe('usd');
  });

  it('maps Asia/* and Africa/* to USD', () => {
    expect(timezoneToCurrency('Asia/Tokyo')).toBe('usd');
    expect(timezoneToCurrency('Africa/Nairobi')).toBe('usd');
  });

  it('falls back to USD for unknown/empty', () => {
    expect(timezoneToCurrency('')).toBe('usd');
    expect(timezoneToCurrency('UTC')).toBe('usd');
  });
});
