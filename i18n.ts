import es from './locales/es';

// Por ahora, solo usaremos español.
// En el futuro, esto podría extenderse para detectar el idioma del navegador,
// permitir la selección del usuario, etc.
const translations = es;

type TranslationKeys = keyof typeof translations;

export function t(key: TranslationKeys, ...args: any[]): string {
  let translation = String(translations[key] ?? key);
  // Reemplazo simple para marcadores de posición como {0}, {1}
  if (args.length > 0) {
    args.forEach((arg, index) => {
      translation = translation.replace(`{${index}}`, arg);
    });
  }
  return translation;
}
