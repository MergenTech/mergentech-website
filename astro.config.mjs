import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE en BASE komen uit de deploy-workflow (GitHub Pages).
// Lokaal: http://localhost:4321/
// configure-pages geeft het eigen domein door als http://; de site draait op https,
// dus canonical, hreflang, og:url en sitemap moeten https gebruiken.
const site = (process.env.SITE || 'https://mergentech.nl').replace(/^http:\/\//, 'https://');
const base = process.env.BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'nl',
        locales: { nl: 'nl-NL', en: 'en', tr: 'tr-TR' },
      },
      // De hoofdpagina (/) stuurt alleen door naar /nl/ en staat op noindex: niet in de sitemap.
      filter: (page) =>
        new URL(page).pathname !== base && !page.includes('/admin/') && !page.includes('/bedankt/'),
      // Taalversies gelijk aan de <link rel="alternate"> in de pagina's: zonder /, met x-default (nl).
      serialize(item) {
        if (item.links) {
          item.links = item.links.filter((l) => new URL(l.url).pathname !== base);
          const nl = item.links.find((l) => l.lang === 'nl-NL');
          if (nl) item.links.push({ lang: 'x-default', url: nl.url });
        }
        return item;
      },
    }),
  ],
});
