# Apollo Tyres — EDS Block Specification

**Parent:** [specs.md](../specs.md)  
**Prototype:** [Concept Design — Apollo Tyres](https://www.figma.com/proto/VM6Cr4RxOJQFiqyDIRAbjF/Concept-Design?node-id=1795-11272&starting-point-node-id=1795%3A11272&show-proto-sidebar=1)  
**Status:** Phase 1 in progress — `chapter`, `command-bar`, `geo-banner` + `scripts/overlay-events.js`  
**Scope:** Edge Delivery Services blocks, page composition, coupling rules, and delivery order for the Apollo Tyres consumer homepage + Find My Tyre + PDP path only.

---

## 1. Goals

1. Deliver the Apollo Tyres consumer flow (cinematic scroll homepage → Intelligence hub → Find My Tyre → PDP) as **independent EDS blocks**.
2. Keep each block to **one job** so pieces stay reusable across homepage and PDP without forks.
3. Couple blocks via **custom events + session helpers** in `scripts/`, never via direct block-to-block imports.
4. Prefer **extending existing** `header`, `footer`, `cards`, `fragment`, `product-gallery`, `product-specs`, `product-reviews` over replacing them.

---

## 2. Design principles

| Principle | Rule |
|-----------|------|
| One job | Present content, collect input, *or* host an overlay — not all three in one block |
| Compose, don’t nest logic | Sections + authored siblings; overlays load once and open on events |
| Variants ≠ new blocks | Use model fields / section metadata / CSS theme tokens (`--brand-accent`) |
| Shared logic in `scripts/` | Vehicle session, overlay events, typeahead API, modal a11y helpers |
| Author-safe wizards | Multi-step Find My Tyre is **one** block (`tyre-finder`); steps are internal modules, not separate authorable blocks |

### Anti-patterns (explicitly out of scope)

- `hero-commercial`, `hero-agriculture`, … (use `chapter` + fields)
- Mega-block that merges Intelligence + Find My Tyre
- One EDS block per wizard step
- Command bar baked only into hero
- Block A importing Block B’s `decorate`

---

## 3. Event & session contracts

Cross-block communication uses `window` custom events and a small session helper. Event names are stable API — change only with a migration note.

### 3.1 Events

| Event name | Detail (proposed) | Fired by | Handled by |
|------------|-------------------|----------|------------|
| `apollo:open-intelligence` | `{ query?, source? }` | `command-bar`, header/menu | `intelligence-hub` |
| `apollo:close-intelligence` | `{}` | hub close, route change | `intelligence-hub` |
| `apollo:open-finder` | `{ step?, category?, vehicle?, source? }` | Intelligence cards, `command-bar`, `vehicle-context` Edit | `tyre-finder` |
| `apollo:close-finder` | `{}` | finder close, successful handoff | `tyre-finder` |
| `apollo:open-nav` / `apollo:close-nav` | `{}` | header MENU | `nav-rail` / header |
| `apollo:vehicle-updated` | `{ vehicle }` | `tyre-finder` on commit | `vehicle-context`, optional listeners |
| `apollo:open-dealer` | `{ product?, size?, vehicle? }` | Intelligence / PDP CTA | future `dealer-locator` |

### 3.2 Vehicle session (`scripts/vehicle-session.js`)

Persists fitment across page loads (e.g. `sessionStorage`).

**Shape (proposed):**

```json
{
  "category": "car",
  "maker": "Honda",
  "model": "City",
  "year": "2020",
  "size": "185/55 R16 83H",
  "updatedAt": "ISO-8601"
}
```

- **Writer:** `tyre-finder` on successful complete (and optionally partial saves).
- **Readers:** `vehicle-context`, PDP CTAs, future dealer locator.
- Blocks must not invent parallel storage keys.

### 3.3 Overlay utilities (`scripts/overlay-events.js` + modal helper)

- `dispatchOpenIntelligence(detail)`, `dispatchOpenFinder(detail)`, etc.
- Shared focus trap / Escape / scroll-lock for modals (used by hub + finder + nav).

---

## 4. Block inventory

### 4.1 Summary

| Block | Status | Job | Primary pages |
|-------|--------|-----|---------------|
| `header` | Extend | Logo, MENU trigger | All |
| `footer` | Extend | Footer IA + legal + market | All |
| `fragment` | Existing | Shared header/footer/overlay hosts | All |
| `cards` | Existing | Campaign / story cards | Homepage Stories |
| `product-gallery` | Existing | Product imagery | PDP |
| `product-specs` | Existing | Rim filters, size table, brochure | PDP |
| `product-reviews` | Existing | Reviews | PDP |
| `geo-banner` | **New** | Market confirm / change / dismiss | Homepage (first viewport) |
| `chapter` | **New** | Full-bleed media + headline + optional scroll cue / scene thumb | Homepage chapters |
| `command-bar` | **New** | Icon + input + submit (+ optional attach) | Homepage, hub, PDP |
| `link-chips` | **New** (optional) | Shortcut link row | Support / Know chapters |
| `nav-rail` | **New** / header variant | Image-card destination menu | Global |
| `intelligence-hub` | **New** | Overlay router: cards + assist bar | Global (once) |
| `tyre-finder` | **New** | Guided Find My Tyre wizard | Global (once) |
| `vehicle-context` | **New** | “Your vehicle” chip + Edit | PDP (and optionally sticky global) |
| `product-hero` | **New** / gallery variant | Name, metrics strip, Compare / Find Dealer | PDP |
| `feature-accordion` | **New** | Expand/collapse feature/benefit rows | PDP |
| `dealer-locator` | **Later** | Dealer search overlay/page | From hub / PDP |

---

## 5. New block specifications

### 5.1 `geo-banner`

**Purpose:** Confirm or change market/region.

**Authoring fields (proposed):**

- Message text
- Continue label
- Default market label (or market list fragment/reference)
- Dismissible (boolean)

**Behavior:**

1. Show when market preference missing / stale (local rules TBD).
2. **Continue** → persist market, hide.
3. Market control → selector (inline or nested UI).
4. **X** → dismiss without change (or keep last known).

**Independence:** No dependency on chapter/command-bar. Theme-only coupling via CSS.

---

### 5.2 `chapter`

**Purpose:** One scroll “chapter” visual — media + headline. Replaces one-off hero variants.

**Authoring fields (proposed):**

- Background media (image and/or video)
- Headline (richtext or plain)
- Optional scene thumbnail (image + alt)
- Show scroll cue (boolean) + scroll cue label (default “Scroll to explore”)
- Optional eyebrow / supporting line

**Behavior:**

- Decorative / navigational only (scroll cue scrolls to next section).
- Does **not** open Intelligence or Finder.

**Section notes:** Place in a full-bleed section. Pair with sibling `command-bar` (and optional `link-chips` / `cards`).

**Relation to existing `hero`:** **Decision (locked):** keep existing `hero` unchanged; use **`chapter`** for Apollo homepage scroll chapters.

---

### 5.3 `command-bar`

**Purpose:** Universal NL / assist entry control.

**Authoring fields (proposed):**

- Placeholder text
- Leading icon (enum or icon reference): `car` | `search` | `tyre` | …
- Submit label / aria-label
- Show attach control (boolean)
- **Action** enum:
  - `open-intelligence`
  - `open-finder`
  - `navigate` (+ URL)
  - `query` (submit query string to configured endpoint / event)
- Optional default query / segment hint (`personal` | `commercial` | `agriculture` | `support` | `stories`)

**Behavior:**

- Focus or submit → perform Action (typically dispatch `apollo:open-intelligence` with `{ query, source }`).
- Must work identically on homepage chapters, inside Intelligence (assist bar can be an instance or embedded config), and on PDP (“Ask Apollo”).

**Independence:** Never imports hub/finder. Only events / navigate.

---

### 5.4 `link-chips`

**Purpose:** Compact row of text links/chips (FAQ, Warranty, Sustainability, Know Apollo).

**Authoring:** Multi link field (label + URL).

**Independence:** Pure links; no overlays.

---

### 5.5 `nav-rail` (or header variant)

**Purpose:** Full-screen / right-rail image cards for primary destinations.

**Authoring:** Card items — image, label, link or action (`open-intelligence` with segment, navigate).

**Destinations:** For Personal, For Commercial, For Agriculture, Help & Support, Stories, Know Apollo.

**Behavior:** Opened via MENU / `apollo:open-nav`; Escape / backdrop closes.

---

### 5.6 `intelligence-hub`

**Purpose:** “Welcome to Apollo Intelligence” overlay — journey **router**, not the tyre wizard.

**Authoring fields (proposed):**

- Title (e.g. Welcome to Apollo Intelligence)
- Cards (container or multi): image, title, layout hint (`large` | `standard`), action:
  - `open-finder`
  - `navigate` + URL
  - `open-dealer`
  - `open-support` / navigate
- Embed or reference bottom assist: placeholder + action (usually query → same hub or finder)

**Cards (from prototype):**

| Card | Action |
|------|--------|
| Find My Tyre | `open-finder` |
| For Personal | navigate or segment hint |
| For Commercial | navigate or segment hint |
| For Agriculture | navigate or segment hint |
| Find Dealers | `open-dealer` / navigate |
| Help & Support | navigate |

**Behavior:**

- Hidden until `apollo:open-intelligence`.
- Close → `apollo:close-intelligence`; restore focus to opener when possible.
- Does **not** implement maker/model/year steps.

**Load strategy:** Single instance per page via fragment or delayed block near end of `main` / body.

---

### 5.7 `tyre-finder`

**Purpose:** Guided Find My Tyre wizard (single authorable block).

**Authoring fields (proposed):**

- Optional title overrides per step
- Category items: image/model, label (`Car`, …), value id
- Enable skip on year / size (booleans)
- Enable upload tyre photo (boolean)
- Completion: navigate URL pattern or “use product search results” (TBD with product API)
- Labels: Select, Find by tyre size, Skip, Upload, Close, prompts

**Internal steps (not separate blocks):**

| Step | UI | Notes |
|------|----|------|
| A Category | Horizontal carousel + Select + Find by tyre size bar | Arrows cycle focus item |
| B Confirm / size shortcut | Category confirm or jump to size path | |
| C Maker | Typeahead | API-backed suggestions |
| D Model | Typeahead filtered by maker | |
| E Year | Input + Skip | |
| F Size | Input + Upload photo + Skip | |
| Complete | Persist session + navigate PDP / PLP | Dispatch `apollo:vehicle-updated` |

**Behavior:**

- Open on `apollo:open-finder` (optional seed in event detail).
- Close clears ephemeral UI state; session write only on commit (policy TBD for partial).
- Typeahead / upload calling code lives under `scripts/` (e.g. `scripts/tyre-finder/`).

**Independence:** Does not render Intelligence cards. Does not own PDP chrome.

---

### 5.8 `vehicle-context`

**Purpose:** Show persisted fitment; Edit re-opens finder.

**Authoring:** Labels (“Your vehicle”, Edit aria-label); empty-state hide or CTA.

**Behavior:**

- Read `vehicle-session` on load; listen for `apollo:vehicle-updated`.
- Edit → `apollo:open-finder` with current vehicle as seed.

---

### 5.9 `product-hero`

**Purpose:** PDP top stage — product name, metrics, primary CTAs.

**Authoring / data:**

- Name (authored or API-composed)
- Metrics: price, long life, made for, tread warranty (+ info)
- CTAs: Compare (URL or event), Find Dealer (`apollo:open-dealer`)
- May sit above/beside `product-gallery`

**Freshness:** Price (and similar) follow [page-type-playbook](./page-type-playbook.md) — hydrate when must be current; do not bake volatile price into publish snapshot without a refresh strategy.

---

### 5.10 `feature-accordion`

**Purpose:** Expand/collapse feature & benefit rows (+ / −).

**Authoring:** Items — title, body (richtext), defaultExpanded.

**Reuse:** PDP Technology/Features; usable on other Apollo pages later if needed.

---

## 6. Page templates

### 6.1 Homepage (`/`, market homepage)

```text
header (fragment)
geo-banner

section.chapter-hero          chapter + command-bar              // GO THE DISTANCE
section                       chapter + command-bar              // BUILT TO HAUL
section                       chapter + command-bar + link-chips // READY TO SUPPORT
section                       chapter + command-bar + cards      // HAR SAFAR…
section                       chapter + command-bar              // OUTLAST EVERY HARVEST
section                       chapter + command-bar + link-chips // DISTANCE STARTS HERE

intelligence-hub   (once)
tyre-finder        (once)
footer (fragment)
```

**Chapter field matrix (content intent):**

| Chapter | Headline | Command placeholder | Typical action |
|---------|----------|---------------------|----------------|
| Hero | GO THE DISTANCE | I’m looking for car tyres | `open-intelligence` |
| Commercial | BUILT TO HAUL | I’m looking for commercial tyres | `open-intelligence` (+ segment) |
| Support | READY TO SUPPORT | I want help with tyre warranty | `open-intelligence` / navigate support |
| Stories | HAR SAFAR MEIN DUM HAI | I am looking for promotions | `open-intelligence` / navigate stories |
| Agriculture | OUTLAST EVERY HARVEST | I’m looking for agriculture tyres | `open-intelligence` (+ segment) |
| Brand | DISTANCE STARTS HERE | Get to know Apollo | `open-intelligence` / navigate |

### 6.2 Product detail page

```text
header (fragment)

section                 product-hero + product-gallery (+ vehicle-context)
section                 command-bar                    // Ask Apollo
section                 feature-accordion / tags       // Features / Benefit / Technology
section                 product-gallery variant        // Gallery (if separate)
section                 product-specs                  // Spec + brochure
section                 product-reviews                // optional

intelligence-hub (once, if global fragment)
tyre-finder (once)
footer (fragment)
```

### 6.3 Overlay hosting

Prefer a **shared fragment** (e.g. `/fragments/overlays`) included on homepage + PDP so hub/finder are not re-authored per page. Fragment loads blocks; blocks stay inert until events fire.

---

## 7. Coupling diagram

```text
┌─────────────┐  apollo:open-intelligence   ┌──────────────────┐
│ command-bar │ ──────────────────────────► │ intelligence-hub │
└─────────────┘                             └────────┬─────────┘
       │                                             │
       │ apollo:open-finder                          │ apollo:open-finder
       ▼                                             ▼
┌─────────────┐                             ┌──────────────────┐
│tyre-finder  │ ◄── Edit ────────────────── │ vehicle-context  │
└──────┬──────┘   apollo:open-finder        └────────▲─────────┘
       │                                             │
       │ vehicle-session + apollo:vehicle-updated    │
       └─────────────────────────────────────────────┘

chapter / cards / link-chips / geo-banner / footer
        └── no overlay imports; content & links only

header / nav-rail ── apollo:open-nav ──► nav-rail
```

---

## 8. Mapping to product journeys

| Journey | Blocks involved |
|---------|-----------------|
| A — Tyre purchase discovery | `command-bar` → `intelligence-hub` → `tyre-finder` → PDP (`product-hero`, `vehicle-context`, …) |
| B — Segment browse from scroll | `chapter` + `command-bar` (+ `cards` / `link-chips`) → hub or navigate |
| C — Market confirmation | `geo-banner` |
| PDP assist / edit vehicle | `command-bar`, `vehicle-context` → hub / finder |
| Find Dealers (later) | hub / `product-hero` → `dealer-locator` |

---

## 9. Theming

- Page / site CSS variables: `--brand-accent` (purple), logo in header fragment, copy in models.
- Apollo Tyres consumer (India) is the only brand/market in scope for this specification.

---

## 10. Delivery order (implementation gate)

Do not start the next phase until the previous is reviewable.

| Phase | Deliverables | Exit criteria |
|-------|--------------|---------------|
| **0** | This spec agreed | Event names + homepage/PDP templates accepted |
| **1** | `chapter` + `command-bar` + `geo-banner` | **Done** — homepage shell + events; hub still stub |
| **2** | `intelligence-hub` | Opens/closes from command-bar; cards dispatch finder/navigate |
| **3** | `tyre-finder` + `vehicle-session` | Full wizard; session written; navigates to PDP (or mock) |
| **4** | `vehicle-context` + `product-hero` + `feature-accordion` | PDP shows fitment + metrics + accordion; Edit reopens finder |
| **5** | Header/nav-rail + footer IA | MENU + footer match IA |
| **6** | `dealer-locator` | When dealer UX is specified |

Existing `product-gallery` / `product-specs` / `product-reviews` integrate in Phase 4 as already available.

---

## 11. Acceptance checklist

- [ ] Homepage six chapters authorable without duplicate block types
- [ ] Command bar on any chapter opens Intelligence (or configured action)
- [ ] Intelligence **Find My Tyre** opens finder; Close returns to page
- [ ] Finder path Category → Maker → Model → Year → Size completes and lands on PDP with vehicle chip
- [ ] Skip year/size and Find by tyre size alternate path work
- [ ] Vehicle Edit on PDP reopens finder seeded with session
- [ ] Geo banner continue/dismiss does not break LCP chapter
- [ ] No block imports another block’s module graph for overlay control
- [ ] Lint + models pass (`npm run build:json`, `npm run lint`)

---

## 12. Open decisions (resolve before / during Phase 0–1)

1. ~~Evolve existing `hero` vs add `chapter`~~ — **Resolved:** keep `hero`; add `chapter`.
2. Intelligence card actions for Personal / Commercial / Agriculture: dedicated landings vs seeded Intelligence/Finder.
3. Finder completion URL strategy (SKU PDP vs PLP search).
4. Whether overlays live in a **fragment** on every template or are injected from `delayed.js` / scripts (fragment preferred for UE authoring).
5. Typeahead / upload API owners and contracts.
6. Compare CTA: page vs overlay (proto incomplete).

---

## 13. Related docs

- [specs.md](../specs.md) — product/UX specification from Figma  
- [page-type-playbook.md](./page-type-playbook.md) — authored vs API composition  
- [AGENTS.md](../AGENTS.md) — EDS project conventions  

---

*When Phase 0 is signed off, implementation begins at Phase 1 (`chapter`, `command-bar`, `geo-banner`) per §10.*
