# Apollo Tyres homepage — content model

Scope: **01 Apollo Tyres** immersive homepage (vertical chapters + shared command bar).  
Constraint: EDS allows only **section → blocks** (no nested blocks). Complex containers are **sections + runtime assembly**.

Status: **implemented** in this repo. This file is the reference doc.

---

## 1. Mental model

| Runtime UI | Authored as | Where |
|---|---|---|
| Vertical carousel | Consecutive **Chapter** sections wrapped at runtime | `scripts.js` → `wrapChapterSections` |
| Full-viewport slide | **Chapter** section | `models/_chapter.json` |
| Slide media + headline | Default content inside the Chapter section (`<h1>`, `<picture>`) | authoring |
| Rail label + thumb, prompt, icon, chips, anchor | Chapter **section metadata** (`data-*`) | `models/_chapter.json` |
| Command bar chrome + behavior | **Fragment** page with one Command Bar block | `/fragments/command-bars/…` |
| Prompt / icon / chips per active chapter | Fired via `apollo:command-bar:sync` from carousel to Command Bar | `blocks/vertical-carousel/vertical-carousel.js` + `blocks/command-bar/command-bar.js` |
| Geo region banner | `geo-banner` block in a normal section | authoring |
| Logo / header / footer | Existing page chrome | `head.html` / header block |

```
Page
├── Chapter section (Personal)      ← LCP: <h1> + <picture> + Fragment(command-bar)
├── Chapter section (Commercial)
├── Chapter section (Agriculture)
├── Chapter section (Support)
├── Chapter section (Stories)
├── Chapter section (Know Apollo)
└── Section: geo-banner (optional; can be deferred)

Runtime → <div class="vertical-carousel"> ... chapter sections ... </div>
          Command Bar hoisted from fragment into carousel chrome.
```

---

## 2. Files

### Models

- `models/_chapter.json` — Chapter **section** definition (`resourceType: core/franklin/components/section/v1/section`), model (section metadata), filter.
- `models/_section.json` — includes `_chapter.json` in definitions / models / filters.
- `models/_component-filters.json` — `main` allows `section` and `chapter`.

### Runtime block (no UE definition — never inserted by authors)

- `blocks/vertical-carousel/vertical-carousel.js` — rail, active-slide observer, prompt sync, command-bar hoist.
- `blocks/vertical-carousel/vertical-carousel.css` — scroll-snap slides, rail, command host.

### Wiring

- `scripts/scripts.js` — `wrapChapterSections(main)` (sync) after `decorateSections`; `initChapterCarousel(wrapper)` (dynamic import).
- `blocks/command-bar/command-bar.js` — listens for `apollo:command-bar:sync` and updates placeholder / icon / chips / segment.
- `blocks/command-bar/command-bar.css` — chip row styling.

### Draft content

- `drafts/apollo-tyres-homepage/homepage.html` — sample page for `--html-folder drafts` testing.
- `drafts/apollo-tyres-homepage/fragments/command-bar.html` — the shared fragment.

---

## 3. Chapter section model

**Author-facing metadata fields** (element-grouped to satisfy `xwalk/max-cells`; rendered as `data-*` after decorate):

| Field | Dataset key | Purpose |
|---|---|---|
| `name` | — (UE tree only) | Content Tree label |
| `id` | section `id` attribute | Reserved section anchor |
| `rail_label` | `dataset.railLabel` | Right-rail card label |
| `background_image` / `background_alt` | `dataset.backgroundImage` / `dataset.backgroundAlt` | DAM image (`reference`, rootPath `/content/dam/aemeds`); poster when video is set |
| `background_video` | `dataset.backgroundVideo` | DAM video (`reference`, rootPath `/content/dam/aemeds`) |
| `rail_label` | `dataset.railLabel` | Right-rail card label |
| `rail_thumb` / `rail_alt` | `dataset.railThumb` / `dataset.railAlt` | Rail card image + alt (DAM) |
| `command_prompt` | `dataset.commandPrompt` | Placeholder synced onto the shared bar |
| `command_icon` | `dataset.commandIcon` | Leading icon token (`car`, `search`, `tyre`, `none`) |
| `command_segment` | `dataset.commandSegment` | Personal / Commercial / Agriculture / Support / Stories / Know Apollo |
| `command_chips` | `dataset.commandChips` | Comma-separated labels rendered as chips |
| `command_cue` | `dataset.commandCue` | Optional “Scroll to explore” pill |
| `command_align` | `dataset.commandAlign` | Shared bar vertical position: `top` / `middle` / `bottom` |

