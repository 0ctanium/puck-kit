"use client";

import { Blend, Columns3, Grid2x2, Image as ImageIcon, PaintBucket, Rows3, Square } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import type { Tokens } from "../../styles/tokens";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import {
  imageUrl,
  layerKind,
  parseBackgroundLayers,
  parseGradient,
  serializeBackgroundLayers,
  serializeGradient,
  urlImage,
  type BackgroundLayer,
  type Gradient,
} from "../css/values";
import { ColorInput, ColorPicker, resolveColor } from "../ui/ColorPicker";
import { LayerList } from "../ui/LayerList";
import { PropToggle, Row, TextInput, ToggleGroup, UnitInput } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";
import s from "./sections.module.css";

const PROPS: StyleProp[] = [
  "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundAttachment",
];

/** Replace token references inside a value with their raw colors, for previews. */
function previewValue(value: string, tokens: Tokens) {
  return value.replace(/var\(--pk-color-[a-z0-9-]+\)/g, (ref) => resolveColor(ref, tokens) ?? ref);
}

/* ---------------------------------------------------------------- Gradient editor */

function AngleDial({ angle, onChange }: { angle: number; onChange: (a: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const update = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const a = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    const deg = (Math.round(a) + 360) % 360;
    onChange(e.shiftKey ? Math.round(deg / 15) * 15 : deg);
  };
  return (
    <div
      ref={ref}
      className={s.angleDial}
      title="Drag to set the angle (Shift snaps to 15°)"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && update(e)}
    >
      <i style={{ transform: `rotate(${angle}deg)` }} />
    </div>
  );
}

function GradientEditor({ gradient, onChange, tokens }: { gradient: Gradient; onChange: (g: Gradient) => void; tokens: Tokens }) {
  const [selected, setSelected] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const stop = gradient.stops[Math.min(selected, gradient.stops.length - 1)];
  const preview = previewValue(serializeGradient({ ...gradient, type: "linear", angle: 90 }), tokens);

  const posFromEvent = (e: PointerEvent) => {
    const r = barRef.current!.getBoundingClientRect();
    return Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  const updateStop = (i: number, patch: Partial<Gradient["stops"][number]>) =>
    onChange({ ...gradient, stops: gradient.stops.map((st, j) => (j === i ? { ...st, ...patch } : st)) });

  return (
    <>
      <div className={ui.inline}>
        <div className={ui.grow}>
          <ToggleGroup
            value={gradient.type}
            allowEmpty={false}
            options={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
            ]}
            onChange={(t) => onChange({ ...gradient, type: (t as Gradient["type"]) ?? "linear" })}
          />
        </div>
        {gradient.type === "linear" && (
          <>
            <AngleDial angle={gradient.angle} onChange={(angle) => onChange({ ...gradient, angle })} />
            <div style={{ width: 64 }}>
              <UnitInput
                value={`${gradient.angle}deg`}
                units={["deg"]}
                defaultUnit="deg"
                onChange={(v) => onChange({ ...gradient, angle: parseFloat(v ?? "0") || 0 })}
                aria-label="Angle"
              />
            </div>
          </>
        )}
      </div>
      <div
        ref={barRef}
        className={s.gradientBar}
        title="Click to add a color stop"
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget && !(e.target as HTMLElement).matches("i")) return;
          const position = posFromEvent(e);
          const stops = [...gradient.stops, { color: stop.color, position }];
          onChange({ ...gradient, stops });
          setSelected(stops.length - 1);
        }}
      >
        <i style={{ background: preview }} />
        {gradient.stops.map((st, i) => (
          <button
            key={i}
            type="button"
            className={s.stop}
            aria-pressed={i === selected}
            aria-label={`Color stop ${i + 1}`}
            style={{ left: `${st.position}%`, background: resolveColor(st.color, tokens) }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelected(i);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) updateStop(i, { position: posFromEvent(e) });
            }}
          />
        ))}
      </div>
      <div className={ui.inline}>
        <span className={ui.muted}>Stop {selected + 1}</span>
        <div style={{ width: 70 }}>
          <UnitInput
            value={`${stop.position}%`}
            units={["%"]}
            defaultUnit="%"
            min={0}
            max={100}
            onChange={(v) => updateStop(selected, { position: parseFloat(v ?? "0") || 0 })}
            aria-label="Stop position"
          />
        </div>
        <span className={ui.grow} />
        <button
          type="button"
          className={ui.button}
          disabled={gradient.stops.length <= 2}
          onClick={() => {
            onChange({ ...gradient, stops: gradient.stops.filter((_, j) => j !== selected) });
            setSelected(0);
          }}
        >
          Remove stop
        </button>
      </div>
      <ColorPicker value={stop.color} onChange={(c) => updateStop(selected, { color: c ?? "transparent" })} tokens={tokens} allowClear={false} />
    </>
  );
}

