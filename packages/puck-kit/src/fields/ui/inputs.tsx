"use client";

import { RotateCcw, X } from "lucide-react";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../../components/shared";
import { tokenRef, type Tokens } from "../../styles/tokens";
import type { StyleProp } from "../../styles/types";
import { stateOf, usePanel, type PropState } from "../context";
import { formatNumber, parseLength } from "../css/split";
import { Dropdown, DropdownMenu, type DropdownOption } from "./Dropdown";
import { usePopover } from "./Popover";
import ui from "./ui.module.css";
import { useScrub } from "./useScrub";

/* ----------------------------------------------------------------------------------------
 * Text input with local state (keeps the caret while Puck re-renders)
 * -------------------------------------------------------------------------------------- */

export function TextInput({
  value,
  onChange,
  className = ui.input,
  state,
  ...rest
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  className?: string;
  state?: PropState;
  placeholder?: string;
  readOnly?: boolean;
  list?: string;
  title?: string;
  "aria-label"?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value]);
  return (
    <input
      {...rest}
      className={className}
      data-state={state}
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange(e.target.value.trim() === "" ? undefined : e.target.value);
      }}
    />
  );
}

/* ----------------------------------------------------------------------------------------
 * Unit input: number + unit dropdown, keywords, size tokens, arrow keys
 * -------------------------------------------------------------------------------------- */

export const LENGTH_UNITS = ["px", "%", "em", "rem", "vw", "vh"];

export interface UnitInputProps {
  value: string | undefined;
  /** Shown as placeholder (inherited value). */
  inherited?: string;
  onChange: (value: string | undefined) => void;
  units?: string[];
  keywords?: string[];
  /** Unit used when typing a bare number. `""` for unitless properties. */
  defaultUnit?: string;
  /** Offer size tokens in the unit menu. */
  tokens?: Tokens;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  readOnly?: boolean;
  "aria-label"?: string;
}

function tokenName(value: string | undefined, tokens?: Tokens) {
  return tokens?.sizes?.find((t) => tokenRef("sizes", t.name) === value)?.name;
}

