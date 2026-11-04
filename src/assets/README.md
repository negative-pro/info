# Assets

- `brand/`: transparent black and white logos, selected by the site theme.
- `backgrounds/`: homepage banner artwork.
- `placeholders/`: shared fallback for category cards and unavailable thumbnails.
- `social/`: SVG platform marks and their source/license information.

Use lowercase kebab-case filenames. Import static UI images directly. Content `thumbnailAsset` and provider `iconAsset` values are relative to this directory and resolved by `src/data/catalog.ts`. Put future provider icons in `providers/` when needed.

The local editor creates `thumbnails/` automatically when caching new post covers. No cached covers are currently included.

When moving or deleting an image, update imports, content/configuration paths, tests, and documentation. Keep the attribution and license files alongside the social marks.
