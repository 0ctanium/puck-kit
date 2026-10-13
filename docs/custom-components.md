# Building your own components (e.g. Image)

The kit has no Image component on purpose: every app has its own upload / media system.
Any component can plug into the same style system with three helpers from `puck-kit`:

| Helper | Purpose |
|---|---|
| `styleField()` | The responsive style panel, as a Puck custom field |
| `<ElementStyle id styles editing />` | Emits the element's CSS (server-safe, no hooks) |
| `elementClass(id, advanced)` | Class names to put on your root element (`pk-<id>` + extra classes) |
| `advancedField` / `htmlAttrs(advanced)` | Optional: HTML id, extra classes, aria-label |

## Example: Image

```tsx
import type { ComponentConfig } from "@puckeditor/core";
import {
  advancedField, elementClass, ElementStyle, htmlAttrs, styleField,
  type Advanced, type Styles,
} from "puck-kit";

export interface ImageProps {
  image: { url: string; alt?: string } | null;
  styles: Styles;
  advanced: Advanced;
}

export const Image: ComponentConfig<ImageProps> = {
  label: "Image",
  inline: true, // no wrapper div in the editor: your root element receives puck.dragRef
  fields: {
    image: myMediaField, // ← your upload / media-library field (custom or external field)
    styles: styleField(),
    advanced: advancedField,
  },
  defaultProps: {
    image: null,
    styles: { base: { width: "100%", height: "auto" } }, // your defaults
    advanced: {},
  },
  render: ({ id, puck, image, styles, advanced }) => (
    <>
      <ElementStyle id={id} styles={styles} editing={puck.isEditing} />
      <img
        ref={puck.dragRef}
        src={image?.url}
        alt={image?.alt ?? ""}
        className={elementClass(id, advanced)}
        {...htmlAttrs(advanced)}
      />
    </>
  ),
};
```

Register it:

```ts
createBuilderConfig({
  components: { Image },
  categories: { media: { title: "Media", components: ["Image"] } },
});
```

A working version (with a plain URL field) lives in `apps/playground/lib/Image.tsx`.

## Rules of thumb

1. **`inline: true` + `ref={puck.dragRef}`** on the root element. Without it Puck wraps your
   component in a `<div>`, which breaks flex/grid layouts of the parent.
2. **Keep `render` free of hooks** so it works in React Server Components. Put interactive
   parts in a separate `"use client"` component rendered inside.
3. **Custom breakpoints?** Pass the same array everywhere:
   `styleField({ breakpoints })` and `<ElementStyle breakpoints={breakpoints} />`.
4. **Containers**: to accept children, use a `slot` field and render it *as* your element, so
   children are direct DOM children:
   ```tsx
   const Content = props.content;
   <Content as="figure" ref={puck.dragRef} className={elementClass(id, advanced, puck.isEditing ? "pk-slot" : undefined)} />
   ```
   (`pk-slot` neutralizes Puck's `width/height: 100%` drop-zone rule in the editor.) Or use
   the kit's factory: `createContainer({ label, tags: ["figure"], defaultStyles }, { breakpoints })`.
5. **Limit the panel** for simple elements: `styleField({ sections: ["spacing", "size", "border"] })`.
