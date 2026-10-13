import type { CustomField } from "@puckeditor/core";
import { defaultBreakpoints, type Breakpoint } from "../breakpoints";
import type { Styles } from "../styles/types";
import { StyleFieldRender } from "./StylePanel";

export interface StyleFieldOptions {
  label?: string;
  breakpoints?: Breakpoint[];
  /** Limit the panel to some sections: layout, child, spacing, size, position, typography, background, border, effects. */
  sections?: string[];
}

/** The `styles` field: a responsive style panel. Add it to any component as `styles: styleField()`. */
export function styleField(
  options: StyleFieldOptions = {},
): CustomField<Styles> {
  return {
    type: "custom",
    label: options.label ?? "Style",
    metadata: {
      category: "Style",
      breakpoints: options.breakpoints ?? defaultBreakpoints,
      sections: options.sections,
    },
    render: StyleFieldRender as CustomField<Styles>["render"],
  };
}
