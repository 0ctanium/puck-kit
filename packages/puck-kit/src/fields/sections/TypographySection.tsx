"use client";

import {
  ArrowRightToLine,
  CaseLower,
  Code,
  Pencil,
  Pilcrow,
  TextWrap,
  CaseSensitive,
  CaseUpper,
  Italic,
  Minus,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Type,
  Underline,
} from "lucide-react";
import { tokenRef } from "../../styles/tokens";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { ColorInput } from "../ui/ColorPicker";
import { defaultTextShadow, parseShadows, serializeTextShadows, type Shadow } from "../css/values";
import { resolveColor } from "../ui/ColorPicker";
import { LayerList } from "../ui/LayerList";
import { SampleIcon } from "../ui/icons";
import { ShadowEditor } from "./ShadowEditor";
import { PropSelect, PropToggle, PropUnit, Row, Select, TextInput } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";

const PROPS: StyleProp[] = [
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "textAlign",
  "textTransform", "textDecoration", "fontStyle", "whiteSpace", "textShadow",
];
const I = 14;

const WEIGHTS = [
  ["100", "Thin"],
  ["200", "Extra light"],
  ["300", "Light"],
  ["400", "Normal"],
  ["500", "Medium"],
  ["600", "Semi bold"],
  ["700", "Bold"],
  ["800", "Extra bold"],
  ["900", "Black"],
].map(([value, name]) => ({ value, label: name, hint: value, icon: <SampleIcon weight={value} /> }));

function FontRow() {
  const panel = usePanel();
  const r = panel.read("fontFamily");
  const fonts = panel.tokens.fonts?.filter((f) => f.name) ?? [];
  const options = fonts.map((f) => ({ value: tokenRef("fonts", f.name), label: f.name, icon: <SampleIcon family={f.value} /> }));
  const isToken = (v?: string) => !!v && options.some((o) => o.value === v);
  const custom = r.value !== undefined && !isToken(r.value);
  return (
    <>
      <Row label="Font" props={["fontFamily"]}>
        <div className={ui.grow}>
          <Select
            value={custom ? "__custom" : r.value}
            inherited={r.inherited}
            options={[...options, { value: "__custom", label: "Custom…", icon: <Pencil size={13} /> }]}
            placeholder="Inherit"
            readOnly={panel.readOnly}
            onChange={(v) => panel.write("fontFamily", v === "__custom" ? (r.value ?? "inherit") : v)}
          />
        </div>
      </Row>
      {custom && (
        <Row label="" props={[]}>
          <div className={ui.grow}>
            <TextInput value={r.value} placeholder="'Inter', sans-serif" onChange={(v) => panel.write("fontFamily", v)} />
          </div>
        </Row>
      )}
    </>
  );
}

export function TypographySection() {
  const panel = usePanel();
  const color = panel.read("color");
  return (
    <Section id="typography" title="Typography" icon={<Type size={14} />} props={PROPS}>
      <FontRow />
      <Row label="Weight" props={["fontWeight"]}>
        <div className={ui.grow}>
          <PropSelect prop="fontWeight" options={WEIGHTS} placeholder="Inherit" />
        </div>
      </Row>
      <div className={ui.grid2}>
        <Row label="Size" props={["fontSize"]} stacked scrub={{ min: 0 }}>
          <PropUnit prop="fontSize" min={0} units={["px", "rem", "em", "%", "vw"]} />
        </Row>
        <Row label="Height" props={["lineHeight"]} stacked scrub={{ min: 0, step: 0.1, defaultUnit: "" }}>
          <PropUnit prop="lineHeight" min={0} step={0.1} units={["", "px", "em", "%"]} defaultUnit="" keywords={["normal"]} />
        </Row>
      </div>
      <Row label="Color" props={["color"]}>
        <ColorInput
          value={color.value}
          inherited={color.inherited}
          tokens={panel.tokens}
          readOnly={panel.readOnly}
          onChange={(v) => panel.write("color", v)}
          title="Text color"
        />
      </Row>
      <Row label="Align" props={["textAlign"]}>
        <div className={ui.grow}>
          <PropToggle
            prop="textAlign"
            options={[
              { value: "left", label: "Left", icon: <TextAlignStart size={I} /> },
              { value: "center", label: "Center", icon: <TextAlignCenter size={I} /> },
              { value: "right", label: "Right", icon: <TextAlignEnd size={I} /> },
              { value: "justify", label: "Justify", icon: <TextAlignJustify size={I} /> },
            ]}
          />
        </div>
      </Row>
      <Row label="Style" props={["fontStyle", "textDecoration"]}>
        <div style={{ width: 36, flex: "none" }}>
          <PropToggle prop="fontStyle" options={[{ value: "italic", label: "Italic", icon: <Italic size={I} /> }]} />
        </div>
        <div className={ui.grow}>
          <PropToggle
            prop="textDecoration"
            options={[
              { value: "none", label: "No decoration", icon: <Minus size={I} /> },
              { value: "underline", label: "Underline", icon: <Underline size={I} /> },
              { value: "line-through", label: "Strikethrough", icon: <Strikethrough size={I} /> },
            ]}
          />
        </div>
      </Row>
      <Row label="Case" props={["textTransform"]}>
        <div className={ui.grow}>
          <PropToggle
            prop="textTransform"
            options={[
              { value: "none", label: "None", icon: <Minus size={I} /> },
              { value: "uppercase", label: "Uppercase", icon: <CaseUpper size={I} /> },
              { value: "capitalize", label: "Capitalize", icon: <CaseSensitive size={I} /> },
              { value: "lowercase", label: "Lowercase", icon: <CaseLower size={I} /> },
            ]}
          />
        </div>
      </Row>
      <div className={ui.grid2}>
        <Row label="Letter sp." props={["letterSpacing"]} stacked scrub={{ step: 0.1, defaultUnit: "px" }}>
          <PropUnit prop="letterSpacing" units={["px", "em"]} keywords={["normal"]} step={0.1} />
        </Row>
        <Row label="Wrap" props={["whiteSpace"]} stacked>
          <PropSelect
            prop="whiteSpace"
            placeholder="Normal"
            options={[
              { value: "normal", label: "Normal", icon: <TextWrap size={13} /> },
              { value: "nowrap", label: "No wrap", icon: <ArrowRightToLine size={13} /> },
              { value: "pre", label: "Preserve", icon: <Code size={13} /> },
              { value: "pre-wrap", label: "Preserve + wrap", icon: <Pilcrow size={13} /> },
              { value: "pre-line", label: "Lines only", icon: <Pilcrow size={13} /> },
            ]}
          />
        </Row>
      </div>
      <LayerList<Shadow>
        label="Text shadows"
        props={["textShadow"]}
        items={parseShadows(panel.get("textShadow"))}
        onChange={(next) => panel.write("textShadow", next.length ? serializeTextShadows(next) : undefined)}
        add={() => ({ ...defaultTextShadow })}
        renderPreview={(sh) => (
          <span style={{ fontWeight: 700, fontSize: 12, color: "var(--pk-ui-text)", textShadow: `1px 1px 2px ${resolveColor(sh.color, panel.tokens)}` }}>
            T
          </span>
        )}
        renderLabel={(sh) => (
          <>
            Text shadow
            <small>{[sh.x, sh.y, sh.blur].map((v) => v.replace("px", "")).join(" ")}</small>
          </>
        )}
        itemTitle={() => "Text shadow"}
        renderEditor={(sh, update) => <ShadowEditor shadow={sh} onChange={update} text />}
      />
    </Section>
  );
}
