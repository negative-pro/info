# نيجاتيف

رؤية الفن من خارج الصندوق

An Arabic RTL movie and series site built with React, TypeScript, and Vite. Includes Home, Discover, category pages, About, and editorial detail pages. Noto Kufi Arabic is self-hosted. Appearance defaults to the system, with saved light and dark overrides.

## Development

Use Node 22.13.1 (`.nvmrc`), or a newer supported Node release:

```sh
npm ci
npm run dev
```

```sh
npm run lint        # Oxlint
npm test            # Vitest + React Testing Library
npm run test:watch  # Watch tests
npm run build       # TypeScript and production build
npm run check       # Lint, tests, and build
npm run preview     # Preview dist after building
```

jsdom 26 supports Node 22.13.1. Newer jsdom majors may require a newer Node version. CI reads `.nvmrc`.

## Editing content

Arabic content lives in `src/content/ar/`:

| File | Purpose |
| --- | --- |
| `texts.json` | Interface labels, marketing text, SEO metadata, and brand |
| `arabic-movies.json` | Arabic category metadata, film/series records, and associated posts/videos |
| `social-accounts.json` | Social profile links, community copy, and optional audience statistics |
| `foreign-movies.json` | Foreign category metadata, film/series records, and associated posts/videos |

Each `*-movies.json` file has two fields: `category` and `items`. Each item contains its social/editorial content and optional embedded `work` details (`null` when absent). Category ownership comes from the containing file, so items have no stored `categoryId` or `productionId`. Empty item arrays are supported.

To add a category, copy a category file to a new `*-movies.json` file. Give it a unique category `id`, URL `slug`, Arabic name and description, and sorting order. `src/data/catalog.ts` discovers these files automatically. No component changes are required.

`src/models/item.ts` defines `ContentItem`, the UI's `CatalogItem` (with derived category context), and `SaveContentRequest`. `src/models/work.ts` defines embedded `WorkDetails`; `src/models/content.ts` defines category/shared models and re-exports the item and work models. TypeScript strict mode is enabled for the app and development tools. `src/models/validation.ts` validates category JSON at runtime before the catalog or local editor consumes it, because TypeScript cannot validate JSON through a glob import.

The catalog combines category files for the UI. Items keep stable IDs and existing story URLs. Work details belong to each item; multiple items about one film each contain their own copy of its metadata.

### Posts and film details

Items use `kind: "post"` or `"video"` and `platform: "website"`, `"facebook"`, or `"youtube"`. Titles, descriptions, paragraph arrays, links, demo flags, and optional ISO publication dates live with the item. Use `isDemo: true` for illustrative content. The homepage banner displays the brand image on its own, without story text or review links.

Embedded `work` details support film/series type, year, optional `partNumber` for a film’s installment number (for example, 2 for a sequel), optional `seasonCount` for a series’ total seasons, directors, writers, editors, provider IDs, source links, and optional IMDb metadata. Unknown values stay `null` or empty arrays and are omitted from the UI. IMDb ratings are snapshots on a 0–10 scale; record the vote count and ISO `checkedAt` when verifying a rating.

