"use client";

import { ArrowUpToLine, Crosshair, Move, Pin, Square } from "lucide-react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { PropSelect, PropUnit, Row } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { BoxValue, SIDES } from "./BoxModel";
import { Section } from "./Section";
import s from "./sections.module.css";

const INSET: StyleProp[] = ["top", "right", "bottom", "left"];
const PROPS: StyleProp[] = ["position", ...INSET, "zIndex"];

const PRESETS: { label: string; values: Partial<Record<StyleProp, string | undefined>> }[] = [
  { label: "Full", values: { top: "0", right: "0", bottom: "0", left: "0" } },
  { label: "Top", values: { top: "0", right: "0", bottom: undefined, left: "0" } },
  { label: "Bottom", values: { top: undefined, right: "0", bottom: "0", left: "0" } },
  { label: "Left", values: { top: "0", right: undefined, bottom: "0", left: "0" } },
  { label: "Right", values: { top: "0", right: "0", bottom: "0", left: undefined } },
  { label: "Center", values: { top: "50%", left: "50%", right: undefined, bottom: undefined, transform: "translate(-50%, -50%)" } },
];

export function PositionSection() {
  const panel = usePanel();
  const position = panel.get("position");
  const positioned = !!position && position !== "static";

  return (
    <Section id="position" title="Position" icon={<Crosshair size={14} />} props={PROPS}>
      <Row label="Position" props={["position"]}>
        <div className={ui.grow}>
          <PropSelect
            prop="position"
            placeholder="Static"
            options={[
              { value: "static", label: "Static", hint: "default", icon: <Square size={14} /> },
              { value: "relative", label: "Relative", hint: "offset", icon: <Move size={14} /> },
              { value: "absolute", label: "Absolute", hint: "parent", icon: <Crosshair size={14} /> },
              { value: "fixed", label: "Fixed", hint: "window", icon: <Pin size={14} /> },
              { value: "sticky", label: "Sticky", hint: "scroll", icon: <ArrowUpToLine size={14} /> },
            ]}
          />
        </div>
      </Row>
      {positioned && (
        <>
          <div className={`${s.box} ${s.boxMargin}`}>
            {SIDES.map((side, i) => (
              <BoxValue key={side} prop={INSET[i]} side={side} group={INSET} keywords={["auto"]} allowNegative />
            ))}
            <div className={s.boxCenter} style={{ margin: 0, minHeight: 26 }} />
          </div>
          {position !== "relative" && position !== "sticky" && (
            <div className={ui.chips}>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" className={ui.chip} disabled={panel.readOnly} onClick={() => panel.writeMany(p.values)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <Row label="Z-index" props={["zIndex"]} scrub={{ defaultUnit: "" }}>
        <div className={ui.grow}>
          <PropUnit prop="zIndex" units={[]} defaultUnit="" keywords={["auto"]} placeholder="auto" />
        </div>
      </Row>
    </Section>
  );
}
