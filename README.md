# puck-kit

Webflow-style building blocks for [Puck](https://puckeditor.com) `@puckeditor/core@~0.23`:
generic elements you nest freely, each with a responsive style panel. Styles compile to plain
CSS at render time — **no Tailwind, no build step, no client JS needed on public pages.**

```
packages/puck-kit   the library (published package)
apps/playground     Next.js app: /edit/<slug> (editor) and /<slug> (server-rendered page)
apps/docs           documentation site (Fumadocs): pnpm docs
```

## Components

| Structure | Basic | Typography | Media |
|---|---|---|---|
| Section `<section>` | Box `<div>` (+ semantic tags) | Heading `<h1>`–`<h6>` (inline text) | Image `<img>` (`image` field) |
| Container (max-width per breakpoint, centered) | List `<ul>`/`<ol>` (only List Items) | Paragraph (rich text, `<p>` blocks) | YouTube `<iframe>` |
| Vertical Flex / Horizontal Flex | List Item `<li>` | Text `<div>` (rich text) | Vimeo `<iframe>` |
| Grid (2×2) | Link Block `<a>` (anything inside) | Text Link `<a>` (inline text) | |
| Columns (one drop zone per column) | Button `<a>`/`<button>` | Quote `<blockquote>` (rich text) | |

Section, Container, Flex and Grid are the same Box element with different **default styles**:
everything stays editable.

YouTube and Vimeo take any video link (watch, `youtu.be`, shorts, embed, unlisted Vimeo links…)
and offer autoplay (muted), loop, controls, start time and privacy mode (`youtube-nocookie.com` /
Vimeo "do not track", on by default). They're 16:9 and full width by default (Size section). In
the editor, the players don't autoplay or catch clicks, so the element stays selectable.

## Usage

```bash
pnpm add @puckeditor/core@~0.23 puck-kit
```

```ts
// lib/config.ts — shared by editor and public pages (no "use client")
import { createBuilderConfig } from "puck-kit";
import { Gallery } from "./Gallery"; // your own components, see apps/docs → Guides → Building your own components

export const config = createBuilderConfig({
  components: { Gallery },
  categories: { extras: { title: "Extras", components: ["Gallery"] } },
  // breakpoints, tokens, exclude: ["Quote"] ...
});
```

```tsx
// Editor page (client component): Puck's own editor + the kit's plugin
"use client";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { usePuckKit } from "puck-kit/editor";

export function Editor({ data }) {
  const kit = usePuckKit(config, { fonts, onAddFonts }); // { plugins, viewports, ui }
  return <Puck config={config} data={data} {...kit} onPublish={save} />;
}
```

Everything the kit adds to the editor is **one Puck plugin**, `puckKit()`:
- the **Tokens** panel (left rail);
- the kit's **field types**;
- the **breakpoint switcher** in the header;
- the **Settings / Style tabs** of the fields panel;
- the **compact component drawer**;
- **fonts** (loaded in the canvas, offered in font pickers).

`usePuckKit(config, options)` returns that plugin plus the two `<Puck>` props a plugin can't set:
`viewports` (matching your breakpoints) and `ui` (open on the base breakpoint). Your own props
compose as usual:
- `plugins={[...kit.plugins, myPlugin]}`;
- `overrides` (your `headerActions` render after the breakpoint switcher, and your
  `fieldTypes.url` / `fieldTypes.image` replace the kit's default inputs).

Prefer the plugin alone?
`const plugin = puckKit({ fonts })`, created once at module level or in `useMemo`, then
`<Puck plugins={[plugin]} />`. Puck then uses its default viewports.

```tsx
// Public page (server component OK): Puck's own <Render>
import { Render } from "@puckeditor/core";
import { fontMetadata } from "puck-kit";
<Render config={config} data={data} metadata={fontMetadata(fonts, data)} />
```

Persisting `data` (JSON) is up to you.

## Documentation

The full documentation lives in [`apps/docs`](apps/docs) (Fumadocs): guides, framework setup (Next.js, Vite,
React Router, TanStack Start, Astro), one page per component with screenshots and live previews, the style
system (breakpoints, states, tokens, fonts, CSS output) and the API reference.

```bash
pnpm docs              # http://localhost:3031
pnpm docs:screenshots  # re-capture screenshots (needs `pnpm dev` running)
```

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
- Kit components use the kit's field types (`url`, `image`, `checkbox`), so the editor needs the
  `puckKit` plugin (or `kitFieldTypes` in `overrides.fieldTypes`).
- The plugin overrides `fields`, `drawer` and `drawerItem`. A `drawerItem` override of yours
  is replaced by the compact item.
- Out of scope for now: forms, reusable named classes, interactions/animations, CMS bindings.
