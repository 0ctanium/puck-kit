# puck-kit

Webflow-style building blocks for [Puck](https://puckeditor.com) `@puckeditor/core@~0.23`:
generic elements you nest freely, each with a responsive style panel. Styles compile to plain
CSS at render time — **no Tailwind, no build step, no client JS needed on public pages.**

```
packages/puck-kit   the library (published package)
apps/playground     Next.js app: /edit/<slug> (editor) and /<slug> (server-rendered page)
docs/               guides
```

## Components

| Structure | Basic | Typography |
|---|---|---|
| Section `<section>` | Box `<div>` (+ semantic tags) | Heading `<h1>`–`<h6>` (inline text) |
| Container (max-width per breakpoint, centered) | List `<ul>`/`<ol>` (only List Items) | Paragraph (rich text, `<p>` blocks) |
| Vertical Flex / Horizontal Flex | List Item `<li>` | Text `<div>` (rich text) |
| Grid (2×2) | Link Block `<a>` (anything inside) | Quote `<blockquote>` (rich text) |
| Columns (one drop zone per column) | Button `<a>`/`<button>` | |

Section, Container, Flex and Grid are the same Box element with different **default styles**:
everything stays editable.

## Usage

```bash
pnpm add @puckeditor/core@~0.23 puck-kit
```

```ts
// lib/config.ts — shared by editor and public pages (no "use client")
import { createBuilderConfig } from "puck-kit";
import { Image } from "./Image"; // your own components, see docs/custom-components.md

export const config = createBuilderConfig({
  components: { Image },
  categories: { media: { title: "Media", components: ["Image"] } },
  // breakpoints, tokens, exclude: ["Quote"] ...
});
```

```tsx
// Editor page (client component)
"use client";
import { BuilderEditor } from "puck-kit/editor";
<BuilderEditor config={config} data={data} onPublish={save} />
```

```tsx
// Public page (server component OK)
import { BuilderRender } from "puck-kit/render";
<BuilderRender config={config} data={data} />
```

Persisting `data` (JSON) is up to you.

## How styling works

- Every element has a `styles` prop: `{ base?: {...}, md?: {...}, lg?: {...}, xl?: {...} }`
  holding plain CSS properties (camelCase). Values may reference tokens:
  `var(--pk-color-primary)`.
- **Mobile-first**: `base` applies everywhere, `md` from 768px, `lg` from 1024px, `xl` from 1280px
  (configurable via `createBuilderConfig({ breakpoints })`).
- Each element gets a deterministic class from its Puck id (`.pk-<id>`), so server and client
  output match. CSS is emitted with React 19 `<style href precedence>`: hoisted to `<head>`
  and deduplicated. In the editor it's inline in Puck's iframe, so the viewport switcher
  drives the media queries.
- `getPageCss(data)` (from `puck-kit/styles`) returns one stylesheet for a whole page, if you
  prefer serving a cached `.css` file.
- **Design tokens** (colors, fonts, sizes) are edited on the page root (click empty canvas)
  and emitted as CSS variables. The style panel offers them as swatches/presets.
- Container elements *are* the Puck slot (`<Content as="ul" />`), and all components use
  Puck's `inline` mode, so there are no wrapper divs: `ul > li`, `grid > item`.

### Style panel

Webflow-like, with popovers for anything complex. The breakpoint bar is synced with Puck's
viewport switcher. A blue label means "set on this breakpoint" (click it to reset), orange means
"inherited from a smaller breakpoint". Drag a label (or a spacing value) left/right to scrub it;
arrow keys nudge numbers (Shift ×10, Alt ×0.1).

| Section (`id`) | Editing |
|---|---|
| Layout (`layout`) | Display; flex direction/reverse, align & justify icons that follow the direction, wrap, gap (linked or row/column); visual grid editor (preview, column/row steppers, track sizes in fr/px/auto, auto-flow) |
| Flex child (`flexChild`) | Only when the parent is flex: sizing presets (shrink / grow / none / custom), align self (icons follow the parent direction), order |
| Grid child (`gridChild`) | Only when the parent is grid: column/row span steppers, full-width/height toggle, horizontal & vertical self-alignment, order |
| Spacing (`spacing`) | Box model: drag values, click for presets, tokens, "both sides" / "all sides" |
| Size (`size`) | Width/height/min/max with units & keywords, overflow, aspect ratio, object fit |
| Position (`position`) | Position, inset box, presets (full, top, center…), z-index |
| Typography (`typography`) | Font (tokens, previewed in their face), weight, size, line height, color, align, style, case, spacing, text shadows |
| Backgrounds (`background`) | Layers: images (size, 3×3 position, tiling) and linear/radial gradients (angle dial, draggable stops); color |
| Borders (`border`) | Radius (all or per corner); side picker (all/top/right/bottom/left) with style, width, color |
| Effects (`effects`) | Opacity, blending, box shadows, 2D transforms (move/scale/rotate/skew), transitions, filters, backdrop filters, cursor |

Dropdowns are custom (keyboard: ↑ ↓ Enter Esc, type to jump) with icons where they help:
position, cursor, aspect-ratio shapes, object-fit diagrams, easing curves, filters, font samples.
`sections: ["child"]` still selects both child sections.

Colors use an HSV picker with alpha, hex/rgba input, eyedropper (where supported) and token
swatches. The panel UI lives in `packages/puck-kit/src/fields/` (`ui/` primitives, `sections/`,
`css/` value parsers) and is styled with CSS Modules.

## Development

```bash
pnpm install
pnpm test            # style compiler unit tests
pnpm build           # build the library (unbundled, keeps "use client" on editor modules)
pnpm dev             # playground on http://localhost:3030 (compiles puck-kit from source)
```

Requires Node ≥ 20.9 (Next.js 16).

## Notes / limits

- Paragraph renders a `<div class="pk-rich">` around Puck's rich text output, which already
  produces real `<p>` elements (a `<p>` can't contain them).
- In the editor, links don't navigate and Link Block attributes (href, id, aria) are only
  rendered on the public page.
- Out of scope for now: images/media (see the custom component guide), forms, reusable
  named classes, interactions/animations, CMS bindings.
