# Blog articles

Each article is a separate JSON file: `src/content/ar/articles/<id>.json`.
Its single cover image is `src/assets/articles/<id>.webp` (same ID; `.jpg`, `.jpeg`, and `.png` are also supported).
Images are bundled by Vite, with hashed URLs for caching and deployment under any base path.
Use lowercase letters, numbers, and hyphens for stable IDs and article URLs (`/#/blog/<id>`).

Example structure (documentation only; no sample article is published):

```json
{
  "id": "cinema-and-memory",
  "title": "السينما والذاكرة",
  "excerpt": "مقدمة قصيرة تظهر في بطاقة المقال.",
  "writer": "اسم الكاتب",
  "readMinutes": 4,
  "publishedAt": "2026-11-11",
  "imageAlt": "وصف الصورة للقارئ",
  "paragraphs": ["الفقرة الأولى من المقال.", "الفقرة الثانية."],
  "status": "draft"
}
```

Store the cover as `src/assets/articles/cinema-and-memory.webp`.
Set `status` to `published` once the text and cover are ready.
Drafts are excluded from the home page, blog listing, and direct article URLs.
Published articles require a cover; missing images, invalid dates, and IDs that do not match filenames fail the build.
Reading duration is a positive whole number of minutes. Use a real calendar date in YYYY-MM-DD format.
Articles display newest first; the home page shows the latest three.
Paragraphs are plain text, rendered safely without raw HTML. For a section heading, insert an object among the paragraphs:

```json
{ "type": "heading", "text": "عنوان القسم" }
```

Headings render as styled `h2` elements, preserving the original wording.
