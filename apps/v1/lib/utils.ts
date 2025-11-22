import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function getLocalizedUrl(url: string, targetLocale: string) {
  return url.replace(/^\/(en|es)(\/|$)/, `/${targetLocale}$2`);
}
