"use client";

import { PaintBucket } from "lucide-react";
import type { StyleProp } from "../../styles/types";
import { BackgroundLayers } from "../BackgroundLayers";
import { usePanel } from "../context";
import { parseBackgroundLayers, serializeBackgroundLayers, type BackgroundLayer } from "../css/values";
import { ColorInput } from "../ui/ColorPicker";
import { PropToggle, Row } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";

const PROPS: StyleProp[] = [
  "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundAttachment",
];

/* ---------------------------------------------------------------- Section */

export function BackgroundSection() {
  const panel = usePanel();
  const color = panel.read("backgroundColor");
  const layers = parseBackgroundLayers({
    image: panel.get("backgroundImage"),
    size: panel.get("backgroundSize"),
    position: panel.get("backgroundPosition"),
    repeat: panel.get("backgroundRepeat"),
  });
  const save = (next: BackgroundLayer[]) => {
    const v = serializeBackgroundLayers(next);
    panel.writeMany({
      backgroundImage: v.image,
      backgroundSize: v.size,
      backgroundPosition: v.position,
      backgroundRepeat: v.repeat,
    });
  };

  return (
    <Section id="background" title="Backgrounds" icon={<PaintBucket size={14} />} props={PROPS}>
      <BackgroundLayers
        layers={layers}
        onChange={save}
        tokens={panel.tokens}
        readOnly={panel.readOnly}
        props={["backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat"]}
      />
      <Row label="Color" props={["backgroundColor"]}>
        <ColorInput
          value={color.value}
          inherited={color.inherited}
          tokens={panel.tokens}
          readOnly={panel.readOnly}
          onChange={(v) => panel.write("backgroundColor", v)}
          title="Background color"
        />
      </Row>
      {layers.length > 0 && (
        <Row label="Attach" props={["backgroundAttachment"]}>
          <div className={ui.grow}>
            <PropToggle
              prop="backgroundAttachment"
              options={[
                { value: "scroll", label: "Scroll" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </div>
        </Row>
      )}
    </Section>
  );
}
