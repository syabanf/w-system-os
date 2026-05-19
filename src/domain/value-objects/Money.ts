export type Currency = "IDR" | "USD";

export interface Money {
  amount: number;
  currency: Currency;
}

export function money(amount: number, currency: Currency = "IDR"): Money {
  return { amount, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add money of different currencies: ${a.currency} vs ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}
