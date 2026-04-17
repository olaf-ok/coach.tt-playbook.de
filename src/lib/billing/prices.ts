import type { Currency } from './currency-detection';

export type Plan = 'monthly' | 'yearly';

export const PRICE_DISPLAY: Record<Plan, Record<Currency, string>> = {
  monthly: { eur: '9,90 €', usd: '$14.90' },
  yearly: { eur: '99 €', usd: '$149' },
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  eur: 'EUR',
  usd: 'USD',
};
