"use client";

import { Eye, EyeOff, Ruler, ScrollText } from "lucide-react";
import type { StyleProp } from "../../styles/types";
import { FitIcon, RatioIcon } from "../ui/icons";
import { PropSelect, PropToggle, PropUnit, Row } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";

const PROPS: StyleProp[] = ["width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight", "aspectRatio", "overflow", "objectFit"];
const I = 14;

const RATIOS: [number, number, string][] = [
  [1, 1, "Square"],
  [16, 9, "Widescreen"],
  [4, 3, "Landscape"],
  [3, 2, "Photo"],
  [2, 1, "Wide"],
  [3, 4, "Portrait"],
  [9, 16, "Tall"],
];

function Dim({ prop, label, keywords }: { prop: StyleProp; label: string; keywords: string[] }) {
  return (
    <Row label={label} props={[prop]} stacked scrub={{ min: 0 }}>
      <div className={ui.grow}>
        <PropUnit prop={prop} keywords={keywords} min={0} />
      </div>
    </Row>
  );
}

export function SizeSection() {
  return (
    <Section id="size" title="Size" icon={<Ruler size={14} />} props={PROPS} defaultOpen>
      <div className={ui.grid2}>
        <Dim prop="width" label="Width" keywords={["auto", "fit-content", "min-content", "max-content"]} />
        <Dim prop="height" label="Height" keywords={["auto", "fit-content", "min-content", "max-content"]} />
        <Dim prop="minWidth" label="Min W" keywords={["auto", "fit-content"]} />
        <Dim prop="minHeight" label="Min H" keywords={["auto", "fit-content"]} />
        <Dim prop="maxWidth" label="Max W" keywords={["none", "fit-content"]} />
        <Dim prop="maxHeight" label="Max H" keywords={["none", "fit-content"]} />
      </div>
      <Row label="Overflow" props={["overflow"]}>
        <div className={ui.grow}>
          <PropToggle
            prop="overflow"
            options={[
              { value: "visible", label: "Visible", icon: <Eye size={I} /> },
              { value: "hidden", label: "Hidden", icon: <EyeOff size={I} /> },
              { value: "scroll", label: "Scroll", icon: <ScrollText size={I} /> },
              { value: "auto", label: "Auto" },
            ]}
          />
        </div>
      </Row>
      <Row label="Ratio" props={["aspectRatio"]}>
        <div className={ui.grow}>
          <PropSelect
            prop="aspectRatio"
            placeholder="Auto"
            options={RATIOS.map(([w, h, label]) => ({
              value: `${w} / ${h}`,
              label,
              hint: `${w}:${h}`,
              icon: <RatioIcon ratio={w / h} />,
            }))}
          />
        </div>
      </Row>
      <Row label="Fit" props={["objectFit"]}>
        <div className={ui.grow}>
          <PropSelect
            prop="objectFit"
            placeholder="Fill (images, videos)"
            options={(
              [
                ["fill", "Fill (stretch)"],
                ["contain", "Contain"],
                ["cover", "Cover"],
                ["none", "None (natural size)"],
                ["scale-down", "Scale down"],
              ] as const
            ).map(([value, label]) => ({ value, label, icon: <FitIcon fit={value} /> }))}
          />
        </div>
      </Row>
    </Section>
  );
}
