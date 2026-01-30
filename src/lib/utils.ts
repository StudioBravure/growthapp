import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyInput(val: string) {
  const digits = val.replace(/\D/g, "");
  const number = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
}

export function parseCurrency(val: string) {
  const digits = val.replace(/\D/g, "");
  return Number(digits) / 100;
}
