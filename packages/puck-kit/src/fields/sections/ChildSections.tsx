"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  Baseline,
  Expand,
  LayoutGrid,
  Lock,
  MoveHorizontal,
  Settings2,
  Shrink,
  StretchHorizontal,
  StretchVertical,
} from "lucide-react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { PropToggle, PropUnit, Row, ToggleGroup, type ToggleOption } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";
import { Stepper } from "./LayoutSection";

const I = 14;

/* ---------------------------------------------------------------- Shared rows */

function OrderRow() {
  const panel = usePanel();
  const order = panel.get("order");
  const mode = order === "-1" ? "first" : order === "9999" ? "last" : order !== undefined ? "custom" : undefined;
  return (
    <Row label="Order" props={["order"]}>
      <div className={ui.grow}>
        <ToggleGroup
          value={mode}
          readOnly={panel.readOnly}
          options={[
            { value: "first", label: "First", icon: <ArrowUpToLine size={I} />, text: true },
            { value: "last", label: "Last", icon: <ArrowDownToLine size={I} />, text: true },
            { value: "custom", label: "Custom" },
          ]}
          onChange={(v) => panel.write("order", v === "first" ? "-1" : v === "last" ? "9999" : v === "custom" ? "1" : undefined)}
        />
      </div>
      {mode === "custom" && (
        <div style={{ width: 52 }}>
          <PropUnit prop="order" units={[]} defaultUnit="" />
        </div>
      )}
    </Row>
  );
}

/** Cross-axis icons: a child of a row aligns vertically, a child of a column horizontally. */
function crossAxisOptions(column: boolean, flex: boolean): ToggleOption[] {
  const [start, center, end] = flex ? ["flex-start", "center", "flex-end"] : ["start", "center", "end"];
  const options: ToggleOption[] = column
    ? [
        { value: start, label: "Left", icon: <AlignStartVertical size={I} /> },
        { value: center, label: "Center", icon: <AlignCenterVertical size={I} /> },
        { value: end, label: "Right", icon: <AlignEndVertical size={I} /> },
        { value: "stretch", label: "Stretch", icon: <StretchHorizontal size={I} /> },
      ]
    : [
        { value: start, label: "Top", icon: <AlignStartHorizontal size={I} /> },
        { value: center, label: "Center", icon: <AlignCenterHorizontal size={I} /> },
        { value: end, label: "Bottom", icon: <AlignEndHorizontal size={I} /> },
        { value: "stretch", label: "Stretch", icon: <StretchVertical size={I} /> },
      ];
  if (flex) options.push({ value: "baseline", label: "Baseline", icon: <Baseline size={I} /> });
  return options;
}

/* ---------------------------------------------------------------- Flex child */

export const FLEX_CHILD_PROPS: StyleProp[] = ["flexGrow", "flexShrink", "flexBasis", "alignSelf", "order"];

const SIZING = [
  { value: "shrink", label: "Shrink if needed", grow: "0", shrink: "1", basis: "auto", icon: <Shrink size={I} /> },
  { value: "grow", label: "Grow if possible", grow: "1", shrink: "1", basis: "0%", icon: <Expand size={I} /> },
  { value: "none", label: "Don't shrink or grow", grow: "0", shrink: "0", basis: "auto", icon: <Lock size={I} /> },
] as const;

