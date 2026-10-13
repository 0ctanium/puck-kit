"use client";

import { createUsePuck } from "@puckeditor/core";
import { ChevronDown, Image as ImageIcon, Palette, SlidersHorizontal, ToggleLeft, Type } from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { cx } from "../components/shared";
import { BackgroundLayers } from "../fields/BackgroundLayers";
import { parseBackgroundLayers, serializeBackgroundLayers } from "../fields/css/values";
import { ColorInput } from "../fields/ui/ColorPicker";
import { Dropdown } from "../fields/ui/Dropdown";
import { FontPicker } from "../fields/ui/FontPicker";
import ui from "../fields/ui/ui.module.css";
import { formatNumber } from "../fields/css/split";
import type { Tokens } from "../styles/tokens";
import type { BackgroundField, BackgroundValue, CheckboxField, ColorField, FontField, RangeField } from "./definitions";
import css from "./fieldTypes.module.css";

const usePuck = createUsePuck();

/** Props Puck passes to `overrides.fieldTypes` renderers. */
export interface FieldTypeProps<F, V> {
  field: F & { label?: string; labelIcon?: ReactNode };
  name: string;
  id: string;
  value: V;
  onChange: (value: V) => void;
  readOnly?: boolean;
  label?: string;
  labelIcon?: ReactNode;
  Label: ComponentType<{ label: string; icon?: ReactNode; readOnly?: boolean; children: ReactNode }>;
  children?: ReactNode;
}

function useTokens(): Tokens {
  return (usePuck((s) => s.appState.data.root?.props?.tokens) ?? {}) as Tokens;
}

/** Puck label + the kit's theme. `data-pk-panel` makes popovers open beside the field. */
function Shell<F, V>({ props, icon, children }: { props: FieldTypeProps<F, V>; icon: ReactNode; children: ReactNode }) {
  const { Label } = props;
  return (
    <Label label={props.label || props.field.label || props.name} icon={props.labelIcon || icon} readOnly={props.readOnly}>
      <div className={cx(ui.theme, css.field)} data-pk-panel="">
        {children}
      </div>
    </Label>
  );
}

/* ---------------------------------------------------------------- color */

export function ColorFieldType(props: FieldTypeProps<ColorField, string | undefined>) {
  const tokens = useTokens();
  return (
    <Shell props={props} icon={<Palette size={16} />}>
      <ColorInput
        value={props.value || undefined}
        onChange={(v) => props.onChange(v ?? "")}
        tokens={props.field.tokens === false ? {} : tokens}
        readOnly={props.readOnly}
        title={props.label || props.field.label || "Color"}
      />
    </Shell>
  );
}

/* ---------------------------------------------------------------- background */

export function BackgroundFieldType(props: FieldTypeProps<BackgroundField, BackgroundValue | undefined>) {
  const tokens = useTokens();
  const value = props.value ?? {};
  const layers = parseBackgroundLayers(value);
  return (
    <Shell props={props} icon={<ImageIcon size={16} />}>
      <div className={css.stack}>
        <ColorInput
          value={value.color || undefined}
          onChange={(color) => props.onChange({ ...value, color })}
          tokens={tokens}
          readOnly={props.readOnly}
          title="Background color"
        />
        <BackgroundLayers
          layers={layers}
          tokens={tokens}
          readOnly={props.readOnly}
          onChange={(next) => {
            const v = serializeBackgroundLayers(next);
            props.onChange({ ...value, image: v.image, size: v.size, position: v.position, repeat: v.repeat });
          }}
        />
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------------------- font */

export function FontFieldType(props: FieldTypeProps<FontField, string | undefined>) {
  const tokens = useTokens();
  return (
    <Shell props={props} icon={<Type size={16} />}>
      <FontPicker
        value={props.value || undefined}
        onChange={(v) => props.onChange(v ?? "")}
        tokens={props.field.tokens === false ? undefined : tokens}
        readOnly={props.readOnly}
        placeholder="Default"
      />
    </Shell>
  );
}

/* ---------------------------------------------------------------- range */

export function RangeFieldType(props: FieldTypeProps<RangeField, number | undefined>) {
  const { min, max, step = 1, unit } = props.field;
  const value = typeof props.value === "number" ? props.value : min;
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(formatNumber(value)), [value]);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <Shell props={props} icon={<SlidersHorizontal size={16} />}>
      <div className={css.range}>
        <input
          type="range"
          className={ui.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={props.readOnly}
          onChange={(e) => props.onChange(Number(e.target.value))}
          aria-label={props.label || props.name}
        />
        <div className={cx(ui.unit, css.rangeInput)}>
          <input
            className={ui.unitValue}
            inputMode="decimal"
            value={local}
            readOnly={props.readOnly}
            onChange={(e) => {
              setLocal(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value.trim() !== "" && Number.isFinite(n)) props.onChange(clamp(n));
            }}
            onBlur={() => setLocal(formatNumber(value))}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              const mult = e.shiftKey ? 10 : 1;
              props.onChange(clamp(value + (e.key === "ArrowUp" ? step : -step) * mult));
            }}
            aria-label={`${props.label || props.name} value`}
          />
          {unit && <span className={css.unit}>{unit}</span>}
        </div>
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------------------- checkbox (switch) */

export function CheckboxFieldType(props: FieldTypeProps<CheckboxField, boolean | undefined>) {
  const on = !!props.value;
  return (
    <Shell props={props} icon={<ToggleLeft size={16} />}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={css.switchRow}
        disabled={props.readOnly}
        onClick={() => props.onChange(!on)}
      >
        <span className={css.switch} data-on={on}>
          <i />
        </span>
        <span>{props.field.text ?? (on ? "On" : "Off")}</span>
      </button>
    </Shell>
  );
}

/* ---------------------------------------------------------------- select (replaces Puck's) */

interface SelectOption {
  label: string;
  value: unknown;
  icon?: ReactNode;
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Puck's `select` with the kit's dropdown. Option values can be any JSON value. */
export function SelectFieldType(props: FieldTypeProps<{ type: "select"; options: SelectOption[] }, unknown>) {
  const options = props.field.options ?? [];
  const index = options.findIndex((o) => same(o.value, props.value));
  return (
    <Shell props={props} icon={<ChevronDown size={16} />}>
      <Dropdown
        value={index >= 0 ? String(index) : undefined}
        options={options.map((o, i) => ({ value: String(i), label: o.label, icon: o.icon }))}
        clearable={false}
        placeholder="Select…"
        readOnly={props.readOnly}
        aria-label={props.label || props.name}
        onChange={(v) => v !== undefined && props.onChange(options[Number(v)]?.value)}
      />
    </Shell>
  );
}

/* ---------------------------------------------------------------- object (restyled) */

/**
 * Puck's `object` field, kept as is (its nested-field logic is internal) but styled as a
 * section: bold heading, no card, sub-fields in the normal flow — like Shopify's settings.
 */
export function ObjectFieldType(props: FieldTypeProps<unknown, unknown>) {
  return <div className={css.objectGroup}>{props.children}</div>;
}

/**
 * Renderers for `overrides.fieldTypes`: the kit's field types (color, background, font,
 * range, checkbox), a nicer `select` and a section-style `object`. Registered by the Tokens plugin.
 */
export const kitFieldTypes = {
  color: ColorFieldType,
  background: BackgroundFieldType,
  font: FontFieldType,
  range: RangeFieldType,
  checkbox: CheckboxFieldType,
  select: SelectFieldType,
  object: ObjectFieldType,
};
