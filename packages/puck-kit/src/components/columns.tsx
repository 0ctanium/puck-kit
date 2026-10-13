import type { ComponentConfig, Fields, SlotComponent } from "@puckeditor/core";
import { styleField } from "../fields/styleField";
import type { Styles } from "../styles/types";
import {
  advancedField,
  elementClass,
  htmlAttrs,
  Style,
  type Advanced,
  type KitContext,
} from "./shared";

export interface ColumnsProps {
  columns: { content: unknown }[];
  styles: Styles;
  advanced: Advanced;
}

const EQUAL = /^repeat\((\d+),minmax\(0,1fr\)\)$/;

/** A grid with one drop zone per column. Stacked on mobile, side by side from the first larger breakpoint. */
export function createColumns(ctx: KitContext): ComponentConfig<ColumnsProps> {
  const [, second] = [...ctx.breakpoints].sort(
    (a, b) => a.minWidth - b.minWidth,
  );
  const wideKey = second?.key ?? "base";

  return {
    label: "Columns",
    inline: true,
    fields: {
      columns: {
        type: "array",
        label: "Columns",
        min: 1,
        max: 12,
        arrayFields: { content: { type: "slot" } },
        defaultItemProps: { content: [] },
        getItemSummary: (_item: unknown, i?: number) =>
          `Column ${(i ?? 0) + 1}`,
      },
      styles: styleField({ breakpoints: ctx.breakpoints }),
      advanced: advancedField,
    } as Fields<ColumnsProps>,
    metadata: {
      icon: "columns-2",
    },
    defaultProps: {
      columns: [{ content: [] }, { content: [] }],
      styles: {
        base: {
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr)",
          gap: "24px",
        },
        [wideKey]: { gridTemplateColumns: "repeat(2,minmax(0,1fr))" },
      },
      advanced: {},
    },
    // Keep an equal-width template in sync with the number of columns.
    resolveData: (data, { changed }) => {
      if (!changed.columns) return data;
      const count = data.props.columns?.length ?? 0;
      const current = data.props.styles?.[wideKey]?.gridTemplateColumns;
      if (count < 1 || (current && !EQUAL.test(current))) return data;
      return {
        ...data,
        props: {
          ...data.props,
          styles: {
            ...data.props.styles,
            [wideKey]: {
              ...data.props.styles?.[wideKey],
              gridTemplateColumns: `repeat(${count},minmax(0,1fr))`,
            },
          },
        },
      };
    },
    render: ({ id, puck, columns, styles, advanced }) => (
      <>
        <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
        <div
          ref={puck.dragRef}
          className={elementClass(id, advanced)}
          {...htmlAttrs(advanced)}
        >
          {(columns ?? []).map((col, i) => {
            const Column = col.content as unknown as SlotComponent;
            return (
              <Column
                key={i}
                className={puck.isEditing ? "pk-col pk-slot" : "pk-col"}
                minEmptyHeight={64}
              />
            );
          })}
        </div>
      </>
    ),
  };
}
