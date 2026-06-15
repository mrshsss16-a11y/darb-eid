import clsx, { type ClassValue } from 'clsx';

/** Conditional className helper — kept simple, no tailwind-merge dependency. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
