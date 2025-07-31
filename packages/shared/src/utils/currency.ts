import { type Money } from '../types/listing';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  CHF: 'Fr.',
  SEK: 'kr',
  NZD: 'NZ$',
};

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function createMoney(amount: number, currency = 'USD'): Money {
  return {
    amount,
    currency,
    formatted: formatCurrency(amount, currency),
  };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add different currencies: ${a.currency} and ${b.currency}`);
  }

  return createMoney(a.amount + b.amount, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract different currencies: ${a.currency} and ${b.currency}`);
  }

  return createMoney(a.amount - b.amount, a.currency);
}

export function multiplyMoney(money: Money, multiplier: number): Money {
  return createMoney(money.amount * multiplier, money.currency);
}

export function convertCurrency(
  amount: number,
  _fromCurrency: string,
  toCurrency: string,
  exchangeRate: number,
): Money {
  const convertedAmount = amount * exchangeRate;
  return createMoney(convertedAmount, toCurrency);
}

export function calculateTax(subtotal: Money, taxRate: number): Money {
  return createMoney(subtotal.amount * taxRate, subtotal.currency);
}

export function calculateDiscount(
  subtotal: Money,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
): Money {
  if (discountType === 'percentage') {
    return createMoney(subtotal.amount * (discountValue / 100), subtotal.currency);
  }

  return createMoney(Math.min(discountValue, subtotal.amount), subtotal.currency);
}
