import type { Locale } from './i18n';
import nl from '../content/texts/nl.json';
import en from '../content/texts/en.json';
import tr from '../content/texts/tr.json';
import company from '../content/company.json';
import gemeenten from '../content/gemeenten.json';

export type Texts = typeof nl;
const TEXTS: Record<Locale, Texts> = { nl, en: en as Texts, tr: tr as Texts };

export function texts(locale: Locale): Texts {
  return TEXTS[locale];
}

export { company, gemeenten };

type Localized<T> = Record<Locale, T>;

export type Project = {
  order: number;
  published: boolean;
  name: string;
  visual: 'swipe' | 'timeline' | 'bars';
  image: string;
  tags: string[];
  link: string;
  repo: string;
} & Localized<{ title: string; summary: string; role: string }>;

export type Product = {
  order: number;
  published: boolean;
  name: string;
  status: 'development' | 'pilot' | 'soon' | 'live';
  visual: 'document' | 'letters';
  image: string;
  icon?: string;
  url: string;
} & Localized<{ tagline: string; text: string; cta: string }>;

function collect<T extends { order: number; published: boolean }>(
  modules: Record<string, { default: T }>,
): (T & { slug: string })[] {
  return Object.entries(modules)
    .map(([file, mod]) => ({
      ...mod.default,
      slug: file.split('/').pop()!.replace(/\.json$/, ''),
    }))
    .filter((item) => item.published !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export const projects = collect<Project>(
  import.meta.glob('../content/projects/*.json', { eager: true }),
);

export const products = collect<Product>(
  import.meta.glob('../content/products/*.json', { eager: true }),
);
