# Filter / library exposure (implemented)

## `component-filters` → `main`

Allows both a **default section** and the **Chapter section** at page root:

```json
[
  { "id": "main", "components": ["section", "chapter"] },
  { "...": "./_section.json#/filters" },
  { "...": "../blocks/*/_*.json#/filters" }
]
```

## Default `section` filter

Existing blocks minus the retired ones:

- removed: `chapter` (was a block), `vertical-slider`, `command-bar`
- kept: `text`, `image`, `button`, `title`, `hero`, `product-hero`, `cards`, `explore-panels`, `columns`, `fragment`, `content-block`, `dealer-locator`, `zoom-panel`, `hero-immersive`, `image-text`, `tyre-sizes`, `tyre-detail`, `geo-banner`, `intelligence-hub`

`command-bar` is intentionally removed from default sections; author it on a fragment page only.

## `chapter` section filter

Allows only what belongs inside a slide:

- `title` — headline (`<h1>`)
- `image` — background media
- `text` — supporting copy (optional)
- `fragment` — for the shared Command Bar reference (first chapter) or a rare per-chapter override

## Vertical Carousel

Not exposed to authors — no UE definition. Created at runtime by `wrapChapterSections` in `scripts/scripts.js`.
