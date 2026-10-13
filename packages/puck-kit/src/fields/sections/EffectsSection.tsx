"use client";

import {
  Ban,
  CircleQuestionMark,
  Coffee,
  Contrast,
  Droplet,
  Droplets,
  Eye,
  Hand,
  HandGrab,
  Layers,
  MousePointer2,
  Move,
  MoveHorizontal,
  MoveVertical,
  PaintBucket,
  Palette,
  Pointer,
  Rainbow,
  RotateCw,
  Scaling,
  Sparkles,
  Spline,
  Square,
  SquareDashed,
  Sun,
  TextCursor,
  Type,
  ZoomIn,
} from "lucide-react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { formatNumber, parseLength } from "../css/split";
import {
  defaultShadow,
  defaultTransforms,
  defaultTransition,
  FILTERS,
  parseFilters,
  parseShadows,
  parseTransforms,
  parseTransitions,
  serializeFilters,
  serializeShadows,
  serializeTransforms,
  serializeTransitions,
  type FilterFn,
  type Shadow,
  type Transform,
  type Transition,
} from "../css/values";
import { resolveColor } from "../ui/ColorPicker";
import { ShadowEditor } from "./ShadowEditor";
import { LayerList } from "../ui/LayerList";
import { EasingIcon } from "../ui/icons";
import { PropSelect, Row, Select, TextInput, ToggleGroup, UnitInput, opts } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";

const PROPS: StyleProp[] = ["opacity", "boxShadow", "transform", "transformOrigin", "transition", "filter", "backdropFilter", "mixBlendMode", "cursor"];

/* ---------------------------------------------------------------- Opacity */

function OpacityRow() {
  const panel = usePanel();
  const r = panel.read("opacity");
  const pct = Math.round(parseFloat(r.value ?? r.inherited ?? "1") * 100);
  const set = (p: number) => panel.write("opacity", formatNumber(Math.min(100, Math.max(0, p)) / 100));
  return (
    <Row label="Opacity" props={["opacity"]}>
      <input
        type="range"
        className={ui.slider}
        min={0}
        max={100}
        value={Number.isFinite(pct) ? pct : 100}
        disabled={panel.readOnly}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Opacity"
      />
      <div style={{ width: 62, flex: "none" }}>
        <UnitInput
          value={r.value ? `${pct}%` : undefined}
          inherited={r.inherited ? `${pct}%` : undefined}
          units={["%"]}
          defaultUnit="%"
          min={0}
          max={100}
          onChange={(v) => (v === undefined ? panel.write("opacity", undefined) : set(parseFloat(v)))}
          aria-label="Opacity %"
        />
      </div>
    </Row>
  );
}

/* ---------------------------------------------------------------- Transforms */

const TRANSFORM_META: Record<Transform["kind"], { label: string; icon: React.ReactNode }> = {
  move: { label: "Move", icon: <Move size={14} /> },
  scale: { label: "Scale", icon: <Scaling size={14} /> },
  rotate: { label: "Rotate", icon: <RotateCw size={14} /> },
  skew: { label: "Skew", icon: <Spline size={14} /> },
};

function describeTransform(t: Transform) {
  switch (t.kind) {
    case "move":
      return `${t.x}, ${t.y}`;
    case "scale":
      return t.x === t.y ? t.x : `${t.x}, ${t.y}`;
    case "rotate":
      return t.angle;
    case "skew":
      return `${t.x}, ${t.y}`;
  }
}

