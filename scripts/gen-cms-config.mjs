// Maakt public/admin/config.yml voor het beheerpaneel (Sveltia CMS).
// De velden voor de teksten worden afgeleid van src/content/texts/nl.json,
// zodat het paneel altijd dezelfde structuur heeft als de site.
// Nieuwe sleutel toegevoegd aan de tekstbestanden? Draai dan:  npm run cms:config
import { readFileSync, writeFileSync } from 'node:fs';
import { stringify } from 'yaml';

const REPO = 'MergenTech/mergentech-website';
const nl = JSON.parse(readFileSync('src/content/texts/nl.json', 'utf8'));

const SECTION_LABELS = {
  meta: 'SEO (başlık ve açıklama)',
  nav: 'Menü ve üst bar',
  hero: 'Hero (ilk ekran)',
  trust: 'Belediyeler satırı',
  services: 'Hizmetler',
  products: 'Ürünler bölümü (başlıklar)',
  a11y: 'Erişilebilirlik bölümü',
  process: 'Çalışma şekli',
  about: 'Hakkında',
  contact: 'İletişim',
  footer: 'Footer',
  notfound: '404 sayfası',
};

const human = (key) => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function field(name, value, label = human(name)) {
  if (typeof value === 'string') {
    return { label, name, widget: value.length > 70 ? 'text' : 'string', required: false };
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string') {
      return { label, name, widget: 'list', field: { label: 'Metin', name: 'item', widget: 'text' } };
    }
    return {
      label,
      name,
      widget: 'list',
      summary: `{{fields.${Object.keys(first)[0]}}}`,
      fields: Object.entries(first).map(([k, v]) => field(k, v)),
    };
  }
  return {
    label,
    name,
    widget: 'object',
    collapsed: true,
    fields: Object.entries(value).map(([k, v]) => field(k, v)),
  };
}

const textFields = Object.entries(nl).map(([k, v]) => field(k, v, SECTION_LABELS[k] ?? human(k)));

const perLocale = (fields) =>
  [
    ['nl', 'Nederlands'],
    ['en', 'English'],
    ['tr', 'Türkçe'],
  ].map(([name, label]) => ({ label, name, widget: 'object', collapsed: name !== 'nl', fields }));

const common = [
  { label: 'Ad', name: 'name', widget: 'string' },
  { label: 'Yayında (sitede göster)', name: 'published', widget: 'boolean', default: true },
  { label: 'Sıra (küçük sayı önce gelir)', name: 'order', widget: 'number', value_type: 'int', default: 10 },
];

const image = {
  label: 'Görsel (boş bırakılırsa çizim gösterilir)',
  name: 'image',
  widget: 'image',
  required: false,
};

const pageFile = (slug, lang, label) => ({
  label,
  name: `${slug}-${lang}`,
  file: `src/content/pages/${slug}.${lang}.md`,
  fields: [
    { label: 'Başlık', name: 'title', widget: 'string' },
    { label: 'Son güncelleme', name: 'updated', widget: 'datetime', format: 'YYYY-MM-DD', time_format: false },
    { label: 'Metin', name: 'body', widget: 'markdown' },
  ],
});