/* ---------------------------------------------------------------- Image layer editor */

const POSITIONS = [
  "left top", "center top", "right top",
  "left center", "center center", "right center",
  "left bottom", "center bottom", "right bottom",
];

function normalizePosition(p: string) {
  const map: Record<string, string> = { "0% 0%": "left top", "50% 50%": "center center", center: "center center", top: "center top", bottom: "center bottom", left: "left center", right: "right center" };
  return map[p.trim()] ?? p.trim();
}

function ImageLayerEditor({ layer, onChange }: { layer: BackgroundLayer; onChange: (l: BackgroundLayer) => void }) {
  const size = ["cover", "contain", "auto"].includes(layer.size) ? layer.size : "custom";
  const pos = normalizePosition(layer.position);
  return (
    <>
      <Row label="Image URL" props={[]} stacked>
        <TextInput value={imageUrl(layer.image)} placeholder="https://…" onChange={(v) => onChange({ ...layer, image: urlImage(v ?? "") })} />
      </Row>
      <Row label="Size" props={[]} stacked>
        <ToggleGroup
          value={size}
          allowEmpty={false}
          options={[
            { value: "cover", label: "Cover" },
            { value: "contain", label: "Contain" },
            { value: "auto", label: "Auto" },
            { value: "custom", label: "Custom" },
          ]}
          onChange={(v) => onChange({ ...layer, size: v === "custom" ? "100% auto" : (v ?? "auto") })}
        />
        {size === "custom" && <TextInput value={layer.size} placeholder="100% auto" onChange={(v) => onChange({ ...layer, size: v ?? "auto" })} />}
      </Row>
      <Row label="Position" props={[]}>
        <div className={s.pad} role="group" aria-label="Position">
          {POSITIONS.map((p) => (
            <button key={p} type="button" className={s.padDot} title={p} aria-pressed={pos === p} onClick={() => onChange({ ...layer, position: p })} />
          ))}
        </div>
        <div className={ui.grow}>
          <TextInput value={layer.position} onChange={(v) => onChange({ ...layer, position: v ?? "center center" })} aria-label="Custom position" />
        </div>
      </Row>
      <Row label="Tile" props={[]} stacked>
        <ToggleGroup
          value={layer.repeat}
          allowEmpty={false}
          options={[
            { value: "no-repeat", label: "Don't tile", icon: <Square size={14} /> },
            { value: "repeat", label: "Tile", icon: <Grid2x2 size={14} /> },
            { value: "repeat-x", label: "Tile horizontally", icon: <Columns3 size={14} /> },
            { value: "repeat-y", label: "Tile vertically", icon: <Rows3 size={14} /> },
          ]}
          onChange={(v) => onChange({ ...layer, repeat: v ?? "repeat" })}
        />
      </Row>
    </>
  );
}

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
      <LayerList<BackgroundLayer>
        label="Image & gradient"
        props={["backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat"]}
        items={layers}
        onChange={save}
        add={[
          {
            label: "Image",
            icon: <ImageIcon size={14} />,
            create: () => ({ image: urlImage(""), size: "cover", position: "center center", repeat: "no-repeat" }),
          },
          {
            label: "Linear gradient",
            icon: <Blend size={14} />,
            create: () => ({
              image: "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%)",
              size: "auto",
              position: "0% 0%",
              repeat: "repeat",
            }),
          },
          {
            label: "Radial gradient",
            icon: <Blend size={14} />,
            create: () => ({
              image: "radial-gradient(circle, #ffffff 0%, #4f46e5 100%)",
              size: "auto",
              position: "0% 0%",
              repeat: "repeat",
            }),
          },
        ]}
        renderPreview={(l) => <span className={s.preview} style={{ backgroundImage: previewValue(l.image, panel.tokens), backgroundSize: "cover", backgroundPosition: "center" }} />}
        renderLabel={(l) => {
          const kind = layerKind(l.image);
          if (kind === "image") return imageUrl(l.image).split("/").pop() || "Image";
          if (kind === "linear") return "Linear gradient";
          if (kind === "radial") return "Radial gradient";
          return l.image;
        }}
        itemTitle={(l) => (layerKind(l.image) === "image" ? "Image" : "Gradient")}
        renderEditor={(l, update) => {
          const kind = layerKind(l.image);
          if (kind === "image") return <ImageLayerEditor layer={l} onChange={update} />;
          const g = parseGradient(l.image);
          if (g) return <GradientEditor gradient={g} tokens={panel.tokens} onChange={(next) => update({ ...l, image: serializeGradient(next) })} />;
          return (
            <Row label="CSS value" props={[]} stacked>
              <TextInput value={l.image} onChange={(v) => update({ ...l, image: v ?? "none" })} />
            </Row>
          );
        }}
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
