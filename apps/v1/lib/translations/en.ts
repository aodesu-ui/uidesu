import { Language } from ".";

export const en = {
  langs: {
    en: "English",
    es: "Spanish"
  },
  languageAlert: {
    title: "Notice",
    message: (currentLang: Language, availableLang: Language) =>
      `This page is not available in ${en.langs[currentLang]}, but we're showing it in ${en.langs[availableLang]}.`
  },
  navigation: {
    previous: "Previous",
    next: "Next"
  },
  copyPage: 'Copy page'
} as const;
