# Apollo Tyres — Functional Specifications

**Source:** [Figma prototype — Concept Design (Apollo Tyres flow)](https://www.figma.com/proto/VM6Cr4RxOJQFiqyDIRAbjF/Concept-Design?node-id=1795-11272&starting-point-node-id=1795%3A11272&show-proto-sidebar=1)

**Scope:** Apollo Tyres consumer experience (India) — cinematic scroll homepage, Apollo Intelligence, Find My Tyre wizard, and product detail page (PDP). Other prototype flows are out of scope.

**EDS block architecture:** [docs/01-apollo-tyres-blocks.md](./docs/01-apollo-tyres-blocks.md)

---

## 1. Overview

| Item | Value |
|------|--------|
| Brand | Apollo Tyres (consumer) |
| Market default | India |
| Accent | Purple |
| Concept | Long-scroll homepage + AI tyre finder + PDP |

**Product capabilities in scope:**

- Natural-language / AI assistant entry (“Ask Apollo” / contextual search prompts)
- Segmented journeys by vehicle type (passenger, commercial, agriculture)
- Guided **Find My Tyre** wizard → product detail page (PDP)
- Geo / market awareness (country-region banner)
- Persistent global footer IA

---

## 2. Cross-cutting systems

### 2.1 Brand & market theming

- **Logo:** centered `apollo TYRES` in header
- **Accent:** purple for CTAs (circular submit arrows, selected chips)
- **Market default:** India (shown in geo banner)

### 2.2 Geo / country-region banner

**Placement:** Bottom of first viewport.

**Content:**

- Copy: “Choose another country or region to see content specific to your location.”
- Current market control (e.g. **India**) with chevron
- Primary **Continue**
- Dismiss (**X**)

**Behavior:**

1. On first visit (or when geo is ambiguous), show banner over hero.
2. User confirms current market via **Continue**, or opens selector to change market.
3. **X** dismisses without changing market (or keeps last known preference).
4. Market choice should drive language, currency, catalogue, dealer network, and campaigns.

### 2.3 Global search / AI command bar

Recurring control pattern:

| Element | Role |
|---------|------|
| Leading icon | Context (vehicle silhouette, search, tyre) |
| Text field | Placeholder / typed query with caret (`\|`) |
| Trailing circular CTA | Submit / continue |

**Placeholders by section context:**

- Hero: “I’m looking for car tyres”
- Commercial: “I’m looking for commercial tyres”
- Agriculture: “I’m looking for agriculture tyres”
- Stories / campaigns: “I am looking for promotions”
- Support: “I want help with tyre warranty”
- Brand / tech: “Get to know Apollo” / “I’m looking for innovation news”
- PDP: “Ask Apollo”

**Behavior:** Focus or submit opens **Apollo Intelligence** (or a section-configured assistant action), not a classic SERP-only page.

### 2.4 Scroll affordance

- Pill control: **“Scroll to explore”** + downward arrow
- Homepage is a **long vertical story**; each major chapter can refresh the command-bar placeholder and background media

### 2.5 Global navigation (menu)

**Entry:** Hamburger / **MENU** control (top-right).

**Destinations:**

- For Personal  
- For Commercial  
- For Agriculture  
- Help & Support  
- Stories  
- Know Apollo  

Menu can appear as a **right-rail of image cards** over the hero.

### 2.6 Global footer IA

| Column | Links |
|--------|--------|
| **FIND TYRES** | Passenger, Bike & Scooter, Commercial, Agriculture & Industrial |
| **DEALER** | Location, Contact Dealer |
| **HELP & SUPPORT** | Connect With Us, FAQs, Warranty |
| **KNOW APOLLO** | About Us, Sustainability |
| **STORIES** | Sports, Community, Journal, Campaigns |
| **BECOME A PARTNER** | Partners Hub |

**Legal / meta:** © 2027 Apollo Tyres Ltd · Privacy Notice · Terms & Conditions · Cookie Notice · India (market)

---

## 3. Homepage — chapter structure

Long-scroll page with chapter-like sections:

### 3.1 Hero — “GO THE DISTANCE”

- Full-bleed cinematic background (image/video)
- Centered logo
- Large italic headline: **GO THE DISTANCE**
- Command bar: car icon + “I’m looking for car tyres” + purple submit
- Optional small media thumbnail (top-right) for alternate scene / video chapter
- **Scroll to explore**
- Geo banner (India)

**Interaction:** Clicking search field or submit opens **Welcome to Apollo Intelligence**.

### 3.2 Commercial — “BUILT TO HAUL”

- Headline: **BUILT TO HAUL**
- Command bar: “I’m looking for commercial tyres”
- Scroll cue

### 3.3 Support — “READY TO SUPPORT”

- Headline: **READY TO SUPPORT**
- Support-oriented search: “I want help with tyre warranty”
- Shortcut chips / links: Connect with Us, FAQ, Warranty

### 3.4 Stories / campaigns — “HAR SAFAR MEIN DUM HAI”

- Campaign headline
- Search: “I am looking for promotions”
- Story / campaign cards, e.g.:
  - United We Play
  - Empowering Farmers with Apollo Virat
  - Apollo Tyres BCCI Team India Sponsorship
  - Apollo Tyres Exchange Festival
- Tags: Campaign, Partnership, Agriculture

### 3.5 Agriculture — “OUTLAST EVERY HARVEST”

- Headline: **OUTLAST EVERY HARVEST**
- Command bar: “I’m looking for agriculture tyres”

### 3.6 Brand / tech — “DISTANCE STARTS HERE”

- Headline: **DISTANCE STARTS HERE**
- Search: “Get to know Apollo”
- Links / chips: Sustainability, Know Apollo

### 3.7 Footer

- Full footer IA (see §2.6)

---

## 4. Apollo Intelligence hub

**Trigger:** Hero (or other) command-bar interaction.

**Chrome:**

- Title: **Welcome to Apollo Intelligence**
- Close (**X**)
- Bottom assist bar: search icon + “How may we assist you?” + submit

**Card grid:**

| Card | Role |
|------|------|
| **Find My Tyre** (large, left) | Primary tyre discovery journey |
| **For Personal** | Passenger / personal segment |
| **For Commercial** | Commercial segment |
| **For Agriculture** | Agri segment |
| **Find Dealers** | Dealer locator |
| **Help & Support** | Support entry |

**Behavior:**

- Each card routes into its journey (Find My Tyre is fully prototyped).
- Free-text assist bar accepts NL queries (same assistant paradigm).
- Close returns to underlying homepage chapter.

---

## 5. Find My Tyre — guided wizard

### 5.1 Step A — Vehicle category carousel

- Dark modal over blurred homepage
- Horizontal **3D vehicle carousel** (van, convertible, car, motorcycle, tractor, …)
- Center item is active; label under it (e.g. **Car**)
- Purple **Select** under active vehicle
- Left / right circular arrows cycle categories
- Alternate path: bar **“Find by tyre size”** + submit (skips vehicle category path)
- Close (**X**)

### 5.2 Step B — Find by tyre size / confirm category

- Prompt path labeled **Find by tyre size**
- Shows selected category (e.g. **Car**) + **Select**
- Visual of tyre / vehicle imagery
- Close available

### 5.3 Step C — Car maker (typeahead)

- Prompt: **Please enter the car maker**
- Input with caret; suggestions as user types (demo: `H` → Haval, Hennesey, Honda, Hyundai, Hummer)
- Optional “add” / attach control on field
- Close available

### 5.4 Step D — Car model (typeahead)

- Prompt: **Please enter car model**
- Filtered list for selected maker (demo Honda + `C` → City, Civic, Concerto, CR-V, CRX, CR-Z)

### 5.5 Step E — Year

- Prompt: **Please enter the year**
- Year input (demo **2020**)
- **Skip** available (year optional)

### 5.6 Step F — Tyre size

- Prompt: **Please enter tyre size**
- Size input (demo **16**)
- **Upload Tyre Photo** (alternate: OCR / vision from sidewall photo)
- **Skip** available

### 5.7 Completion

Wizard lands on **PDP** with vehicle context applied (see §6).

**Data captured (example path):** Honda · City · 2020 · 185/55 R16 83H (shown on PDP vehicle chip).

---

## 6. Product Detail Page (PDP) — Amazер 4G Life

**Prototype product:** **AMAZER 4G LIFE**

### 6.1 Hero / product stage

- Product name (large)
- Key metrics strip:
  - Price per tyre — **₹ 7,010.00**
  - Long Life — **up to 1 Lakh KM\***
  - Made for — **All weather**
  - Tread life warranty — **90k KM** (with info icon)
- Horizontal **product carousel** (center tyre featured; adjacent tyres faded)
- Floating **Ask Apollo** command bar (+ attach, submit)
- **Your vehicle** chip: `Honda City 2020 · 185/55 R 16 83H` with **Edit**
- Actions: **Compare**, **Find Dealer**
- **Scroll to explore**
- Menu control

### 6.2 In-page sections / anchors

- Features  
- Benefit  
- Technology  
- Gallery  
- Spec  

### 6.3 Feature / benefit content (examples)

- Tags: Passenger Car, Summer, Wet, Dry, Low Noise
- Short tech blurb (compound, construction, rolling resistance)
- Benefit blocks with expand/collapse (`+` / `minus`), e.g.:
  - Wide Longitudinal Circumferential Grooves
  - Asymmetric Tread & Rigid Rib Architecture (+ body copy)
  - Hydroplaning Resistance
- Named benefits such as **Unmatched Ride Comfort** with supporting copy
- **Precision Engineering** / **Design for the distance** storytelling modules

### 6.4 Specs

- Rim size filter chips: **13" · 14" · 15" · 16"**
- SKU / size list (e.g. 165/60R13, 165/65R13, 165/65R14, 175/65R14, 175/65R15, 175/65R16, 175/68R16)
- **Download Product Brochure**

### 6.5 Persistent chrome

- Ask Apollo bar (product-context assistant)
- Vehicle context chip (editable → re-enter finder)
- Footer IA (same as homepage)

### 6.6 Interactions

| Control | Behavior |
|---------|----------|
| Product carousel | Change featured SKU / sibling product; refresh metrics |
| Compare | Enter compare flow (control present; destination not fully linked in proto) |
| Find Dealer | Open dealer locator with product / size context |
| Edit vehicle | Re-open finder with current selection |
| Ask Apollo | Product-aware Q&A / next actions |
| Spec rim chips | Filter size table |
| Accordion +/- | Expand / collapse tech feature details |
| Brochure | Download asset |

---

## 7. End-to-end user journeys

### Journey A — Tyre purchase discovery

```
Homepage hero
  → Apollo Intelligence
    → Find My Tyre
      → Select vehicle category (Car)
        → Enter maker (Honda)
          → Enter model (City)
            → Enter year (2020) [or Skip]
              → Enter size / Upload photo [or Skip]
                → PDP (Amazer 4G Life) with vehicle chip
                  → Find Dealer / Compare / Ask Apollo / Specs
```

### Journey B — Segment browse from homepage scroll

```
Scroll to Commercial / Agriculture / Support / Stories chapter
  → Context-specific command bar submit
    → Intelligence or segment landing / support / campaign content
```

### Journey C — Market confirmation

```
Land on site → Geo banner → Continue (keep market) OR change region → Content refresh
```

---

## 8. Content & behavior rules

1. **Assistant-first:** Primary discovery is conversational / guided, not only faceted browse.
2. **Context-sensitive placeholders:** Command bar copy should match current chapter and segment.
3. **Skippable steps:** Year and size can be skipped; upload photo is an alternate to manual size.
4. **Vehicle context persistence:** After finder completion, PDP and later pages show editable “Your vehicle”.

---

## 9. Open / partially linked in prototype

These controls appear visually but were not fully wired to unique destination frames during exploration:

- Intelligence cards: **Find Dealers**, **Help & Support**, **For Personal / Commercial / Agriculture** (beyond Find My Tyre)
- PDP **Compare**
- Geo market list beyond current selection UI
- Upload Tyre Photo processing UX after pick
- Full dealer locator UX

Treat these as **specified intent** from labels and layout; confirm with design for final acceptance criteria.

---

## 10. Traceability

| Prototype node (examples) | Screen |
|---------------------------|--------|
| `1795:11272` | Apollo homepage start |
| `2598:25261` | Apollo Intelligence |
| `2598:25314` | Vehicle / Find by size |
| `2598:25333`–`2598:25427` | Maker → model → year → size |
| `2598:22252` | PDP Amazер 4G Life |
| `2463:13308` | Apollo navigation / category rail |

---

*Document generated from interactive review of the Concept Design Figma prototype (desktop), scoped to the Apollo Tyres consumer flow only.*
