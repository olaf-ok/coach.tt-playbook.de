export type Currency = 'eur' | 'usd';

// Returns the default currency for an IANA timezone string.
// Europe/* -> EUR, everything else -> USD. Users can override via the switch link.
export function timezoneToCurrency(tz: string): Currency {
  if (tz.startsWith('Europe/')) return 'eur';
  return 'usd';
}

export function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return timezoneToCurrency(tz);
  } catch {
    return 'usd';
  }
}
