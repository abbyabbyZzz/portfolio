# Design System — Abigail Han Portfolio

> **Purpose:** This document summarizes the existing design language of the portfolio website so that future pages (project details, writings archive, article pages, etc.) remain visually consistent. Do not invent new rules — only what already exists in the codebase is documented here.

---

## 1. Overall Design Style

**Keywords**
Minimalist, monochrome, editorial, typographic, high-contrast, structured, refined.

**Mood & Personality**
Clean, professional, quietly confident. The site feels like a design portfolio / architecture journal — uncluttered with a strong focus on typography and whitespace. The black-and-white palette with occasional project-specific color accents gives it a gallery-like neutrality that lets project imagery speak.

**Closest Design References**
- Swiss / International Style grid systems
- Minimalist editorial layouts (similar to *AIGA Eye on Design*, *It's Nice That*)
- Black-and-white architecture/design portfolios

---

## 2. Typography System

### Font Stacks

| Role | Stack | Source |
|---|---|---|
| **Display / Headings** | `"area-normal", sans-serif` | Adobe Typekit (`use.typekit.net/kbe6evn.css`) |
| **Body / UI** | `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | Google Fonts (400, 500, 600, 700) |
| **Monospace / Labels** | `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace` | System fallback |

### Heading Styles

All display headings (`h1, h2, h3, .hero-title, .detail-title, .project-title, .process-heading, .nav-brand, .slide-content h2`) use `"area-normal", sans-serif`.

| Element | Size | Weight | Letter-spacing | Line-height | Context |
|---|---|---|---|---|---|
| `.hero-title` | `clamp(1.5rem, 3vw, 2rem)` | 600 | `-0.03em` | `1.1` | Homepage hero heading |
| `.slide-content h2` | `clamp(1.6rem, 3vw, 2.25rem)` | 600 | `-0.02em` | `1.15` | Selected Works slide titles |
| `.detail-title` | `clamp(2rem, 4vw, 3rem)` | 600 | `-0.03em` | `1.1` | Project detail page title (right panel) |
| `h1` (resume) | `1.8rem` | 600 | `-0.02em` | `1.1` | Resume page header |
| `h2` (resume) | `1.6rem` | 600 | `-0.01em` | — | Resume section headings |
| `h3` (resume) | `0.95rem` | 600 | — | — | Resume sub-section headings |
| `.process-heading` | `1rem` | normal (400) | `0.08em` uppercase | — | Process section titles (detail pages) |
| `.project-title` | `1rem` | 600 | — | — | Gallery card titles |
| `.nav-brand` | `0.9rem` | 600 | `-0.02em` | — | Navigation brand text |

### Body Text Styles

| Element | Size | Weight | Color | Line-height | Context |
|---|---|---|---|---|---|
| Body default | `0.95rem` | 400 | `var(--fg)` = `#0a0a0a` | `1.5` | Global base |
| `.hero-body` | `0.95rem` | 400 | `var(--muted)` = `#666` | `1.5` | Homepage hero description |
| `.slide-desc` | `0.95rem` | 400 | `#444` | `1.6` | Selected Works slide descriptions |
| `.slide-meta` | `0.8rem` | 400 | `#666` | — | Slide metadata (Role, Tools) |
| `.detail-body` | `0.95rem` | 400 | `#444` | `1.6` | Project detail body paragraphs |
| `.detail-meta-value` | `0.85rem` | 400 | `var(--fg)` | — | Project metadata values |
| `.detail-meta-label` | `0.85rem` | 400 | `#777` | — | Metadata label (uppercase) |
| `.process-body` | `0.95rem` | 400 | `#444` | `1.6` | Process section body |
| `.caption` | `0.9rem` | 400 | `var(--bs-secondary-color)` / inherits | `1.4` (centered) | Image captions |
| `.oneliner` | `1.2rem` | 400 (italic `em`) | `#000` | — | Hero italic project subtitle |
| `.project-desc` | `0.9rem` | 400 | `#555` | `1` | Gallery card description |

### Monospace / Label Component (`.label`)

```
font-family: var(--font-mono)
font-size: 0.65rem  (1rem on homepage hero/info cells)
text-transform: uppercase
letter-spacing: 0.1em
color: var(--muted)  (#666)
```

Used for: section markers (e.g. "01 / About", "Selected Works"), metadata labels, small informational text. On the homepage hero/info cells, `.label` is bumped to `1rem` for visual weight.

### Rules for Text Style Usage

- **Display headings** (`area-normal`): Use only for major titles — hero, project titles, section headers in slides, process headings, nav brand. Do not use for body text or metadata.
- **Body** (`Inter`): All paragraph text, descriptions, metadata.
- **Monospace**: Only for small accent/label text (section markers, counters, navigation links in project footer, slide links, toggles). Never use for long-form reading.
- **Uppercase with wide letter-spacing** (`0.08em`): Reserved for `.process-heading`, `.detail-meta-label`, `.footer-link`, and `.label` — signals structure/metadata, not content.

---

## 3. Color System

### CSS Custom Properties (Global Tokens)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#ffffff` | Page and section backgrounds |
| `--fg` | `#0a0a0a` | Primary text, borders, foreground elements |
| `--muted` | `#666666` | Secondary/label text |
| `--border` | `#0a0a0a` | Structural borders (1px solid) |
| `--border-light` | `#e0e0e0` | Subtle dividers (status line, swatch borders) |
| `--hover` | `#f5f5f5` | Hover background for cells |

### Backgrounds

- **Page background:** `#ffffff` everywhere
- **Navigation bar:** `var(--fg)` = `#0a0a0a` (black)
- **Footer:** `#ffffff` with black overlay animating in
- **Project thumbnails (placeholder):** `#e8e8e8`

### Text Colors

| Color | Value | Usage |
|---|---|---|
| Primary text | `#0a0a0a` | Most body text, headings |
| Muted text | `#666` | Labels, secondary info |
| Description text | `#444` | Slide descriptions, process body, detail body |
| Light meta text | `#777` | Detail meta labels (uppercase) |
| Lighter text | `#555` | Gallery project card descriptions |
| White | `#ffffff` | Text on nav bar, on hovered/filled buttons |
| Semi-transparent white | `rgba(255,255,255,0.7)` | Footer link hover when dark overlay active |

### Border Colors

- **Bold structural borders:** `1px solid var(--border)` (`#0a0a0a`) — section separators, layout dividers
- **Light dividers:** `1px solid var(--border-light)` (`#e0e0e0`) — status line separator, swatch borders
- **Nav bottom border:** `1px solid rgba(255,255,255,0.12)`

### Primary Interaction Colors

- **Black fill hover** (`--fg`): Tag buttons fill black on active/hover (text turns white). Travel button fills black on hover (text turns white).
- **Light gray hover** (`--hover` = `#f5f5f5`): Bento grid cells on hover.
- **Link hover:** Underline appears; opacity drops to `0.6` (slide links, project nav links). Color may shift to `#000` (detail back link).
- **Footer link hover:** Color shifts based on overlay state — `var(--fg)` when white background, `rgba(255,255,255,0.7)` when dark overlay visible.

### Project-Specific Color Palettes

These live in individual project HTML pages (not in CSS tokens). Color swatches are displayed as `80px` circles (`.swatch`) with `border: 2px solid #e0e0e0`.

- **Henc:** Deep Clay `#4C423E`, Warm Silt `#71685F`, Dune Sand `#BDB0A0`, Ivory Glaze `#E1D4C1`, Ceramic Sky `#A4ADD8`
- **2024 Portfolio:** Dark Pink `#C75B69`, Light Pink `#D58A94`, Light Blue `#B4E3F3`, Light Purple `#D5D5EB`, Beige `#F5EDEA`
- **Flare:** Pink Playdo `#F7A7A6`, Ceramic Bubble `#BDE3DE`, Ink Wash Violet `#7F8AC8`

### Grayscale / Monotone Rules

- The site is predominantly black-and-white / grayscale. Color is introduced only through project imagery and project-specific color palette components.
- Gallery thumbnails start fully desaturated (`filter: grayscale(100%)`) and become full-color on hover.
- The only non-monochrome reusable button is the `.play-btn` (deep purple `#4a1a6b`), used only for the Subscription Trap game context.

---

## 4. Layout System

### Base Spacing Token

```
--pad: clamp(1.25rem, 2.5vw, 2.5rem)
```

### Page Width

- All pages use **fluid width** (Bootstrap container-fluid or full-width layouts). No fixed-width container.
- Content is bounded by padding (`--pad` equivalent values), not by a max-width wrapper.

### Navigation Bar

- Height: fixed by content (`padding: 1.25rem 1.5rem`), sticky at top, z-index 100.
- Left: `.nav-brand`, Right: `.nav-links`.
- Bottom border: `1px solid rgba(255,255,255,0.12)`.
- Black background (`var(--fg)`).

### Homepage Layout (Bento Grid)

- **Mobile (< 768px):** Single column (`1fr`), cells stack vertically with bottom borders.
- **Desktop (≥ 768px):** Two columns (`2fr 1fr`). Sticky at `top: 57px`, height = `calc((100vh - 57px) / 4)`.
- Cells have `border-right` (except the 2nd child) and `border-bottom` (only on mobile).
- Cell padding: `1.5rem` mobile / `1.5rem 2rem` desktop.

### Selected Works Section

- Container: `height: 220vh` to create scroll space.
- Sticky wrapper: `top: calc(57px + (100vh - 57px) / 4)`, height = `calc((100vh - 57px) * 3 / 4)`.
- Slides: 2-column grid (`55% 45%`), absolute positioned, padding `3.5rem 3rem 2rem`.
- **Mobile:** Section becomes auto-height; slides stack vertically as `position: relative` with `display: none` when inactive. Grid becomes `1fr`, grid-rows `45% 55%`.

### Gallery Page (Masonry Grid)

- Page padding: `1.5rem` mobile / `1.5rem 2rem` desktop.
- Masonry column count:
  - `< 768px`: 1 column
  - `768–991px`: 2 columns (`calc(50% - 0.75rem)`)
  - `≥ 992px`: 3 columns (`calc(33.333% - 1rem)`)
- Column gap: `1.5rem`.
- Masonry is JavaScript-based (absolute positioning with container height set dynamically).

### Project Detail Page

- **Desktop (≥ 992px):** 2-column row (`col-lg-8` left + `col-lg-4` right). Row has `flex-direction: row-reverse` so the sidebar (right panel) appears visually on the right.
- Left panel (`.detail-left`): padding `2.5rem 3rem`, border-left `1px solid var(--border)`.
- Right panel (`.detail-right` / `.detail-panel`): padding `2.5rem 3rem 3rem 2.5rem`, sticky at `top: 100px`.
- **Tablet (< 992px):** Left border removed, padding reduced to `1.5rem`, sticky becomes static.
- **Mobile (< 768px):** Single column, `order: -1` puts the right panel first. Padding `1rem`. Right panel becomes collapsible via `.detail-toggle` button (monospace, `0.75rem`, uppercase, arrow rotates on expand).

### Resume Page

- Header padding: `2rem 3rem 0`.
- Grid: `1fr 2fr` (left aside + right content).
- Left column: padding `2rem 3rem`, border-right `1px solid var(--border)`.
- Right column: padding `2rem 3rem`.
- **Mobile (< 768px):** Single column, left border removed, bottom border added.

### Responsive Breakpoints Summary

| Breakpoint | Applies to |
|---|---|
| `≥ 992px` | Desktop detail page layout, 3-column masonry |
| `< 992px` | Detail page: collapse to single-panel, sticky removed |
| `≥ 768px` | Desktop bento grid, desktop selected-works |
| `< 768px` | Mobile nav overlay, footer static, detail collapsible panels |
| `< 767.98px` | Footer becomes relative-positioned |
| `≤ 576px` | Small mobile: wireframes wrap, henc logos stack, tag buttons shrink |

### Section Spacing Rules

- Project detail process sections: `padding: 5rem 0` with `border-bottom: 1px solid var(--border)` between them. First section has `padding-top: 0`, last has `border-bottom: none`.
- Resume sections: `padding: 2rem 0` with `border-bottom`.
- Gallery items: `margin-bottom: 1.5rem`.

---

## 5. Components

### Navigation / Header (`.site-nav`)

- **Background:** `var(--fg)` (black).
- **Layout:** Flex, `justify-content: space-between`, `align-items: center`.
- **Padding:** `1.25rem 1.5rem`.
- **Sticky:** `top: 0`, `z-index: 100`.
- **Brand:** `.nav-brand` — white, 600 weight, `area-normal` font, `0.9rem`.
- **Links:** `.nav-links a` — white, 500 weight, `0.8rem`, `letter-spacing: 0.02em`.
- **Underline animation:** `::after` pseudo-element, `1px` white, `width` transitions `0 → 100%` on hover/active over `0.2s ease`.
- **Mobile (< 768px):** A `.nav-toggle` hamburger button is injected. Nav links become fixed full-screen overlay (`inset: 0`), black background, flex column centered, gap `2rem`, links at `1.5rem`. Slides in from right via `translateX(100%) → translateX(0)` over `0.3s ease`.

### Footer (`.site-footer`)

- **Desktop:** Fixed at bottom, `height: calc(100vh - 57px)`, z-index 200. Hidden by default (`translateY(100%)`), slides up with `.is-visible` class over `0.6s cubic-bezier(0.4,0,0.2,1)`.
- **Black overlay animation:** `::before` pseudo-element covers the footer in `var(--fg)`, animates `scaleY(0 → 1)` over `0.5s ease-out`.
- **Footer link:** `1.25rem`, uppercase, `letter-spacing: 0.08em`, color transitions `var(--muted) → var(--bg)` when visible. Underline hover animation.
- **Mobile (< 767.98px):** Position `relative`, no animation, `transform: none`, `min-height: 200px`, black overlay hidden, link text always `var(--fg)`.

### Project Cards (Gallery)

- **Structure:** `article.project-card` with `data-category` attribute, wrapped in `.masonry-item.reveal-row`.
- **Border-radius:** `10px` (desktop), `6px` (mobile). No border. `overflow: hidden`.
- **Thumbnail:** `.project-thumb` with `background: #e8e8e8`.
- **Image:** Full width, `filter: grayscale(100%)`.
- **Hover:** Grayscale removed (`filter: grayscale(0)`), image translates up `-3px`. Transition: `0.4s ease` on both `filter` and `transform`.
- **Meta:** `.projectMeta` with padding `0.75rem 0.75rem 1rem`.
- **Title:** `.project-title` — `1rem`, 600 weight.
- **Description:** `.project-desc` — `0.9rem`, `line-height: 1`, `color: #555`.

### Tag Filter Buttons (`.tag-btn`)

- Transparent background, no border, `1rem` size, `text-transform: lowercase`, `padding: 0.4rem 1rem`.
- `::before` pseudo-element fills from top (`scaleY`) on hover/active over `0.35s ease`.
- Active/hover: `background` becomes `var(--fg)`, text turns white.
- Mobile (< 576px): `font-size: 0.8rem`, `padding: 0.25rem 0.6rem`, gap `0.4rem`.

### Work Slides (Homepage Selected Works)

- 3 slides showing featured projects, each with: indicator bar (label + counter), visual carousel, content block.
- Slide content: `label` → `h2` → `.slide-desc` paragraph → `.slide-meta` (Role, Tools as `strong` label + `span` value) → `.slide-link`.
- `.slide-link`: monospace, `0.7rem`, uppercase, `letter-spacing: 0.06em`, `border-bottom: 1px solid var(--fg)`, hover `opacity: 0.6`.
- Progress bar: `4px` track with `rgba(10,10,10,0.08)` background, fill is `var(--fg)`.
- Slide transitions: black overlay cover → swap → reveal, 400ms each phase.

### Buttons

**Play Button (`.play-btn`)**
- Deep purple `#4a1a6b` background, white text.
- Monospace, `0.8rem`, 600 weight, uppercase, `letter-spacing: 0.12em`.
- `border: 2px solid #2d0d42`, `box-shadow: 3px 3px 0 #d8c4e8` (pixel-art style).
- Includes `▶` character via `::before`.
- Hover: `translate(1px, 1px)` with reduced shadow.

**Travel Button (`.travel-btn`)**
- Pill shape (`border-radius: 999px`), white background, black border.
- `"area-normal", sans-serif` font, `1.1rem`, weight 300, uppercase.
- Hover: background fills black, text turns white.

### Color Swatches (`.swatch`)

- `80px × 80px` circles, `border-radius: 50%`.
- `border: 2px solid #e0e0e0`.
- Color set via `--swatch-color` CSS custom property.
- Hover: `scale(1.1)` over `0.2s ease`.
- `::after` shows color name on hover (opacity `0 → 1`).

### Image Handling

- **Default:** `img { max-width: 100%; display: block; }`.
- **Bootstrap class `.img-fluid`** on most project images.
- **Gallery images (`.picGallery`):** Flex wrap, centered, `gap: 0.5rem`, max-width `400px` per image.
- **Sketch images (`.sketchImg`):** `width: 70%`, centered via `margin: 0 auto`.
- **Figma embeds:** `aspect-ratio: 16/9`, `max-height: 80vh`, `border: 1px solid rgba(0,0,0,0.1)`. Mobile: `aspect-ratio: 9/16`.
- **Video embeds (`.video-embed-cover`):** Absolute-positioned iframe, `16/9` aspect ratio hero, `min-height: 650px` carousel. Mobile: `9/16` hero, `300px` carousel.

### Back / Navigation Links

- **Resume back:** `.resume-back` — sticky at `top: 57px`, `z-index: 90`, white background, padding `1.5rem 3rem 0`.
- **Detail back:** `"← Portfolio Gallery"` link above title, `font-size: 1rem`, color `#888`, hover `#000`.
- **Project nav footer:** Previous/Next links at bottom of detail left panel. Monospace, `0.75rem`, uppercase, `letter-spacing: 0.06em`, `border-bottom: 1px solid var(--fg)`, hover `opacity: 0.6`.

### Status Line (homepage info cell)

```
font-family: var(--font-mono)
font-size: 0.6rem
color: var(--muted)
flex with space-between
border-top: 1px solid var(--border-light)
```

---

## 6. Interaction Style

### Hover Effects

| Element | Effect | Transition |
|---|---|---|
| Bento cells | Background → `var(--hover)` | `0.2s ease` |
| Nav links | White underline (width 0→100%) | `0.2s ease` |
| Slide links | Opacity → 0.6 | Instant |
| Project nav links | Opacity → 0.6 | `0.2s ease` |
| Project thumbnails (gallery) | Grayscale 100% → 0, translateY(-3px) | `0.4s ease` |
| Tag buttons | Black fill from top, white text | `0.35s ease` |
| Color swatches | Scale 1.1, show color name label | `0.2s ease` |
| Travel button | Background fills black, text → white | `0.2s ease` |
| Play button | translate(1px,1px), reduced shadow | `0.1s ease` |
| Footer link | Underline width 0→100% | `0.3s ease` |
| Lang toggle | Underline scaleX 0→1 | `0.2s ease` |

### Animation Summary

| Element | Type | Duration | Timing |
|---|---|---|---|
| Page enter | `opacity: 0 → 1` | `0.5s` | `ease-out` |
| Slide transition (cover) | `scaleY(0 → 1)` | `0.4s` | `cubic-bezier(0.4,0,0.2,1)` |
| Slide transition (reveal) | `scaleY(1 → 0)` | `0.4s` | `cubic-bezier(0.4,0,0.2,1)` |
| Exit overlay | `scaleY` via IntersectionObserver | `0.15s` | `linear` |
| Progress bar | `width` | `0.3s` | `ease` |
| Scroll reveal (gallery) | `opacity 0→1, translateY(40→0)` | `0.7s` | `ease` |
| Carousel items | `opacity` | `0.5s` | `ease` |
| Footer reveal | `translateY(100%→0)` | `0.6s` | `cubic-bezier(0.4,0,0.2,1)` |
| Footer black overlay | `scaleY(0→1)` | `0.5s` | `ease-out` |
| Mobile nav panel | `max-height 0→9999px` | `0.3s` | `ease` |
| Hamburger menu | transform rotate, opacity | `0.3s` | `ease` |

### `prefers-reduced-motion`

All animations and scroll behaviors are disabled when the user's system prefers reduced motion.

### Custom Cursor

- Custom SVG cursor (32×32px, black corner-bracket shape, `stroke-width: 3`).
- Switches to white version when footer dark overlay is active (`body.footer-open`).
- Applied to `body`, `a`, `button`.

### Scroll Behavior

- Selected Works section intercepts wheel events on desktop with 900ms throttle.
- Footer reveals after 2 scrolls down on the last slide.
- Gallery uses an IntersectionObserver-based scroll reveal (`threshold: 0.2`).
- Window resize on masonry debounced at 250ms.

---

## 7. Content Style

### Tone of Writing

Professional, reflective, and personal. Project descriptions are written in first person and include:

- Context / background of the project
- Personal role and contributions
- Process documentation
- User testing insights (when applicable)
- Future development reflections

### Project Description Structure

Each project detail page follows this pattern (in order):

1. **Hero section:** Project image + italic oneliner (`h3.oneliner em`) + 1–3 body paragraphs describing the project.
2. **Process sections** (each `section.process-section`):
   - Heading (`h3.process-heading`) — uppercase with wide letter-spacing
   - Body paragraphs (`p.process-body`) — `#444`, `line-height: 1.6`
   - Optional: images, color palettes, image galleries, Figma embeds
   - Pattern: Context → Process/Design → Iterations → Future Development
3. **Sections are separated** by `border-bottom: 1px solid var(--border)` with `padding: 5rem 0`.

### Right Panel (Sidebar) Content

1. Back link ("← Portfolio Gallery")
2. Project title (`.detail-title`) — large, area-normal, `-0.03em` letter-spacing
3. Category subtitle (`.detail-subtitle`) — e.g. "Graphic Design", "UI / UX"
4. Metadata block (`.detail-meta`) — bordered top:
   - Duration
   - Role
   - Tools
   - *(Format: uppercase label + right-aligned value)*
5. Body text (`.detail-body`) — 1–3 project description paragraphs

### Metadata Display Rules

- **Labels** (Duration, Role, Tools): uppercase, `letter-spacing: 0.08em`, `0.85rem`, `color: #777`.
- **Values**: `0.85rem`, right-aligned.
- **Row layout**: flex `space-between` with `gap: 1rem`.

### Links & Captions

- **Inline links:** Underlined by default, underline removed on hover (`.hero h3.oneliner a`). Normal links use Bootstrap's default underline.
- **External links (homepage info cell):** Appended with ` ↗` arrow, `opacity: 0.5`.
- **Image captions:** `.caption` — centered, `0.9rem`, `text-muted` class, placed below images with `margin-top: 0.75rem`.
- **Slide link** ("View Detail →"): Monospace, underline border, hover reduces opacity.

### Gallery Categories

Projects are tagged with one of four categories (via `data-category`):
- `interactive media`
- `graphic design`
- `uiux`
- `others`

---

## 8. Rules for Adding New Pages

### General Rules

1. **Always use the shared navigation** — copy the `.site-nav` block from any existing page. Do not modify the nav structure.
2. **Always include** the two font CDN links in `<head>`:
   - Google Fonts: Inter (400, 500, 600, 700)
   - Adobe Typekit: `use.typekit.net/kbe6evn.css`
3. **Always link** `../css/style.css` (with cache-busting `?v=` query param) and `../js/script.js` at the bottom.
4. **Do not import Bootstrap on the homepage.** Only import on gallery, resume, and detail pages.
5. **Page enter animation** is automatic (via `body { animation: page-enter 0.5s ease-out both }` in `style.css`).

### For a Writings Archive Page

- Use the **gallery page** (`gallery/index.html`) as structural template.
- Page structure:
  - Nav (same as all pages)
  - Page title (use `h2` with same styling as "Gallery" heading)
  - List of articles in a **single-column** layout (no masonry needed — writings are linear)
  - Use `.reveal-row` class for scroll-reveal animation if desired
- **Typography for article list items:**
  - Title: `"area-normal", sans-serif`, `1rem`, weight 600
  - Date/category: `.label` style (monospace, uppercase, small)
  - Description: `0.9rem`, `color: #555` (same as `.project-desc`)
- **Do not use** `.project-card` / masonry classes — they're meant for visual projects.
- Use `border-bottom: 1px solid var(--border)` between items for consistent rhythm.
- Use the same spacing: `padding: 1.5rem 2rem` container, `gap: 0.75rem` per item.

### For an Individual Article / Writing Page

- Use the **project detail page** as structural template.
- Page structure:
  - Nav
  - `container-fluid.project-detail-page > .row` with `flex-direction: row-reverse` (or remove sidebar for full-width reading)
  - Single column (`.col-lg-12`) for full-width reading layout OR `.col-lg-8 .detail-left` for the left-panel layout
  - No `.detail-right` sidebar needed, or simplified sidebar with metadata only
- **Typography for articles:**
  - Title: `.detail-title` style (`clamp(2rem, 4vw, 3rem)`, `area-normal`, 600 weight)
  - Date / metadata: `.label` style, placed above title
  - Body: `.detail-body` style (`0.95rem`, `#444`, `line-height: 1.6`)
  - Section headings: `.process-heading` style (uppercase, `0.08em` letter-spacing, `1rem`)
  - Block quotes: not currently styled — add minimal stylings (left border, italic, muted color) consistent with the monochrome palette
- **Do use** `border-bottom: 1px solid var(--border)` between sections.
- **Do use** existing caption styles for image captions.
- **Skip** the `.project-nav-footer` (prev/next article navigation) or adapt it using the same monospace styling.

### For Additional Project Detail Pages

- **Copy the pattern** from [gallery/henc/index.html](gallery/henc/index.html) — it's the canonical example.
- Required structure:
  ```
  .container-fluid.project-detail-page > .row
    .col-lg-8.detail-left
      section.hero (image + oneliner + body)
      section.process-section (repeat as needed)
    .col-lg-4.detail-right
      aside.detail-panel
        back link
        h1.detail-title
        p.detail-subtitle
        .detail-meta (Duration, Role, Tools)
        .detail-body
  ```
- Add `data-category` to the project card in the gallery page (choose from the 4 categories).
- Add the project to the `projects` array in [`js/script.js`](js/script.js) for prev/next navigation.
- Include project images in the `img/<project-slug>/` folder.
- Include Bootstrap CSS + JS on detail pages.

### New Shared Styles

If you need to add page-specific styles:
- Use a `<style>` block in the `<head>` of the new page (as all existing pages do).
- Only add CSS that is specific to that page's layout — never override global tokens.
- Follow the naming convention: use `.page-specific-class` pattern, matching existing conventions.
- If a style would be useful across multiple pages, consider adding it to [`css/style.css`](css/style.css) in the appropriate section.
