import { en } from "./en";
import { es } from "./es";

export type Language = "en" | "es";

export const translations = {
  en,
  es,
} as const;

export type Locale = keyof typeof translations;