const config = {
  backend: { name: 'github', repo: REPO, branch: 'main' },
  site_url: 'https://mergentech.nl',
  media_folder: 'public/uploads',
  public_folder: '/uploads',
  collections: [
    {
      name: 'texts',
      label: 'Site metinleri',
      description: 'Sitedeki tüm metinler, dil başına bir dosya.',
      files: [
        ['nl', 'Nederlands'],
        ['en', 'English'],
        ['tr', 'Türkçe'],
      ].map(([lang, label]) => ({
        label,
        name: lang,
        file: `src/content/texts/${lang}.json`,
        fields: textFields,
      })),
    },
    {
      name: 'gemeenten',
      label: 'Belediyeler',
      description: 'Hero altındaki satırda görünen belediye ve kurumlar.',
      files: [
        {
          label: 'Belediye listesi',
          name: 'gemeenten',
          file: 'src/content/gemeenten.json',
          fields: [
            {
              label: 'Belediyeler ve kurumlar',
              name: 'items',
              widget: 'list',
              summary: '{{fields.name}}',
              fields: [
                { label: 'Ad', name: 'name', widget: 'string' },
                {
                  label: 'İlişki',
                  name: 'relation',
                  widget: 'select',
                  default: 'client',
                  options: [
                    { label: 'Müşteri (Opdrachtgever)', value: 'client' },
                    { label: 'Deneyim / topluluk', value: 'experience' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'products',
      label: 'Ürünler',
      label_singular: 'Ürün',
      folder: 'src/content/products',
      extension: 'json',
      create: true,
      slug: '{{name}}',
      summary: '{{order}} · {{name}}',
      fields: [
        ...common,
        {
          label: 'Durum',
          name: 'status',
          widget: 'select',
          default: 'development',
          options: [
            { label: 'Geliştiriliyor', value: 'development' },
            { label: 'Pilot', value: 'pilot' },
            { label: 'Yakında (mağaza onayı bekleniyor)', value: 'soon' },
            { label: 'Yayında', value: 'live' },
          ],
        },
        {
          label: 'Çizim',
          name: 'visual',
          widget: 'select',
          default: 'document',
          options: [
            { label: 'Belge', value: 'document' },
            { label: 'Harf taşları', value: 'letters' },
          ],
        },
        image,
        { label: 'Uygulama simgesi (kare; çizimin yerine gösterilir)', name: 'icon', widget: 'image', required: false },
        { label: 'Ürün linki (boşsa iletişim bölümüne gider)', name: 'url', widget: 'string', required: false },
        ...perLocale([
          { label: 'Kısa slogan', name: 'tagline', widget: 'string' },
          { label: 'Açıklama', name: 'text', widget: 'text' },
          { label: 'Link metni (boşsa link gösterilmez)', name: 'cta', widget: 'string', required: false },
        ]),
      ],
    },
    {
      name: 'settings',
      label: 'Şirket bilgileri',
      files: [
        {
          label: 'Şirket ve iletişim',
          name: 'company',
          file: 'src/content/company.json',
          fields: [
            { label: 'Şirket adı', name: 'name', widget: 'string' },
            { label: 'Kurucu', name: 'founder', widget: 'string' },
            { label: 'KvK numarası', name: 'kvk', widget: 'string' },
            { label: 'Vestigingsnummer', name: 'vestigingsnummer', widget: 'string', required: false },
            { label: 'Btw-id (NL…B..)', name: 'vat_id', widget: 'string', required: false },
            { label: 'Sokak ve numara', name: 'street', widget: 'string' },
            { label: 'Posta kodu', name: 'postal_code', widget: 'string' },
            { label: 'Şehir', name: 'city', widget: 'string' },
            { label: 'E-posta', name: 'email', widget: 'string' },
            { label: 'İletişim formu: Forminit form kimliği (boşsa form gösterilmez)', name: 'form_id', widget: 'string', required: false },
            { label: 'Takvim linki (Cal.com vb.)', name: 'calendar_url', widget: 'string', required: false },
            { label: 'LinkedIn', name: 'linkedin_url', widget: 'string', required: false },
            { label: 'GitHub (şirket)', name: 'github_url', widget: 'string', required: false },
            { label: 'GitHub (kişisel)', name: 'github_personal_url', widget: 'string', required: false },
            { label: 'WhatsApp numarası (+31…)', name: 'whatsapp_number', widget: 'string', required: false },
            { label: 'Portre fotoğrafı (Hakkında bölümü)', name: 'portrait', widget: 'image', required: false },
          ],
        },
      ],
    },
    {
      name: 'pages',
      label: 'Yasal sayfalar',
      files: [
        pageFile('privacy', 'nl', 'Privacy — Nederlands'),
        pageFile('privacy', 'en', 'Privacy — English'),
        pageFile('privacy', 'tr', 'Privacy — Türkçe'),
        pageFile('colofon', 'nl', 'Colofon — Nederlands'),
        pageFile('colofon', 'en', 'Colofon — English'),
        pageFile('colofon', 'tr', 'Colofon — Türkçe'),
      ],
    },
  ],
};

const header = `# Dit bestand wordt gegenereerd door scripts/gen-cms-config.mjs — niet met de hand aanpassen.\n# Opnieuw maken: npm run cms:config\n`;
writeFileSync('public/admin/config.yml', header + stringify(config, { lineWidth: 0, aliasDuplicateObjects: false }));
console.log('public/admin/config.yml bijgewerkt');
