"use client";

import { usePanel } from "../context";
import type { Shadow } from "../css/values";
import { ColorPicker } from "../ui/ColorPicker";
import { Row, ToggleGroup, UnitInput } from "../ui/inputs";
import ui from "../ui/ui.module.css";

/** Editor for one box-shadow or text-shadow layer (`text`: no inset, no spread). */
export function ShadowEditor({ shadow, onChange, text }: { shadow: Shadow; onChange: (s: Shadow) => void; text?: boolean }) {
  const panel = usePanel();
  const field = (key: "x" | "y" | "blur" | "spread", label: string, min?: number) => (
    <Row label={label} props={[]} stacked>
      <UnitInput value={shadow[key]} units={["px", "em", "rem"]} min={min} onChange={(v) => onChange({ ...shadow, [key]: v ?? "0px" })} aria-label={label} />
    </Row>
  );
  return (
    <>
      {!text && (
        <ToggleGroup
          value={shadow.inset ? "inside" : "outside"}
          allowEmpty={false}
          options={[
            { value: "outside", label: "Outside" },
            { value: "inside", label: "Inside" },
          ]}
          onChange={(v) => onChange({ ...shadow, inset: v === "inside" })}
        />
      )}
      <div className={ui.grid2} style={text ? { gridTemplateColumns: "repeat(3, minmax(0,1fr))" } : undefined}>
        {field("x", "X offset")}
        {field("y", "Y offset")}
        {field("blur", "Blur", 0)}
        {!text && field("spread", "Spread")}
      </div>
      <ColorPicker value={shadow.color} onChange={(c) => onChange({ ...shadow, color: c ?? "transparent" })} tokens={panel.tokens} allowClear={false} />
    </>
  );
}