export function UnitInput({
  value,
  inherited,
  onChange,
  units = LENGTH_UNITS,
  keywords = [],
  defaultUnit = units[0] ?? "",
  tokens,
  step = 1,
  min,
  max,
  placeholder,
  readOnly,
  ...rest
}: UnitInputProps) {
  const parsed = parseLength(value);
  const inheritedParsed = parseLength(inherited);
  const token = tokenName(value, tokens);
  const isKeyword = !!value && !parsed && !token;
  const unit = parsed ? parsed.unit || defaultUnit : isKeyword ? "-" : (inheritedParsed?.unit ?? defaultUnit);
  const shown = parsed ? formatNumber(parsed.num) : isKeyword ? value : "";
  const [local, setLocal] = useState(shown ?? "");
  useEffect(() => setLocal(shown ?? ""), [shown]);

  const commit = (text: string) => {
    const t = text.trim();
    if (!t) return onChange(undefined);
    const p = parseLength(t);
    if (p) {
      let n = p.num;
      if (min !== undefined) n = Math.max(min, n);
      if (max !== undefined) n = Math.min(max, n);
      const u = p.unit || (unit === "-" ? defaultUnit : unit);
      return onChange(`${formatNumber(n)}${u}`);
    }
    onChange(t);
  };

  const nudge = (dir: 1 | -1, e: KeyboardEvent) => {
    const base = parsed ?? inheritedParsed ?? { num: 0, unit: defaultUnit };
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    let n = base.num + dir * step * mult;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    onChange(`${formatNumber(n)}${base.unit || (unit === "-" ? defaultUnit : unit)}`);
  };

  const inheritedLabel = inherited ? (tokenName(inherited, tokens) ?? inherited) : undefined;
  const sizeTokens = tokens?.sizes?.filter((t) => t.name) ?? [];
  const menu = usePopover();

  return (
    <div className={ui.unit} data-state={value ? "set" : inherited ? "inherited" : "empty"}>
      {token ? (
        <span className={ui.tokenChip} title={`Size token: ${token}`}>
          <span>{token}</span>
          {!readOnly && (
            <X size={12} style={{ cursor: "pointer" }} onClick={() => onChange(undefined)} aria-label="Remove token" />
          )}
        </span>
      ) : (
        <input
          {...rest}
          className={ui.unitValue}
          value={local}
          readOnly={readOnly}
          placeholder={inheritedParsed ? formatNumber(inheritedParsed.num) : (inheritedLabel ?? placeholder ?? "")}
          onChange={(e) => {
            setLocal(e.target.value);
            commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              nudge(e.key === "ArrowUp" ? 1 : -1, e);
            }
          }}
        />
      )}
      {(units.length > 0 || keywords.length > 0 || sizeTokens.length > 0) && (
        <>
          <button
            ref={(el) => {
              menu.anchorRef.current = el;
            }}
            type="button"
            className={ui.unitSuffix}
            title="Unit"
            aria-label="Unit"
            aria-haspopup="listbox"
            aria-expanded={menu.open}
            disabled={readOnly}
            onClick={menu.toggle}
          >
            {token ? "tok" : unit || "–"}
          </button>
          <DropdownMenu
            state={menu}
            width={150}
            value={token ? `token:${token}` : isKeyword ? value : unit}
            options={[
              ...units.map((u) => ({ value: u, label: u ? u.toUpperCase() : "None (number)", group: keywords.length || sizeTokens.length ? "Units" : undefined })),
              ...keywords.map((k) => ({ value: k, label: k, group: "Keywords" })),
              ...sizeTokens.map((t) => ({ value: `token:${t.name}`, label: t.name, hint: t.value, group: "Size tokens" })),
            ]}
            onSelect={(next) => {
              if (next === undefined) return;
              if (next.startsWith("token:")) return onChange(tokenRef("sizes", next.slice(6)));
              if (keywords.includes(next)) return onChange(next);
              const num = parsed?.num ?? inheritedParsed?.num ?? 0;
              onChange(`${formatNumber(num)}${next}`);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------------------
 * Select
 * -------------------------------------------------------------------------------------- */

export function Select({
  value,
  inherited,
  options,
  onChange,
  placeholder = "—",
  readOnly,
  clearable = true,
  "aria-label": ariaLabel,
}: {
  value: string | undefined;
  inherited?: string;
  options: DropdownOption[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  readOnly?: boolean;
  clearable?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Dropdown
      value={value}
      inherited={inherited}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      clearable={clearable}
      readOnly={readOnly}
      aria-label={ariaLabel}
    />
  );
}

/* ----------------------------------------------------------------------------------------
 * Toggle group (segmented control, icons or text)
 * -------------------------------------------------------------------------------------- */

export interface ToggleOption {
  value: string;
  label: string;
  icon?: ReactNode;
  /** Show the label next to the icon. */
  text?: boolean;
}

export function ToggleGroup({
  value,
  inherited,
  options,
  onChange,
  readOnly,
  allowEmpty = true,
  "aria-label": ariaLabel,
}: {
  value: string | undefined;
  inherited?: string;
  options: ToggleOption[];
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  /** Clicking the active option clears it. */
  allowEmpty?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className={ui.toggleGroup} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={ui.toggle}
          title={o.label}
          aria-label={o.label}
          aria-pressed={value === o.value}
          data-inherited={value === undefined && inherited === o.value}
          disabled={readOnly}
          onClick={() => onChange(value === o.value && allowEmpty ? undefined : o.value)}
        >
          {o.icon}
          {(!o.icon || o.text) && o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------------------
 * Property label + row
 * -------------------------------------------------------------------------------------- */

/**
 * Label of one or more style properties. Blue when set at this breakpoint (click resets),
 * orange when inherited. With `scrub`, dragging it changes the (first) value.
 */
export function PropLabel({
  label,
  props,
  scrub,
}: {
  label: string;
  props: StyleProp[];
  scrub?: { step?: number; min?: number; max?: number; defaultUnit?: string };
}) {
  const panel = usePanel();
  const reads = props.map(panel.read);
  const state = stateOf(reads);
  const first = reads[0];
  const scrubber = useScrub({
    value: first?.value,
    fallback: first?.inherited,
    onChange: (v) => panel.write(props[0], v),
    disabled: !scrub || panel.readOnly,
    ...scrub,
  });
  const fromLabel = reads.find((r) => r.from)?.from;
  const title =
    state === "set"
      ? `Set on ${panel.active.label}. Click to reset.`
      : state === "inherited"
        ? `Inherited from ${fromLabel}`
        : props.join(", ");

  return (
    <button
      type="button"
      className={ui.label}
      data-state={state}
      data-scrub={scrubber.enabled}
      title={scrubber.enabled ? `${title} Drag to adjust.` : title}
      {...scrubber.handlers}
      onClick={() => {
        if (scrubber.consumeDrag()) return;
        if (state === "set" && !panel.readOnly) {
          panel.writeMany(Object.fromEntries(props.map((p) => [p, undefined])));
        }
      }}
    >
      {label}
      <RotateCcw size={10} className={ui.labelReset} />
    </button>
  );
}

export function Row({
  label,
  props,
  scrub,
  stacked,
  children,
}: {
  label: string;
  props: StyleProp[];
  scrub?: { step?: number; min?: number; max?: number; defaultUnit?: string };
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cx(ui.row, stacked && ui.rowStacked)}>
      {label ? <PropLabel label={label} props={props} scrub={scrub} /> : <span />}
      <div className={ui.inline}>{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------------------------
 * Bound helpers: a control wired to one style property
 * -------------------------------------------------------------------------------------- */

export function PropUnit({
  prop,
  ...rest
}: { prop: StyleProp } & Omit<UnitInputProps, "value" | "inherited" | "onChange" | "tokens" | "readOnly">) {
  const panel = usePanel();
  const r = panel.read(prop);
  return (
    <UnitInput
      value={r.value}
      inherited={r.inherited}
      onChange={(v) => panel.write(prop, v)}
      tokens={panel.tokens}
      readOnly={panel.readOnly}
      aria-label={prop}
      {...rest}
    />
  );
}

export function PropToggle({ prop, options, allowEmpty }: { prop: StyleProp; options: ToggleOption[]; allowEmpty?: boolean }) {
  const panel = usePanel();
  const r = panel.read(prop);
  return (
    <ToggleGroup
      value={r.value}
      inherited={r.inherited}
      options={options}
      onChange={(v) => panel.write(prop, v)}
      readOnly={panel.readOnly}
      allowEmpty={allowEmpty}
      aria-label={prop}
    />
  );
}

export function PropSelect({ prop, options, placeholder }: { prop: StyleProp; options: DropdownOption[]; placeholder?: string }) {
  const panel = usePanel();
  const r = panel.read(prop);
  return (
    <Select
      value={r.value}
      inherited={r.inherited}
      options={options}
      onChange={(v) => panel.write(prop, v)}
      readOnly={panel.readOnly}
      placeholder={placeholder}
      aria-label={prop}
    />
  );
}

export const opts = (...values: string[]) => values.map((v) => ({ value: v, label: v }));
