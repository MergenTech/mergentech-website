// Zet het beheerpaneel (Sveltia CMS) uit node_modules in public/admin,
// zodat de site het zelf serveert en er geen externe CDN nodig is.
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/admin', { recursive: true });
copyFileSync('node_modules/@sveltia/cms/dist/sveltia-cms.js', 'public/admin/sveltia-cms.js');
