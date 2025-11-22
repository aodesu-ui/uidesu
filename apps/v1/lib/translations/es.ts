import { Language } from ".";

export const es = {
  langs: {
    en: "Inglés",
    es: "Español"
  },
  languageAlert: {
    title: "Aviso",
    message: (currentLang: Language, availableLang: Language) =>
      `Esta página no está disponible en ${es.langs[currentLang]}, pero la estamos mostrando en ${es.langs[availableLang]}.`
  },
  navigation: {
    previous: "Anterior",
    next: "Siguiente"
  },
  copyPage: 'Copiar página'
} as const;
