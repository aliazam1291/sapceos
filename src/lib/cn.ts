import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Aceternity's class helper: conditional classes, with later utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
