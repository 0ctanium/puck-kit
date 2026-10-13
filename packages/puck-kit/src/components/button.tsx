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
      href: { type: "url", label: "Link URL" },
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
    } as unknown as Fields<ButtonProps>,
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
          transition: "transform 150ms ease, box-shadow 200ms ease, filter 200ms ease",
        },
        // Interaction states: lift on hover, press down, visible keyboard focus ring.
        "base:hover": {
          transform: "translate(0px, -1px)",
          boxShadow: "0px 4px 12px 0px rgba(17, 24, 39, 0.15)",
          filter: "brightness(110%)",
        },
        "base:focus-visible": {
          boxShadow: "0px 0px 0px 3px rgba(79, 70, 229, 0.35)",
        },
        "base:active": {
          transform: "scale(0.98, 0.98)",
          boxShadow: "none",
          filter: "brightness(95%)",
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

export interface TextLinkProps {
  text: ReactNode;
  href: string;
  target: "" | "_blank";
  styles: Styles;
  advanced: Advanced;
}

/** An inline `<a>` with link styling, for links inside text-like layouts. */
export function createTextLink(ctx: KitContext): ComponentConfig<TextLinkProps> {
  return {
    label: "Text Link",
    inline: true,
    fields: {
      text: { type: "text", label: "Text", contentEditable: true },
      href: { type: "url", label: "Link URL" },
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
    } as unknown as Fields<TextLinkProps>,
    metadata: {
      icon: "link-2",
    },
    defaultProps: {
      text: "Text link",
      href: "#",
      target: "",
      styles: {
        base: {
          color: "var(--pk-color-primary)",
          textDecoration: "underline",
          cursor: "pointer",
          transition: "opacity 150ms ease",
        },
        "base:hover": { opacity: "0.75" },
      },
      advanced: {},
    },
    render: ({ id, puck, text, href, target, styles, advanced }) => (
      <>
        <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
        <a
          ref={puck.dragRef}
          className={elementClass(id, advanced)}
          href={puck.isEditing ? undefined : href || undefined}
          target={target || undefined}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          {...htmlAttrs(advanced)}
        >
          {text}
        </a>
      </>
    ),
  };
}
