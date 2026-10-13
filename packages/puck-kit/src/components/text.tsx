import type {
  ComponentConfig,
  ComponentMetadata,
  Fields,
} from "@puckeditor/core";
import type { ReactNode } from "react";
import { styleField } from "../fields/styleField";
import type { Styles } from "../styles/types";
import {
  advancedField,
  elementClass,
  htmlAttrs,
  Style,
  tagField,
  type Advanced,
  type KitContext,
} from "./shared";

export interface TextElementProps {
  tag: string;
  text: ReactNode;
  styles: Styles;
  advanced: Advanced;
}

export interface TextElementOptions {
  label: string;
  tags: string[];
  /** `text`: single line, inline-editable. `richtext`: Puck rich text (TipTap). */
  kind: "text" | "richtext";
  defaultText: string;
  defaultStyles?: Styles;
  /** Rich text toolbar options (e.g. disable headings inside a Paragraph). */
  richtextOptions?: Record<string, unknown>;
  metadata?: ComponentMetadata;
}

/**
 * Typography element. Rich text renders its own block markup (<p>, lists…), so rich text
 * elements whose tag can't contain blocks (like <p>) get a <div> wrapper; their content is
 * still real <p> elements.
 */
export function createTextElement(
  opts: TextElementOptions,
  ctx: KitContext,
): ComponentConfig<TextElementProps> {
  const fields = {
    ...(opts.tags.length > 1 ? { tag: tagField(opts.tags) } : {}),
    text:
      opts.kind === "richtext"
        ? {
            type: "richtext",
            label: "Text",
            contentEditable: true,
            options: opts.richtextOptions,
          }
        : { type: "text", label: "Text", contentEditable: true },
    styles: styleField({ breakpoints: ctx.breakpoints }),
    advanced: advancedField,
  } as Fields<TextElementProps>;

  return {
    label: opts.label,
    inline: true,
    fields,
    defaultProps: {
      tag: opts.tags[0],
      text: opts.defaultText,
      styles: opts.defaultStyles ?? {},
      advanced: {},
    },
    metadata: opts.metadata,
    render: ({ id, puck, tag, text, styles, advanced }) => {
      let Tag = (opts.tags.includes(tag) ? tag : opts.tags[0]) as "div";
      if (opts.kind === "richtext" && Tag === ("p" as string)) Tag = "div";
      return (
        <>
          <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
          <Tag
            ref={puck.dragRef}
            className={elementClass(
              id,
              advanced,
              opts.kind === "richtext" ? "pk-rich" : undefined,
            )}
            {...htmlAttrs(advanced)}
          >
            {text}
          </Tag>
        </>
      );
    },
  };
}
