import { locales, pathFor, type AreaId, type Locale } from './routes.js';

/** Nome de cada idioma no próprio idioma: é igual em toda interface, não se traduz. */
export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
  'pt-PT': 'Português (Portugal)',
};

/** Bandeiras de idioma, publicadas pelo design system (ADR 0006). */
export const LOCALE_FLAGS_PATH = '/_ds/flags/';

export interface LanguageAlternate {
  locale: Locale;
  name: string;
  /** A mesma área neste idioma. */
  href: string;
  flag: string;
  current: boolean;
}

/** Os quatro idiomas de uma área, na ordem da lista de idiomas, para o seletor. */
export function languageAlternates(area: AreaId, current: Locale): LanguageAlternate[] {
  return locales.map((locale) => ({
    locale,
    name: localeNames[locale],
    href: pathFor(area, locale),
    flag: `${LOCALE_FLAGS_PATH}${locale}.svg`,
    current: locale === current,
  }));
}
