// Example custom component built with the kit's helpers (see docs/custom-components.md).
// Swap the `src` text field for your own upload / media library field.
import type { ComponentConfig } from "@puckeditor/core";
import {
  advancedField,
  elementClass,
  ElementStyle,
  htmlAttrs,
  styleField,
  type Advanced,
  type Styles,
} from "puck-kit";

export interface ImageProps {
  src: string;
  alt: string;
  styles: Styles;
  advanced: Advanced;
}

export const Image: ComponentConfig<ImageProps> = {
  label: "Image",
  inline: true,
  fields: {
    src: { type: "text", label: "Image URL" },
    alt: { type: "text", label: "Alt text" },
    styles: styleField(),
    advanced: advancedField,
  },
  metadata: {
    icon: "image",
  },
  defaultProps: {
    src: "https://picsum.photos/seed/puck/800/500",
    alt: "",
    styles: { base: { width: "100%", height: "auto", borderRadius: "8px" } },
    advanced: {},
  },
  render: ({ id, puck, src, alt, styles, advanced }) => (
    <>
      <ElementStyle id={id} styles={styles} editing={puck.isEditing} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={puck.dragRef}
        src={src}
        alt={alt}
        className={elementClass(id, advanced)}
        {...htmlAttrs(advanced)}
      />
    </>
  ),
};
