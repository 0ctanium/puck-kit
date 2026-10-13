import type { BaseField, SelectField } from "@puckeditor/core";
import type { CSSProperties, ReactNode } from "react";

/* Field types added to Puck by the kit (rendered via `overrides.fieldTypes`, registered by the
   Tokens plugin). Use them in any component:

   const Banner: ComponentConfig<{ props: BannerProps; fields: KitFields }> = {
     fields: { accent: { type: "color", label: "Accent" }, ... },
   };
*/

/** A color, or a color token (`var(--pk-color-…)`). Value: CSS color string. */
export interface ColorField extends BaseField {
  type: "color";
  /** Offer the page's color tokens (default true). */
  tokens?: boolean;
  /** Allow clearing the value (default true). */
  clearable?: boolean;
}

/** Background color + image/gradient layers. Value: `BackgroundValue` (use `backgroundStyle()`). */
export interface BackgroundField extends BaseField {
  type: "background";
}

/** A font from the library or a font token. Value: CSS font-family string. */
export interface FontField extends BaseField {
  type: "font";
  /** Offer the page's font tokens (default true). */
  tokens?: boolean;
}

/** A slider + number. Value: number. */
export interface RangeField extends BaseField {
  type: "range";
  min: number;
  max: number;
  step?: number;
  /** Shown after the number, e.g. "px", "%", "ms". */
  unit?: string;
}

/** A switch. Value: boolean. */
export interface CheckboxField extends BaseField {
  type: "checkbox";
  /** Text next to the switch (defaults to "On"/"Off"). */
  text?: string;
}

/** The kit's extra field types, for `ComponentConfig<{ props; fields: KitFields }>`. */
export type KitFields = {
  color: ColorField;
  background: BackgroundField;
  font: FontField;
  range: RangeField;
  checkbox: CheckboxField;
};

export type KitField = KitFields[keyof KitFields];

/** Value of a `background` field: CSS values, comma-separated per layer like CSS. */
export interface BackgroundValue {
  color?: string;
  image?: string;
  size?: string;
  position?: string;
  repeat?: string;
}

/** Inline style for a `background` field value (tokens are CSS variables, so they just work). */
export function backgroundStyle(value: BackgroundValue | null | undefined): CSSProperties {
  if (!value) return {};
  const style: CSSProperties = {};
  if (value.color) style.backgroundColor = value.color;
  if (value.image && value.image !== "none") {
    style.backgroundImage = value.image;
    if (value.size) style.backgroundSize = value.size;
    if (value.position) style.backgroundPosition = value.position;
    if (value.repeat) style.backgroundRepeat = value.repeat;
  }
  return style;
}

/**
 * Options with icons for a `select` field (the kit's dropdown shows them; Puck's option type
 * has no `icon`, hence this helper).
 */
export function iconOptions(options: { label: string; value: string | number | boolean | null; icon?: ReactNode }[]): SelectField["options"] {
  return options as SelectField["options"];
}
