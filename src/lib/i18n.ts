export const LOCALES = ['nl', 'en', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';

export const LOCALE_NAMES: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
  tr: 'Türkçe',
};

export const HREFLANG: Record<Locale, string> = { nl: 'nl-NL', en: 'en', tr: 'tr-TR' };
export const OG_LOCALE: Record<Locale, string> = { nl: 'nl_NL', en: 'en_GB', tr: 'tr_TR' };

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Interne link, rekening houdend met het basispad (GitHub Pages zonder eigen domein). */
export function url(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
}

/** Pad van een pagina in een bepaalde taal: page('nl') -> /nl/, page('en', 'privacy') -> /en/privacy/ */
export function page(locale: Locale, slug = ''): string {
  return url(slug ? `/${locale}/${slug}/` : `/${locale}/`);
}

/** Bestand uit /public of een upload uit het CMS. Externe URL's blijven ongewijzigd. */
export function asset(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return url(path);
}
