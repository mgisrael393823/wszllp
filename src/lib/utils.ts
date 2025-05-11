import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS classes properly
 * Uses clsx for conditional classes and twMerge to handle Tailwind conflicts
 * @param inputs - Class values to combine
 * @returns Combined and merged className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}