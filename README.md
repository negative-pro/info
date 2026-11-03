# Negative

An Arabic RTL home for a movie and series creator, built with React, TypeScript and Vite. Includes Home, Discover, About, and sample editorial detail pages, an Apple-inspired responsive design, local cinematic SVG artwork, and self-hosted Noto Kufi Arabic.

## Development

Use Node 22.13.1 (see `.nvmrc`), or a newer supported Node release, then:

```sh
npm ci
npm run dev
```

```sh
npm run lint        # Oxlint
npm test            # Vitest + React Testing Library
npm run build       # TypeScript and production build
npm run check       # All checks
npm run preview     # Preview dist after building
```

## Content

All Arabic copy, page metadata, sample stories, and social account configuration live in `src/content/ar.json`. Components import this file instead of embedding Arabic strings. Change `brand`, `brandLatin`, and `meta` to adjust the identity.

Set each `social.platforms[].url` to your actual account URL. A null URL displays a coming-soon label rather than a misleading link. Editorial cards are explicitly marked as demo content; replace them as real reviews become available. Artwork lives in `public/art/`.

## GitHub Pages

1. Push this repository to GitHub on the `main` branch.
2. Open **Settings → Pages → Build and deployment**, and select **GitHub Actions**.
3. The included workflow runs lint, tests, and build before deploying `dist`.

Pull requests run the same checks without deploying. If your default branch differs, update `.github/workflows/deploy.yml`.

Relative asset paths (`base: './'`) support both repository Pages sites and root/custom-domain sites. Hash routing keeps navigation and refreshed deep links working on GitHub Pages without server rewrites. No secrets or backend are required. Deployment has been configured but has not been triggered from this workspace.

## Tests

Tests cover navigation, category filtering, search and empty results, story detail navigation, missing routes, and unconfigured social accounts. Run `npm run test:watch` while editing. Responsive browser checks cover Home, Discover, About, and story detail at 320, 390, 768, 1024, and 1440 CSS pixels, verifying loaded logos and no horizontal overflow. The header, footer, and favicon use `src/assets/brand_logo.png`.

The test environment uses jsdom 26 to support Node 22.13.1. Keep its compatible major range when updating dependencies; newer jsdom majors can require newer Node versions. CI reads `.nvmrc` to verify the documented development version.

## Appearance

The default is **System**: the site follows the operating system's light/dark preference, including changes during a visit. The header's appearance buttons offer System, Light, and Dark. Manual selections persist in local storage; if storage is unavailable they still work during the visit. An early script in `index.html` applies the preference before rendering.

Theme colors are defined as CSS variables in `src/index.css`. Arabic appearance labels live in `src/content/ar.json`. The header, footer, and favicon use the black `brank_dark.png` logo for light mode and the white `brand_logo.png` logo for dark mode. CSS frames the original artwork without modifying the files.
