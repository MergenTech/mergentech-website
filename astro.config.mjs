import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE en BASE komen uit de deploy-workflow (GitHub Pages).
// Lokaal: http://localhost:4321/
const site = process.env.SITE || 'https://mergentech.nl';
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
      filter: (page) => !page.includes('/admin/'),
    }),
  ],
});
