"use client";

import { Minus, SquareDashed, SquareRoundCorner, X } from "lucide-react";
import { useState } from "react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { ColorInput } from "../ui/ColorPicker";
import { PropLabel, PropUnit, Row, ToggleGroup } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";
import s from "./sections.module.css";

type BorderSide = "all" | "Top" | "Right" | "Bottom" | "Left";
const SIDES: BorderSide[] = ["Top", "Right", "Bottom", "Left"];
const CORNERS = ["TopLeft", "TopRight", "BottomLeft", "BottomRight"] as const;

const sideProps = (side: BorderSide) =>
  (side === "all"
    ? ["borderWidth", "borderStyle", "borderColor"]
    : [`border${side}Width`, `border${side}Style`, `border${side}Color`]) as [StyleProp, StyleProp, StyleProp];

const CORNER_PROPS = CORNERS.map((c) => `border${c}Radius` as StyleProp);
const PROPS: StyleProp[] = [
  "borderRadius",
  ...CORNER_PROPS,
  ...sideProps("all"),
  ...SIDES.flatMap((side) => sideProps(side)),
];

function Radius() {
  const panel = usePanel();
  const hasCorners = CORNER_PROPS.some((p) => panel.get(p) !== undefined);
  const [individual, setIndividual] = useState(hasCorners);
  return (
    <>
      <Row label="Radius" props={individual ? CORNER_PROPS : ["borderRadius"]} scrub={individual ? undefined : { min: 0 }}>
        <div className={ui.grow}>
          {individual ? (
            <div className={s.corners}>
              {CORNERS.map((c, i) => (
                <div key={c} className={s.corner} title={c}>
                  <span className={s.cornerIcon} data-corner={c} />
                  <PropUnit prop={CORNER_PROPS[i]} min={0} />
                </div>
              ))}
            </div>
          ) : (
            <PropUnit prop="borderRadius" min={0} />
          )}
        </div>
        <button
          type="button"
          className={ui.iconButton}
          aria-pressed={individual}
          title={individual ? "Same radius on all corners" : "Set each corner"}
          disabled={panel.readOnly}
          onClick={() => {
            if (individual) panel.writeMany(Object.fromEntries(CORNER_PROPS.map((p) => [p, undefined])));
            setIndividual(!individual);
          }}
        >
          <SquareRoundCorner size={14} />
        </button>
      </Row>
    </>
  );
}

function SidePicker({ side, onChange }: { side: BorderSide; onChange: (s: BorderSide) => void }) {
  const panel = usePanel();
  const isSet = (sd: BorderSide) => sideProps(sd).some((p) => panel.read(p).state === "set");
  const cell = (sd: BorderSide, col: number, row: number) => (
    <button
      key={sd}
      type="button"
      className={s.sideButton}
      data-side={sd.toLowerCase()}
      data-set={isSet(sd)}
      aria-pressed={side === sd}
      title={sd === "all" ? "All sides" : `${sd} side`}
      style={{ gridColumn: col, gridRow: row }}
      onClick={() => onChange(sd)}
    >
      <i />
    </button>
  );
  return (
    <div className={s.sides} role="group" aria-label="Border side">
      {cell("Top", 2, 1)}
      {cell("Left", 1, 2)}
      {cell("all", 2, 2)}
      {cell("Right", 3, 2)}
      {cell("Bottom", 2, 3)}
    </div>
  );
}

function BorderEditor() {
  const panel = usePanel();
  const [side, setSide] = useState<BorderSide>("all");
  const [width, style, color] = sideProps(side);
  const styleRead = panel.read(style);
  const colorRead = panel.read(color);
  return (
    <div className={s.borderEditor}>
      <SidePicker side={side} onChange={setSide} />
      <div className={s.borderFields}>
        <div className={ui.inline}>
          <PropLabel label="Style" props={[style]} />
          <div className={ui.grow}>
            <ToggleGroup
              value={styleRead.value}
              inherited={styleRead.inherited}
              readOnly={panel.readOnly}
              onChange={(v) => panel.write(style, v)}
              options={[
                { value: "none", label: "None", icon: <X size={13} /> },
                { value: "solid", label: "Solid", icon: <Minus size={13} /> },
                { value: "dashed", label: "Dashed", icon: <SquareDashed size={13} /> },
                { value: "dotted", label: "Dotted", icon: <span style={{ letterSpacing: 1, fontWeight: 700 }}>···</span> },
              ]}
            />
          </div>
        </div>
        <div className={ui.inline}>
          <PropLabel label="Width" props={[width]} scrub={{ min: 0 }} />
          <div className={ui.grow}>
            <PropUnit prop={width} min={0} units={["px", "em", "rem"]} />
          </div>
        </div>
        <ColorInput
          value={colorRead.value}
          inherited={colorRead.inherited}
          tokens={panel.tokens}
          readOnly={panel.readOnly}
          onChange={(v) => panel.write(color, v)}
          title="Border color"
        />
      </div>
    </div>
  );
}

export function BorderSection() {
  return (
    <Section id="border" title="Borders" icon={<SquareDashed size={14} />} props={PROPS}>
      <Radius />
      <BorderEditor />
    </Section>
  );
}
