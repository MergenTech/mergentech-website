# mergentech.nl

De website van [Mergen Tech](https://mergentech.nl): statische site in drie talen (Nederlands, Engels, Turks), gebouwd met [Astro](https://astro.build). Geen database, geen cookies, geen tracking.

## Inhoud aanpassen

Alle inhoud staat los van het ontwerp in `src/content/`. Aanpassen kan op twee manieren.

### 1. In de browser: `/admin`

1. Ga naar `https://mergentech.nl/admin/`.
2. Kies **Sign In Using Access Token** en plak een GitHub-token (eenmalig aanmaken, zie hieronder).
3. Pas een tekst aan en klik op **Save**. De site wordt binnen een paar minuten opnieuw gepubliceerd.

Token aanmaken: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → *Generate new token*. Kies bij *Repository access* alleen `MergenTech/mergentech-website` en geef bij *Permissions* **Contents: Read and write**. Bewaar het token als een wachtwoord en zet het nooit in deze repo.

### 2. In de bestanden

| Wat | Bestand |
|---|---|
| Alle teksten per taal | `src/content/texts/nl.json`, `en.json`, `tr.json` |
| Gemeenten en organisaties | `src/content/gemeenten.json` (`relation`: `client` of `experience`) |
| Projecten | `src/content/projects/*.json` (één bestand per project) |
| Producten | `src/content/products/*.json` |
| Bedrijfsgegevens, e-mail, links | `src/content/company.json` |
| Open-source-lijst (GitHub) | `src/content/oss.json` |
| Privacy en colofon | `src/content/pages/*.md` |

- Een project of product verbergen: zet `"published": false`.
- Een veld in `company.json` leeg laten (bijvoorbeeld `calendar_url` of `vat_id`) betekent: niet tonen.
- Afbeeldingen komen in `public/uploads/`. Zonder afbeelding toont de site een tekening.
- Een nieuwe tekstsleutel toegevoegd aan de drie taalbestanden? Draai `npm run cms:config`, zodat het beheerpaneel het veld ook kent.

## Lokaal draaien

```bash
npm install
npm run dev      # http://localhost:4321/nl/
npm run build    # resultaat in dist/
```

Node 22 of hoger.

## Publiceren

Elke push naar `main` bouwt en publiceert de site via GitHub Actions (`.github/workflows/deploy.yml`) naar GitHub Pages. Eenmalig instellen:

1. Repo → Settings → Pages → **Source: GitHub Actions**.
2. Bij **Custom domain** `mergentech.nl` invullen en *Enforce HTTPS* aanzetten zodra dat kan.
3. DNS bij TransIP (de MX-records voor e-mail blijven zoals ze zijn):
   - `A`-records voor `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` voor `www`: `mergentech.github.io.`

Zolang het domein nog niet gekoppeld is, staat de site op `https://mergentech.github.io/mergentech-website/`.

## Opbouw

```
src/content/      inhoud (teksten, projecten, producten, bedrijfsgegevens)
src/components/   de secties van de homepage
src/layouts/      basislayout (head, header, footer)
src/styles/       global.css met de huisstijl
src/scripts/      site.ts (menu, thema, animaties, tabbladen)
public/admin/     beheerpaneel (Sveltia CMS)
scripts/          hulpscripts voor het beheerpaneel
```

## Toegankelijkheid en beweging

- Gebouwd volgens WCAG 2.2 AA; nog niet onafhankelijk getoetst.
- Animaties volgen `prefers-reduced-motion` en zijn met de pauzeknop in de header uit te zetten.
- De site werkt ook zonder JavaScript.

## Licenties

Lettertypen: JetBrains Mono en Atkinson Hyperlegible Next (SIL Open Font License). Het logo en de naam Mergen Tech zijn van Mergen Tech en vallen niet onder een open licentie.
