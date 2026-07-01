import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR') {
  const locale = currency === 'USD' ? 'en-US' : 'en-IN';
  return amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAmount(amount: number, currency: 'INR' | 'USD' = 'INR') {
  const symbol = currency === 'USD' ? '$' : '₹';
  return `${symbol}${formatCurrency(amount, currency)}`;
}
