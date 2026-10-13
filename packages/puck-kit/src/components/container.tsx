import type {
  ComponentConfig,
  ComponentMetadata,
  Fields,
  SlotComponent,
} from "@puckeditor/core";
import type { ElementType } from "react";
import { styleField } from "../fields/styleField";
import type { Styles } from "../styles/types";
import {
  advancedField,
  elementClass,
  htmlAttrs,
  Style,
  tagField,
  tagWithAttrs,
  type Advanced,
  type KitContext,
} from "./shared";

export interface ContainerProps {
  tag: string;
  content: unknown;
  styles: Styles;
  advanced: Advanced;
  [key: string]: unknown;
}

export interface ContainerOptions {
  label: string;
  tags: string[];
  defaultStyles?: Styles;
  allow?: string[];
  disallow?: string[];
  /** Extra content fields shown before the style panel. */
  fields?: Fields;
  defaultProps?: Record<string, unknown>;
  /** Extra HTML attributes from props (e.g. href). Only rendered on the public page. */
  attrs?: (
    props: Record<string, unknown>,
  ) => Record<string, string | undefined>;
  minEmptyHeight?: number;
  metadata?: ComponentMetadata;
}

/**
 * A styled element whose children are a Puck slot. The slot *is* the element (`as`), so
 * flex/grid layouts apply directly to the dropped children, with no wrapper div.
 */
export function createContainer(
  opts: ContainerOptions,
  ctx: KitContext,
): ComponentConfig<ContainerProps> {
  const fields = {
    ...(opts.tags.length > 1 ? { tag: tagField(opts.tags) } : {}),
    ...(opts.fields ?? {}),
    content: { type: "slot", allow: opts.allow, disallow: opts.disallow },
    styles: styleField({ breakpoints: ctx.breakpoints }),
    advanced: advancedField,
  } as Fields<ContainerProps>;

  return {
    label: opts.label,
    inline: true,
    fields,
    metadata: opts.metadata,
    defaultProps: {
      tag: opts.tags[0],
      content: [],
      styles: opts.defaultStyles ?? {},
      advanced: {},
      ...(opts.defaultProps ?? {}),
    },
    render: (props) => {
      const { id, puck, styles, advanced } = props;
      const tag = opts.tags.includes(props.tag) ? props.tag : opts.tags[0];
      const Content = props.content as unknown as SlotComponent;
      const As = puck.isEditing
        ? (tag as ElementType)
        : tagWithAttrs(tag, htmlAttrs(advanced, opts.attrs?.(props)));
      return (
        <>
          <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
          <Content
            as={As}
            ref={puck.dragRef}
            className={elementClass(
              id,
              advanced,
              puck.isEditing ? "pk-slot" : undefined,
            )}
            minEmptyHeight={opts.minEmptyHeight ?? 48}
          />
        </>
      );
    },
  };
}
