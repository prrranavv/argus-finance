import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyInLakhs(amount: number): string {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    const sign = amount < 0 ? '-' : '';
    return `${sign}₹ ${lakhs.toFixed(2)} lakhs`;
  } else if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    const sign = amount < 0 ? '-' : '';
    return `${sign}₹ ${thousands.toFixed(1)}K`;
  } else {
    return `₹ ${amount.toFixed(0)}`;
  }
}