function TransformEditor({ t, onChange }: { t: Transform; onChange: (t: Transform) => void }) {
  const xy = (unitList: string[], defaultUnit: string, step = 1, min?: number) =>
    t.kind !== "rotate" && (
      <div className={ui.grid2}>
        {(["x", "y"] as const).map((axis) => (
          <Row key={axis} label={axis.toUpperCase()} props={[]} stacked>
            <UnitInput
              value={t[axis]}
              units={unitList}
              defaultUnit={defaultUnit}
              step={step}
              min={min}
              onChange={(v) => onChange({ ...t, [axis]: v ?? (t.kind === "scale" ? "1" : `0${defaultUnit}`) })}
              aria-label={`${t.kind} ${axis}`}
            />
          </Row>
        ))}
      </div>
    );
  return (
    <>
      <ToggleGroup
        value={t.kind}
        allowEmpty={false}
        options={(Object.keys(TRANSFORM_META) as Transform["kind"][]).map((k) => ({ value: k, label: TRANSFORM_META[k].label, icon: TRANSFORM_META[k].icon }))}
        onChange={(k) => onChange(defaultTransforms[k as Transform["kind"]])}
      />
      {t.kind === "move" && xy(["px", "%", "em", "rem", "vw", "vh"], "px")}
      {t.kind === "scale" && xy([""], "", 0.05, 0)}
      {t.kind === "skew" && xy(["deg"], "deg")}
      {t.kind === "rotate" && (
        <Row label="Angle" props={[]}>
          <input
            type="range"
            className={ui.slider}
            min={-180}
            max={180}
            value={parseFloat(t.angle) || 0}
            onChange={(e) => onChange({ ...t, angle: `${e.target.value}deg` })}
            aria-label="Angle"
          />
          <div style={{ width: 70, flex: "none" }}>
            <UnitInput value={t.angle} units={["deg", "turn"]} defaultUnit="deg" onChange={(v) => onChange({ ...t, angle: v ?? "0deg" })} aria-label="Angle" />
          </div>
        </Row>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Transitions */

const TRANSITION_PROPS = [
  { value: "all", label: "All properties", icon: <Layers size={13} /> },
  { value: "opacity", label: "Opacity", icon: <Eye size={13} /> },
  { value: "transform", label: "Transform", icon: <Move size={13} /> },
  { value: "background-color", label: "Background color", icon: <PaintBucket size={13} /> },
  { value: "color", label: "Text color", icon: <Type size={13} /> },
  { value: "border-color", label: "Border color", icon: <SquareDashed size={13} /> },
  { value: "box-shadow", label: "Box shadow", icon: <Square size={13} /> },
  { value: "filter", label: "Filter", icon: <Contrast size={13} /> },
  { value: "width", label: "Width", icon: <MoveHorizontal size={13} /> },
  { value: "height", label: "Height", icon: <MoveVertical size={13} /> },
];

const FILTER_ICONS: Record<string, React.ReactNode> = {
  blur: <Droplet size={13} />,
  brightness: <Sun size={13} />,
  contrast: <Contrast size={13} />,
  grayscale: <Palette size={13} />,
  "hue-rotate": <Rainbow size={13} />,
  invert: <Contrast size={13} style={{ transform: "scaleX(-1)" }} />,
  opacity: <Eye size={13} />,
  saturate: <Droplets size={13} />,
  sepia: <Coffee size={13} />,
};

const CURSORS = [
  { value: "auto", label: "Auto", icon: <MousePointer2 size={13} /> },
  { value: "default", label: "Default", icon: <MousePointer2 size={13} /> },
  { value: "pointer", label: "Pointer", icon: <Pointer size={13} /> },
  { value: "text", label: "Text", icon: <TextCursor size={13} /> },
  { value: "move", label: "Move", icon: <Move size={13} /> },
  { value: "grab", label: "Grab", icon: <Hand size={13} /> },
  { value: "grabbing", label: "Grabbing", icon: <HandGrab size={13} /> },
  { value: "zoom-in", label: "Zoom in", icon: <ZoomIn size={13} /> },
  { value: "help", label: "Help", icon: <CircleQuestionMark size={13} /> },
  { value: "not-allowed", label: "Not allowed", icon: <Ban size={13} /> },
];
const EASINGS_RAW = [
  { value: "ease", label: "Ease" },
  { value: "linear", label: "Linear" },
  { value: "ease-in", label: "Ease in" },
  { value: "ease-out", label: "Ease out" },
  { value: "ease-in-out", label: "Ease in-out" },
  { value: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "Back out (overshoot)" },
  { value: "cubic-bezier(0.16, 1, 0.3, 1)", label: "Expo out" },
];
const EASINGS = EASINGS_RAW.map((e) => ({ ...e, icon: <EasingIcon easing={e.value} /> }));

function TransitionEditor({ t, onChange }: { t: Transition; onChange: (t: Transition) => void }) {
  const ms = (v: string) => {
    const p = parseLength(v);
    return p ? (p.unit === "s" ? p.num * 1000 : p.num) : 0;
  };
  return (
    <>
      <Row label="Property" props={[]} stacked>
        <Select value={t.property} options={TRANSITION_PROPS} clearable={false} onChange={(v) => onChange({ ...t, property: v ?? "all" })} />
      </Row>
      <Row label="Duration" props={[]}>
        <input type="range" className={ui.slider} min={0} max={2000} step={50} value={ms(t.duration)} onChange={(e) => onChange({ ...t, duration: `${e.target.value}ms` })} aria-label="Duration" />
        <div style={{ width: 72, flex: "none" }}>
          <UnitInput value={t.duration} units={["ms", "s"]} defaultUnit="ms" min={0} step={50} onChange={(v) => onChange({ ...t, duration: v ?? "0ms" })} aria-label="Duration" />
        </div>
      </Row>
      <Row label="Easing" props={[]} stacked>
        <Select value={t.easing} options={EASINGS} clearable={false} onChange={(v) => onChange({ ...t, easing: v ?? "ease" })} />
      </Row>
      <Row label="Delay" props={[]}>
        <div className={ui.grow}>
          <UnitInput value={t.delay} units={["ms", "s"]} defaultUnit="ms" min={0} step={50} onChange={(v) => onChange({ ...t, delay: v ?? "0ms" })} aria-label="Delay" />
        </div>
      </Row>
    </>
  );
}

/* ---------------------------------------------------------------- Filters */

function FilterEditor({ f, onChange }: { f: FilterFn; onChange: (f: FilterFn) => void }) {
  const meta = FILTERS.find((x) => x.name === f.name) ?? FILTERS[0];
  const num = parseFloat(f.value) || 0;
  return (
    <>
      <Select
        clearable={false}
        value={f.name}
        options={FILTERS.map((x) => ({ value: x.name, label: x.label, icon: FILTER_ICONS[x.name] }))}
        onChange={(name) => {
          const next = FILTERS.find((x) => x.name === name) ?? FILTERS[0];
          onChange({ name: next.name, value: next.default });
        }}
      />
      <Row label="Amount" props={[]}>
        <input
          type="range"
          className={ui.slider}
          min={meta.min}
          max={meta.max}
          value={num}
          onChange={(e) => onChange({ ...f, value: `${e.target.value}${meta.unit}` })}
          aria-label={meta.label}
        />
        <div style={{ width: 70, flex: "none" }}>
          <UnitInput value={f.value} units={[meta.unit]} defaultUnit={meta.unit} min={meta.min} onChange={(v) => onChange({ ...f, value: v ?? meta.default })} aria-label={meta.label} />
        </div>
      </Row>
    </>
  );
}

function FilterList({ prop, label }: { prop: "filter" | "backdropFilter"; label: string }) {
  const panel = usePanel();
  const raw = panel.get(prop);
  const items = parseFilters(raw);
  if (items === null) {
    return (
      <Row label={label} props={[prop]} stacked>
        <TextInput value={panel.read(prop).value} placeholder={raw} onChange={(v) => panel.write(prop, v)} />
      </Row>
    );
  }
  return (
    <LayerList<FilterFn>
      label={label}
      props={[prop]}
      items={items}
      onChange={(next) => panel.write(prop, next.length ? serializeFilters(next) : undefined)}
      add={FILTERS.map((f) => ({ label: f.label, icon: FILTER_ICONS[f.name], create: () => ({ name: f.name, value: f.default }) }))}
      renderPreview={(f) => FILTER_ICONS[f.name] ?? <Contrast size={12} />}
      renderLabel={(f) => (
        <>
          {FILTERS.find((x) => x.name === f.name)?.label ?? f.name}
          <small>{f.value}</small>
        </>
      )}
      itemTitle={(f) => FILTERS.find((x) => x.name === f.name)?.label ?? "Filter"}
      renderEditor={(f, update) => <FilterEditor f={f} onChange={update} />}
    />
  );
}

/* ---------------------------------------------------------------- Section */

export function EffectsSection() {
  const panel = usePanel();
  const shadows = parseShadows(panel.get("boxShadow"));
  const transforms = parseTransforms(panel.get("transform"));
  const transitions = parseTransitions(panel.get("transition"));

  return (
    <Section id="effects" title="Effects" icon={<Sparkles size={14} />} props={PROPS}>
      <OpacityRow />
      <Row label="Blending" props={["mixBlendMode"]}>
        <div className={ui.grow}>
          <PropSelect prop="mixBlendMode" placeholder="Normal" options={opts("normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "difference", "luminosity")} />
        </div>
      </Row>
      <LayerList<Shadow>
        label="Box shadows"
        props={["boxShadow"]}
        items={shadows}
        onChange={(next) => panel.write("boxShadow", next.length ? serializeShadows(next) : undefined)}
        add={() => ({ ...defaultShadow })}
        renderPreview={(sh) => (
          <span
            style={{ width: 12, height: 12, borderRadius: 2, background: "#fff", boxShadow: `${sh.inset ? "inset " : ""}1px 1px 3px ${resolveColor(sh.color, panel.tokens)}` }}
          />
        )}
        renderLabel={(sh) => (
          <>
            {sh.inset ? "Inside" : "Outside"}
            <small>
              {[sh.x, sh.y, sh.blur, sh.spread].map((v) => v.replace("px", "")).join(" ")}
            </small>
          </>
        )}
        itemTitle={() => "Box shadow"}
        renderEditor={(sh, update) => <ShadowEditor shadow={sh} onChange={update} />}
      />
      {transforms === null ? (
        <Row label="Transform" props={["transform"]} stacked>
          <TextInput value={panel.read("transform").value} placeholder={panel.get("transform")} onChange={(v) => panel.write("transform", v)} />
        </Row>
      ) : (
        <LayerList<Transform>
          label="2D transforms"
          props={["transform"]}
          items={transforms}
          onChange={(next) => panel.write("transform", next.length ? serializeTransforms(next) : undefined)}
          add={(Object.keys(TRANSFORM_META) as Transform["kind"][]).map((k) => ({
            label: TRANSFORM_META[k].label,
            icon: TRANSFORM_META[k].icon,
            create: () => defaultTransforms[k],
          }))}
          renderPreview={(t) => TRANSFORM_META[t.kind].icon}
          renderLabel={(t) => (
            <>
              {TRANSFORM_META[t.kind].label}
              <small>{describeTransform(t)}</small>
            </>
          )}
          itemTitle={(t) => TRANSFORM_META[t.kind].label}
          renderEditor={(t, update) => <TransformEditor t={t} onChange={update} />}
        />
      )}
      <LayerList<Transition>
        label="Transitions"
        props={["transition"]}
        items={transitions}
        onChange={(next) => panel.write("transition", next.length ? serializeTransitions(next) : undefined)}
        add={() => ({ ...defaultTransition })}
        renderPreview={(t) => <EasingIcon easing={t.easing} />}
        renderLabel={(t) => (
          <>
            {TRANSITION_PROPS.find((p) => p.value === t.property)?.label ?? t.property}
            <small>
              {t.duration} {EASINGS.find((e) => e.value === t.easing)?.label.toLowerCase() ?? t.easing}
            </small>
          </>
        )}
        itemTitle={() => "Transition"}
        renderEditor={(t, update) => <TransitionEditor t={t} onChange={update} />}
      />
      <FilterList prop="filter" label="Filters" />
      <FilterList prop="backdropFilter" label="Backdrop filters" />
      <Row label="Cursor" props={["cursor"]}>
        <div className={ui.grow}>
          <PropSelect prop="cursor" placeholder="Auto" options={CURSORS} />
        </div>
      </Row>
    </Section>
  );
}
