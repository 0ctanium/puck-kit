# Building your own components (e.g. a Figure)

The kit ships an Image component whose source is an `image` field: to plug in your upload /
media system, override `fieldTypes.image` (see the README) rather than writing a new component.
For anything else, any component can plug into the same style system with these helpers from `puck-kit`:

| Helper | Purpose |
|---|---|
| `styleField()` | The responsive style panel, as a Puck custom field |
| `<ElementStyle id styles editing />` | Emits the element's CSS (server-safe, no hooks) |
| `elementClass(id, advanced)` | Class names to put on your root element (`pk-<id>` + extra classes) |
| `advancedField` / `htmlAttrs(advanced)` | Optional: HTML id, extra classes, aria-label |

## Example: Figure (image + caption)

```tsx
import type { ComponentConfig } from "@puckeditor/core";
import {
  advancedField, elementClass, ElementStyle, htmlAttrs, styleField,
  type Advanced, type Styles,
} from "puck-kit";

import type { KitFields } from "puck-kit";

export interface FigureProps {
  src: string;
  caption: string;
  styles: Styles;
  advanced: Advanced;
}

export const Figure: ComponentConfig<{ props: FigureProps; fields: KitFields }> = {
  label: "Figure",
  inline: true, // no wrapper div in the editor: your root element receives puck.dragRef
  fields: {
    src: { type: "image", label: "Image" }, // ← whatever image picker the app plugged in
    caption: { type: "text", label: "Caption" },
    styles: styleField(),
    advanced: advancedField,
  },
  defaultProps: {
    src: "",
    caption: "",
    styles: { base: { marginLeft: "0", marginRight: "0" } }, // your defaults
    advanced: {},
  },
  render: ({ id, puck, src, caption, styles, advanced }) => (
    <>
      <ElementStyle id={id} styles={styles} editing={puck.isEditing} />
      <figure ref={puck.dragRef} className={elementClass(id, advanced)} {...htmlAttrs(advanced)}>
        <img src={src} alt={caption} style={{ display: "block", width: "100%" }} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </>
  ),
};
```

Register it:

```ts
createBuilderConfig({
  components: { Figure },
  categories: { extras: { title: "Extras", components: ["Figure"] } },
});
```

A working example with the kit's field types lives in `apps/playground/lib/Banner.tsx`.

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
