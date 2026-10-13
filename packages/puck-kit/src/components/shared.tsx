import { createElement, type ElementType, type Ref } from "react";
import type { Field } from "@puckeditor/core";
import { defaultBreakpoints, type Breakpoint } from "../breakpoints";
import { ElementStyle } from "../styles/ElementStyle";
import { styleClass } from "../styles/compile";
import type { Styles } from "../styles/types";

export interface Advanced {
  htmlId?: string;
  className?: string;
  ariaLabel?: string;
}

export interface KitContext {
  breakpoints: Breakpoint[];
}

export const defaultKitContext: KitContext = {
  breakpoints: defaultBreakpoints,
};

export const advancedField: Field<Advanced> = {
  type: "object",
  label: "Advanced",
  metadata: {
    category: "Style",
  },
  objectFields: {
    htmlId: { type: "text", label: "HTML id" },
    className: { type: "text", label: "Extra classes" },
    ariaLabel: { type: "text", label: "ARIA label" },
  },
};

export function tagField(tags: string[]): Field<string> {
  return {
    type: "select",
    label: "Tag",
    metadata: {
      category: "Style",
    },
    options: tags.map((t) => ({ label: `<${t}>`, value: t })),
  };
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function elementClass(
  id: string,
  advanced?: Advanced,
  extra?: string,
): string {
  return cx(
    styleClass(id),
    extra,
    advanced?.className?.replace(/[^\w\s-]/g, ""),
  );
}

export function htmlAttrs(
  advanced?: Advanced,
  extra?: Record<string, string | undefined>,
) {
  const attrs: Record<string, string> = {};
  if (advanced?.htmlId) attrs.id = advanced.htmlId;
  if (advanced?.ariaLabel) attrs["aria-label"] = advanced.ariaLabel;
  for (const [k, v] of Object.entries(extra ?? {})) if (v) attrs[k] = v;
  return attrs;
}

const tagCache = new Map<string, ElementType>();

/**
 * Puck slots only forward `className`, `style` and `ref` to their `as` element. To render
 * attributes (href, id, aria-*) on a slot element we pass a tiny component bound to them.
 * Cached by tag + attributes so its identity is stable across renders.
 */
export function tagWithAttrs(
  tag: string,
  attrs: Record<string, string>,
): ElementType {
  if (Object.keys(attrs).length === 0) return tag as ElementType;
  const key = tag + JSON.stringify(attrs);
  let component = tagCache.get(key);
  if (!component) {
    const Bound = ({
      ref,
      ...props
    }: { ref?: Ref<Element> } & Record<string, unknown>) =>
      createElement(tag, { ...attrs, ...props, ref });
    Bound.displayName = `pk.${tag}`;
    if (tagCache.size > 2000) tagCache.clear();
    tagCache.set(key, Bound);
    component = Bound;
  }
  return component;
}

export function Style({
  id,
  styles,
  editing,
  ctx,
}: {
  id: string;
  styles: Styles | undefined;
  editing: boolean;
  ctx: KitContext;
}) {
  return (
    <ElementStyle
      id={id}
      styles={styles}
      editing={editing}
      breakpoints={ctx.breakpoints}
    />
  );
}
