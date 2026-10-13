import type { ComponentConfig, Fields } from "@puckeditor/core";
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

export interface ButtonProps {
  tag: "a" | "button";
  label: ReactNode;
  href: string;
  target: "" | "_blank";
  styles: Styles;
  advanced: Advanced;
}

export function createButton(ctx: KitContext): ComponentConfig<ButtonProps> {
  return {
    label: "Button",
    inline: true,
    fields: {
      tag: tagField(["a", "button"]),
      label: { type: "text", label: "Label", contentEditable: true },
      href: { type: "text", label: "Link URL" },
      target: {
        type: "radio",
        label: "Open in",
        options: [
          { label: "Same tab", value: "" },
          { label: "New tab", value: "_blank" },
        ],
      },
      styles: styleField({ breakpoints: ctx.breakpoints }),
      advanced: advancedField,
    } as Fields<ButtonProps>,
    metadata: {
      icon: "square-mouse-pointer",
    },
    resolveFields: (data, { fields }) => {
      if (data.props.tag !== "button") return fields;
      const { href: _h, target: _t, ...rest } = fields;
      return rest as typeof fields;
    },
    defaultProps: {
      tag: "a",
      label: "Button",
      href: "#",
      target: "",
      styles: {
        base: {
          display: "inline-block",
          paddingTop: "12px",
          paddingBottom: "12px",
          paddingLeft: "20px",
          paddingRight: "20px",
          backgroundColor: "var(--pk-color-primary)",
          color: "var(--pk-color-white)",
          borderRadius: "6px",
          borderWidth: "0",
          fontWeight: "600",
          textDecoration: "none",
          textAlign: "center",
          cursor: "pointer",
        },
      },
      advanced: {},
    },
    render: ({ id, puck, tag, label, href, target, styles, advanced }) => {
      const className = elementClass(id, advanced);
      const attrs = htmlAttrs(advanced);
      return (
        <>
          <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
          {tag === "button" ? (
            <button
              ref={puck.dragRef}
              type="button"
              className={className}
              {...attrs}
            >
              {label}
            </button>
          ) : (
            <a
              ref={puck.dragRef}
              className={className}
              href={puck.isEditing ? undefined : href || undefined}
              target={target || undefined}
              rel={target === "_blank" ? "noopener noreferrer" : undefined}
              {...attrs}
            >
              {label}
            </a>
          )}
        </>
      );
    },
  };
}
