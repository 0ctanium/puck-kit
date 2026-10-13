"use client";

import { Maximize2, MoveHorizontal, MoveVertical } from "lucide-react";
import { cx } from "../../components/shared";
import { tokenRef } from "../../styles/tokens";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { formatNumber, parseLength } from "../css/split";
import { Popover, usePopover } from "../ui/Popover";
import { UnitInput } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { useScrub } from "../ui/useScrub";
import s from "./sections.module.css";

export type Side = "top" | "right" | "bottom" | "left";
export const SIDES: Side[] = ["top", "right", "bottom", "left"];

/** marginTop → "Margin top" */
const humanize = (prop: string) => prop.replace(/([A-Z])/g, " $1").toLowerCase().replace(/^./, (c) => c.toUpperCase());

const PRESETS = ["0", "4px", "8px", "12px", "16px", "24px", "32px", "48px", "64px"];

function short(value: string | undefined, tokens: ReturnType<typeof usePanel>["tokens"]) {
  if (!value) return undefined;
  const token = tokens.sizes?.find((t) => tokenRef("sizes", t.name) === value);
  if (token) return token.name;
  const p = parseLength(value);
  if (!p) return value;
  return p.unit === "px" || p.num === 0 ? formatNumber(p.num) : `${formatNumber(p.num)}${p.unit}`;
}

/**
 * One editable value of a box diagram: drag to scrub (vertical sides drag up/down feel,
 * but horizontal drag works everywhere), click to open a popover with input, presets and
 * "apply to opposite/all sides".
 */
export function BoxValue({
  prop,
  side,
  group,
  keywords = [],
  allowNegative,
}: {
  prop: StyleProp;
  side: Side;
  /** The 4 properties of this box, in top/right/bottom/left order. */
  group: StyleProp[];
  keywords?: string[];
  allowNegative?: boolean;
}) {
  const panel = usePanel();
  const pop = usePopover();
  const r = panel.read(prop);
  const scrub = useScrub({
    value: r.value,
    fallback: r.inherited,
    onChange: (v) => panel.write(prop, v),
    min: allowNegative ? undefined : 0,
    disabled: panel.readOnly,
  });
  const value = r.value ?? r.inherited;
  const opposite = group[(SIDES.indexOf(side) + 2) % 4];

  return (
    <>
      <button
        type="button"
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        className={cx(s.boxValue, s[side])}
        data-state={r.state}
        data-axis={side === "left" || side === "right" ? "x" : "y"}
        aria-expanded={pop.open}
        aria-label={prop}
        title={`${prop}${r.state === "inherited" ? ` (inherited from ${r.from})` : ""} — drag to adjust, click to edit`}
        {...scrub.handlers}
        onClick={() => {
          if (scrub.consumeDrag()) return;
          pop.toggle();
        }}
      >
        {short(value, panel.tokens) ?? "0"}
      </button>
      <Popover state={pop} title={humanize(prop)} width={220}>
        <UnitInput
          value={r.value}
          inherited={r.inherited}
          onChange={(v) => panel.write(prop, v)}
          keywords={keywords}
          tokens={panel.tokens}
          min={allowNegative ? undefined : 0}
          readOnly={panel.readOnly}
          aria-label={prop}
        />
        <div className={ui.chips}>
          {PRESETS.map((p) => (
            <button key={p} type="button" className={ui.chip} aria-pressed={r.value === p} onClick={() => panel.write(prop, p)}>
              {p === "0" ? "0" : p.replace("px", "")}
            </button>
          ))}
          {keywords.map((k) => (
            <button key={k} type="button" className={ui.chip} aria-pressed={r.value === k} onClick={() => panel.write(prop, k)}>
              {k}
            </button>
          ))}
          {panel.tokens.sizes
            ?.filter((t) => t.name)
            .map((t) => (
              <button
                key={t.name}
                type="button"
                className={ui.chip}
                title={`${t.name}: ${t.value}`}
                aria-pressed={r.value === tokenRef("sizes", t.name)}
                onClick={() => panel.write(prop, tokenRef("sizes", t.name))}
              >
                {t.name}
              </button>
            ))}
        </div>
        <div className={ui.inline}>
          <button
            type="button"
            className={ui.button}
            style={{ flex: 1 }}
            disabled={!value}
            onClick={() => panel.writeMany({ [prop]: value, [opposite]: value })}
            title="Apply to the opposite side too"
          >
            {side === "left" || side === "right" ? <MoveHorizontal size={12} /> : <MoveVertical size={12} />}
            Both sides
          </button>
          <button
            type="button"
            className={ui.button}
            style={{ flex: 1 }}
            disabled={!value}
            onClick={() => panel.writeMany(Object.fromEntries(group.map((p) => [p, value])))}
            title="Apply to all four sides"
          >
            <Maximize2 size={12} /> All sides
          </button>
        </div>
      </Popover>
    </>
  );
}