The Rip review uses the supplied YouTube title and URL. Verified film details come from [Netflix Tudum](https://www.netflix.com/tudum/articles/rip-ben-affleck-matt-damon-release-date-photos-news), with a link to its [IMDb page](https://www.imdb.com/title/tt32642706/). No unverified rating or editor credit is supplied. The homepage banner uses `src/assets/backgrounds/home-banner.png`. YouTube review thumbnails open the original video in a new tab; titles open the local review. Thumbnails are derived from validated YouTube video URLs and fall back to the shared placeholder if loading fails. Category tiles and content without a YouTube thumbnail use the shared `src/assets/placeholders/content-placeholder.png` image.

### Facebook and account links

On desktop, click a Facebook post's date/time, then copy its browser address. In the app, use Share → Copy link when available. Paste that specific post URL into `externalUrl` in the relevant category file, replace its example text, and set `isDemo` to `false`. Use a public post so visitors can open it. No embed code or API token is required. A null link displays a pending label.

Account/profile links belong in `src/content/ar/social-accounts.json`. Set each `url` to your actual HTTPS profile/channel/group link. The entire card then opens that link in a new tab. A null URL displays a coming-soon label.

Each account also supports `followerCount`, `subscriberCount`, `monthlyVisitors`, and `statsUpdatedAt` (an ISO date). Leave unknown counts as `null`; no audience counts are invented or fetched live. For example, setting Instagram's `followerCount` to `12000` produces its Arabic invitation with that number. The `communityText` field is used without counts; `communityWithFollowers` and `communityWithSubscribers` use the `{count}` placeholder. All invitation text stays in this JSON file. Platform icons use SVG assets in `src/assets/social/`, rendered as CSS masks with platform colors and theme-aware backgrounds. No raster filters or blending are applied. Audience counts appear once above the general community invitation. Existing count-based copy templates remain in the configuration for future layouts.

### Provider icons and logos

Shared provider configuration lives in `src/data/providers.json`. Add an icon to `src/assets/`, then set `iconAsset` to its relative path, such as `providers/netflix.svg`. Missing icons fall back to the provider name. Reference provider IDs in each item's `work.providerIds` array.

The header and footer use black `brand/logo-black.png` in light mode and white `brand/logo-white.png` in dark mode, with transparent backgrounds. The browser tab always uses `public/favicon.svg`. Theme colors are CSS variables in `src/index.css`; an early script in `index.html` prevents a theme flash.

## GitHub Pages

Push to `main`, then select **Settings → Pages → Build and deployment → GitHub Actions**. The included workflow checks the code and deploys `dist`. Pull requests run checks without deploying. Change the workflow if your default branch differs.

Relative asset paths and hash routing support repository Pages URLs, custom domains, and refreshed deep links without server rewrites. No backend or secrets are required. Deployment is configured but has not been triggered from this workspace.

## Verification

Tests cover category isolation, search and format filters, external links, conditional metadata, demo handling, missing routes, theme behavior, and data integrity. Responsive browser checks have covered the main layouts from 320 to 1440 CSS pixels.

### Platform filters and thumbnails

Discover filters by YouTube, Facebook, Instagram or TikTok. `?platform=tiktok&q=...` preserves the selection and search. A category defaults to its first available platform in the displayed platform order; selecting a platform with no content shows an empty state. Adding Instagram content uses `platform: "instagram"` in the category file.

YouTube thumbnail URLs are derived automatically. TikTok and Instagram cards and detail pages use lazy-loaded hosted video previews with links to the original posts; they do not require local thumbnail images. Previews depend on the post remaining public and embeddable. Instagram may show a login or availability message inside its preview. The local editor tries to retrieve public covers for Facebook, TikTok and Instagram when saving a video link. Successful covers are cached automatically and referenced through the internal `thumbnailAsset` field. No cover uploads or manual asset paths are required. Cached covers are bundled locally so temporary CDN signatures cannot expire. Thumbnail clicks open the original external URL in a new tab; titles open the local detail page. Set `videoLayout` to `portrait` for Shorts/Reels/TikTok (9:16), or `landscape` for regular video (16:9). Portrait cards use a narrower column and retain the complete image. Card thumbnails include a small SVG platform badge; streaming providers sit in an integrated card footer. Platform names display in Arabic. Missing or failed thumbnails use the branded placeholder.

The existing TikTok and Instagram covers were retrieved from their public pages. The supplied Facebook Reel exposes a black preview, so it uses the branded fallback. Retrieval can also fail for private, blocked or unavailable media; saving the video still succeeds. No access tokens or live scraping are required by the deployed app.

## Local content editor

Start `npm run dev` and open the site on `localhost` or `127.0.0.1`. The footer's **إضافة محتوى** link opens `/#/local/add`.

The form appends videos to the selected `*-movies.json` file. It supports Arabic/foreign categories, YouTube, Facebook, Instagram and TikTok videos, descriptions, external links, publication dates, portrait/landscape layouts, and optional embedded film/series metadata. Optional fields include credits, streaming providers, IMDb information and source links. The form has no image uploads or asset-path fields. You supply the original video link; YouTube covers are resolved automatically, while supported public Facebook, Instagram and TikTok covers are fetched on save and cached automatically in `src/assets/thumbnails/`. If the cover is unavailable, saving still succeeds and the branded fallback is used.

Item IDs are generated automatically as UUID-based identifiers when saving; embedded work details have no separate ID. No ID fields are shown. This form adds content rather than editing or overwriting entries. After saving, follow **عرض المحتوى** to see it in the UI. The JSON and automatically cached covers are ordinary repository files: commit and push them to publish through GitHub Pages.

The editor route, footer link, form code and CSS are excluded from production builds. Its JSON-writing middleware runs only in the Vite development server and accepts same-origin requests from a loopback address. `npm run preview` and deployed GitHub Pages sites have no save endpoint. No API token or backend deployment is needed.

Editor tests use isolated temporary directories; they verify appending data, metadata validation, automatic preview caching, duplicate protection, concurrent saves, and request-origin restrictions.

`work.partNumber` and `work.seasonCount` accept positive integers or `null` (and may be omitted). Only films can have a part number; only series can have a season count. Unknown values are hidden in the detail page. The local editor shows the relevant field for the chosen work type.

Additional optional work metadata: `cast`, `genres`, `countries`, and `languages` are string arrays; `synopsis` is the plot summary (separate from the item description/review); `franchise` names the film franchise. `runtimeMinutes` is a positive integer for films only. `seasonNumber` identifies the series season discussed by the item and must not exceed `seasonCount` when both are known. Unknown lists use `[]`; unknown text/numbers use `null` or may be omitted. These fields are supported by the local editor and displayed on story detail pages when supplied. Cast, genres, countries, languages, synopsis, and franchise are also searchable.

### Local dashboard

Run the development server and open `/#/dashboard` (the site uses hash routing), or use the dashboard link in the footer. Search all content and filter by category, platform, film/series type, and visibility. Add content from `/#/dashboard/new`; the previous `/#/local/add` address redirects there.

Hide/show controls persist the optional `hidden` boolean in the item's category JSON. Hidden items remain available in the dashboard but are excluded from Home, Discover, category listings, search, and story detail routes. Rebuild and deploy the site to publish visibility changes. The dashboard and writing API are available only in local development, following the existing editor setup.

The dashboard also manages social-account visibility and audience statistics. Hide/show and saved numbers update `src/content/ar/social-accounts.json` through the local API. Blank statistic fields save as `null` and are omitted from public cards; zero is displayed. Hidden accounts are omitted from the public social section.