export function FlexChildSection() {
  const panel = usePanel();
  const column = (panel.parent?.flexDirection ?? "row").startsWith("column");
  const grow = panel.get("flexGrow");
  const shrink = panel.get("flexShrink");
  const basis = panel.get("flexBasis");
  const anySizing = grow !== undefined || shrink !== undefined || basis !== undefined;
  const preset = anySizing
    ? (SIZING.find((p) => p.grow === (grow ?? "0") && p.shrink === (shrink ?? "1") && p.basis === (basis ?? "auto"))?.value ?? "custom")
    : undefined;
  const setSizing = (value: string | undefined) => {
    if (value === "custom") return panel.writeMany({ flexGrow: grow ?? "0", flexShrink: shrink ?? "1", flexBasis: basis ?? "auto" });
    const p = SIZING.find((x) => x.value === value);
    panel.writeMany({ flexGrow: p?.grow, flexShrink: p?.shrink, flexBasis: p?.basis });
  };

  return (
    <Section id="flexChild" title="Flex child" icon={<MoveHorizontal size={14} />} props={FLEX_CHILD_PROPS}>
      <Row label="Sizing" props={["flexGrow", "flexShrink", "flexBasis"]}>
        <div className={ui.grow}>
          <ToggleGroup
            value={preset}
            readOnly={panel.readOnly}
            options={[...SIZING.map(({ value, label, icon }) => ({ value, label, icon })), { value: "custom", label: "Custom", icon: <Settings2 size={I} /> }]}
            onChange={setSizing}
          />
        </div>
      </Row>
      {preset === "custom" && (
        <div className={ui.grid2} style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <Row label="Grow" props={["flexGrow"]} stacked scrub={{ min: 0, defaultUnit: "" }}>
            <PropUnit prop="flexGrow" units={[]} defaultUnit="" min={0} />
          </Row>
          <Row label="Shrink" props={["flexShrink"]} stacked scrub={{ min: 0, defaultUnit: "" }}>
            <PropUnit prop="flexShrink" units={[]} defaultUnit="" min={0} />
          </Row>
          <Row label="Basis" props={["flexBasis"]} stacked scrub={{ min: 0 }}>
            <PropUnit prop="flexBasis" keywords={["auto", "content"]} />
          </Row>
        </div>
      )}
      <Row label="Align self" props={["alignSelf"]}>
        <div className={ui.grow}>
          <PropToggle prop="alignSelf" options={crossAxisOptions(column, true)} />
        </div>
      </Row>
      <OrderRow />
    </Section>
  );
}

/* ---------------------------------------------------------------- Grid child */

export const GRID_CHILD_PROPS: StyleProp[] = ["gridColumn", "gridRow", "justifySelf", "alignSelf", "order"];

/** "span 2" → 2, "1 / -1" → "full", nothing → 1. Other values → null (shown as text). */
function readSpan(v: string | undefined): number | "full" | null {
  const t = v?.trim();
  if (!t || t === "auto") return 1;
  if (t === "1 / -1") return "full";
  const m = /^span\s+(\d+)$/.exec(t);
  return m ? Number(m[1]) : null;
}

function SpanRow({ prop, label }: { prop: "gridColumn" | "gridRow"; label: string }) {
  const panel = usePanel();
  const span = readSpan(panel.get(prop));
  const full = span === "full";
  return (
    <Row label={label} props={[prop]}>
      <div className={ui.grow}>
        {span === null ? (
          <PropUnit prop={prop} units={[]} defaultUnit="" />
        ) : (
          <Stepper
            label={label.toLowerCase()}
            value={full ? 1 : span}
            max={24}
            disabled={full || panel.readOnly}
            onChange={(n) => panel.write(prop, n <= 1 ? undefined : `span ${n}`)}
          />
        )}
      </div>
      <button
        type="button"
        className={ui.iconButton}
        aria-pressed={full}
        title={full ? "Back to a single track" : `Span the full ${prop === "gridColumn" ? "row" : "column"}`}
        disabled={panel.readOnly}
        onClick={() => panel.write(prop, full ? undefined : "1 / -1")}
      >
        {prop === "gridColumn" ? <StretchHorizontal size={13} /> : <StretchVertical size={13} />}
      </button>
    </Row>
  );
}

export function GridChildSection() {
  return (
    <Section id="gridChild" title="Grid child" icon={<LayoutGrid size={14} />} props={GRID_CHILD_PROPS}>
      <SpanRow prop="gridColumn" label="Columns" />
      <SpanRow prop="gridRow" label="Rows" />
      <Row label="Horizontal" props={["justifySelf"]}>
        <div className={ui.grow}>
          <PropToggle prop="justifySelf" options={crossAxisOptions(true, false)} />
        </div>
      </Row>
      <Row label="Vertical" props={["alignSelf"]}>
        <div className={ui.grow}>
          <PropToggle prop="alignSelf" options={crossAxisOptions(false, false)} />
        </div>
      </Row>
      <OrderRow />
    </Section>
  );
}
