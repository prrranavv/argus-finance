import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    return "₹ ••••";
  }
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

export function formatCurrencyInLakhs(amount: number, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    return "₹ ••••";
  }
  
  const roundedAmount = Math.round(amount);
  
  if (roundedAmount >= 100000) {
    const lakhs = roundedAmount / 100000;
    return `₹ ${lakhs.toFixed(2)} lakhs`;
  } else if (roundedAmount >= 1000) {
    const thousands = roundedAmount / 1000;
    return `₹ ${thousands.toFixed(1)}K`;
  } else {
    return `₹ ${roundedAmount.toLocaleString('en-IN')}`;
  }
}

export function formatPercentage(percentage: number, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    return "••%";
  }
  return `${percentage.toFixed(1)}%`;
}

export function maskNumber(value: number | string, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    return "••••";
  }
  return value.toString();
}