Names use single-underscore element grouping (`groupname_field`) so they respect the `xwalk/max-cells` (≤4 top-level groups) and `xwalk/invalid-field-name` (≤1 `_`) rules while keeping tidy `dataset.*` keys after `toClassName` + `toCamelCase`.

**Template-injected (hidden):** `chapter: "true"` — used by `wrapChapterSections` for detection.

**Chapter filter allows:** `title`, `text`, `image`, `fragment`.  
Authors put the headline as **Title (h1)** and background as **Image** in the section body; both are default content and get real semantic markup.

---

## 4. Vertical Carousel runtime

`scripts/scripts.js`:

```
decorateIcons → buildAutoBlocks → decorateSections
              → wrapChapterSections (sync)
              → decorateBlocks → decorateButtons
              → initChapterCarousel (dynamic import)
```

`wrapChapterSections`:

1. Selects `main > .section[data-chapter="true"]`.
2. Wraps them in `<div class="vertical-carousel" role="region" tabindex="0">`.
3. If the next sibling is a `.section` containing `.fragment`, moves it in as chrome host.

Chapter sections keep `.section` and inner block wrappers, so `decorateBlocks` and `loadSection` continue to work unchanged.

`initChapterCarousel` (in `blocks/vertical-carousel/vertical-carousel.js`):

1. `stageChapterMedia` — moves the first `<picture>` / `<video>` into a `.vertical-carousel-media` layer positioned behind chapter content.
2. `attachScrollCue` — renders scroll cue if `data-scroll-cue-label` is set.
3. `buildRail` — one button per chapter (label + thumb).
4. `hoistCommandBar` — MutationObserver waits for the fragment block’s inner `.command-bar` and moves it into `.vertical-carousel-command-host` (fixed at bottom).
5. `observeActiveChapter` — IntersectionObserver + Arrow/Page keys set active index, update rail, dispatch `apollo:command-bar:sync`.

---

## 5. Sync contract

Coordinator → Command Bar:

```js
window.dispatchEvent(new CustomEvent('apollo:command-bar:sync', {
  detail: {
    placeholder: '…',       // becomes input.placeholder
    leadingIcon: 'car',     // swaps .icon.icon-<name>
    segmentHint: 'personal',
    chips: ['Warranty', 'FAQ'],
    chapterId: 'personal',
    source: 'vertical-carousel',
  },
}));
```

Command Bar (`blocks/command-bar/command-bar.js`) listens once during decorate, keeps its authored behavior (`action`, submit event, etc.), and overlays chapter-driven context.

---

## 6. Authoring recipe

1. Author the fragment `/fragments/command-bars/homepage` with a **Command Bar** block. Set `robots: noindex`.
2. On the homepage:
   - **Chapter** section 1 (Personal) — Title, Image, and a **Fragment** referencing the command-bar fragment. Fill metadata.
   - **Chapter** sections 2…N in scroll order. Fill metadata (rail label, prompt, icon, chips, segment hint).
   - Optional last section: **Geo Banner**.
3. Preview / publish fragment before the page.

---

## 7. What we deliberately do not do

- Nest Chapter blocks inside a Vertical Carousel block ([FAQ](https://www.aem.live/docs/faq): no nested blocks).
- Duplicate the Command Bar in every chapter.
- Model the right rail as N separate blocks.
- Prefix the shared bar with a per-chapter fragment (one fragment is enough).

---

## 8. What was replaced

- `blocks/chapter/` (block-based chapter) — deleted.
- `blocks/vertical-slider/` (container block with nested chapter items) — deleted.
- `scripts/nested-blocks.js` — deleted (its consumers are gone).

---

## 9. Follow-ups

- Fragment sidecar loading: `hoistCommandBar` currently waits for the block to appear; consider awaiting `loadFragment` explicitly if a race is observed.
- Reduced-motion: disable scroll-snap smoothing for `prefers-reduced-motion`.
- Rail visibility on mobile: hide behind a toggle if space is tight.
- Localization: `commandPrompt` is authored per chapter; already localizable.
