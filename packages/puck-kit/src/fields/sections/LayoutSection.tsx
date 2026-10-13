"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceAround,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalSpaceAround,
  AlignVerticalSpaceBetween,
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  Baseline,
  Columns3,
  Ellipsis,
  LayoutGrid,
  RectangleHorizontal,
  SquareDashed,
  Type,
  LayoutDashboard,
  Link2,
  Minus,
  Plus,
  Settings2,
  StretchHorizontal,
  StretchVertical,
  TextWrap,
  Unlink,
  X,
} from "lucide-react";
import { useState } from "react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { parseTracks, serializeTracks } from "../css/values";
import { DropdownMenu } from "../ui/Dropdown";
import { Popover, usePopover } from "../ui/Popover";
import { PropToggle, PropUnit, Row, TextInput, ToggleGroup, UnitInput, type ToggleOption } from "../ui/inputs";
import ui from "../ui/ui.module.css";
import { Section } from "./Section";
import s from "./sections.module.css";

const PROPS: StyleProp[] = [
  "display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap",
  "gridTemplateColumns", "gridTemplateRows", "gridAutoFlow", "justifyItems",
];

const I = 14;

const DISPLAY: ToggleOption[] = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
  { value: "none", label: "None" },
];
const MORE_DISPLAY = [
  { value: "inline", label: "Inline", icon: <Type size={I} /> },
  { value: "inline-block", label: "Inline block", icon: <RectangleHorizontal size={I} /> },
  { value: "inline-flex", label: "Inline flex", icon: <Columns3 size={I} /> },
  { value: "inline-grid", label: "Inline grid", icon: <LayoutGrid size={I} /> },
  { value: "contents", label: "Contents (no box)", icon: <SquareDashed size={I} /> },
];

/** Icons follow the flex direction, like Webflow: they always show the visual result. */
function alignOptions(column: boolean): ToggleOption[] {
  return column
    ? [
        { value: "flex-start", label: "Left", icon: <AlignStartVertical size={I} /> },
        { value: "center", label: "Center", icon: <AlignCenterVertical size={I} /> },
        { value: "flex-end", label: "Right", icon: <AlignEndVertical size={I} /> },
        { value: "stretch", label: "Stretch", icon: <StretchHorizontal size={I} /> },
        { value: "baseline", label: "Baseline", icon: <Baseline size={I} /> },
      ]
    : [
        { value: "flex-start", label: "Top", icon: <AlignStartHorizontal size={I} /> },
        { value: "center", label: "Center", icon: <AlignCenterHorizontal size={I} /> },
        { value: "flex-end", label: "Bottom", icon: <AlignEndHorizontal size={I} /> },
        { value: "stretch", label: "Stretch", icon: <StretchVertical size={I} /> },
        { value: "baseline", label: "Baseline", icon: <Baseline size={I} /> },
      ];
}

function justifyOptions(column: boolean): ToggleOption[] {
  return column
    ? [
        { value: "flex-start", label: "Top", icon: <AlignVerticalJustifyStart size={I} /> },
        { value: "center", label: "Center", icon: <AlignVerticalJustifyCenter size={I} /> },
        { value: "flex-end", label: "Bottom", icon: <AlignVerticalJustifyEnd size={I} /> },
        { value: "space-between", label: "Space between", icon: <AlignVerticalSpaceBetween size={I} /> },
        { value: "space-around", label: "Space around", icon: <AlignVerticalSpaceAround size={I} /> },
      ]
    : [
        { value: "flex-start", label: "Left", icon: <AlignHorizontalJustifyStart size={I} /> },
        { value: "center", label: "Center", icon: <AlignHorizontalJustifyCenter size={I} /> },
        { value: "flex-end", label: "Right", icon: <AlignHorizontalJustifyEnd size={I} /> },
        { value: "space-between", label: "Space between", icon: <AlignHorizontalSpaceBetween size={I} /> },
        { value: "space-around", label: "Space around", icon: <AlignHorizontalSpaceAround size={I} /> },
      ];
}

const GRID_ALIGN: ToggleOption[] = [
  { value: "start", label: "Start", icon: <AlignStartHorizontal size={I} /> },
  { value: "center", label: "Center", icon: <AlignCenterHorizontal size={I} /> },
  { value: "end", label: "End", icon: <AlignEndHorizontal size={I} /> },
  { value: "stretch", label: "Stretch", icon: <StretchVertical size={I} /> },
];
const GRID_JUSTIFY: ToggleOption[] = [
  { value: "start", label: "Start", icon: <AlignStartVertical size={I} /> },
  { value: "center", label: "Center", icon: <AlignCenterVertical size={I} /> },
  { value: "end", label: "End", icon: <AlignEndVertical size={I} /> },
  { value: "stretch", label: "Stretch", icon: <StretchHorizontal size={I} /> },
];

/** gap, or row-gap + column-gap when unlinked. */
function GapRow() {
  const panel = usePanel();
  const split = panel.get("rowGap") !== undefined || panel.get("columnGap") !== undefined;
  const [unlinked, setUnlinked] = useState(split);
  const link = (
    <button
      type="button"
      className={ui.iconButton}
      aria-pressed={unlinked}
      title={unlinked ? "Use one gap for rows and columns" : "Set row and column gaps separately"}
      onClick={() => {
        if (unlinked) panel.writeMany({ rowGap: undefined, columnGap: undefined });
        setUnlinked(!unlinked);
      }}
    >
      {unlinked ? <Unlink size={13} /> : <Link2 size={13} />}
    </button>
  );
  if (!unlinked) {
    return (
      <Row label="Gap" props={["gap"]} scrub={{ min: 0 }}>
        <div className={ui.grow}>
          <PropUnit prop="gap" min={0} />
        </div>
        {link}
      </Row>
    );
  }
  return (
    <>
      <Row label="Row gap" props={["rowGap"]} scrub={{ min: 0 }}>
        <div className={ui.grow}>
          <PropUnit prop="rowGap" min={0} />
        </div>
        {link}
      </Row>
      <Row label="Col gap" props={["columnGap"]} scrub={{ min: 0 }}>
        <div className={ui.grow}>
          <PropUnit prop="columnGap" min={0} />
        </div>
        <span style={{ width: 26 }} />
      </Row>
    </>
  );
}

function FlexControls() {
  const panel = usePanel();
  const dir = panel.get("flexDirection") ?? "row";
  const column = dir.startsWith("column");
  const reversed = dir.endsWith("reverse");
  const dirRead = panel.read("flexDirection");

  return (
    <>
      <Row label="Direction" props={["flexDirection"]}>
        <div className={ui.grow}>
          <ToggleGroup
            value={dirRead.value?.replace("-reverse", "")}
            inherited={dirRead.inherited?.replace("-reverse", "") ?? (dirRead.value ? undefined : "row")}
            allowEmpty={false}
            readOnly={panel.readOnly}
            options={[
              { value: "row", label: "Horizontal", icon: <ArrowRight size={I} />, text: true },
              { value: "column", label: "Vertical", icon: <ArrowDown size={I} />, text: true },
            ]}
            onChange={(v) => panel.write("flexDirection", reversed ? `${v}-reverse` : v)}
          />
        </div>
        <button
          type="button"
          className={ui.iconButton}
          aria-pressed={reversed}
          title="Reverse order"
          disabled={panel.readOnly}
          onClick={() => panel.write("flexDirection", `${column ? "column" : "row"}${reversed ? "" : "-reverse"}`)}
        >
          <ArrowRightLeft size={13} />
        </button>
      </Row>
      <Row label="Align" props={["alignItems"]}>
        <div className={ui.grow}>
          <PropToggle prop="alignItems" options={alignOptions(column)} />
        </div>
      </Row>
      <Row label="Justify" props={["justifyContent"]}>
        <div className={ui.grow}>
          <PropToggle prop="justifyContent" options={justifyOptions(column)} />
        </div>
      </Row>
      <GapRow />
      <Row label="Children" props={["flexWrap"]}>
        <div className={ui.grow}>
          <PropToggle
            prop="flexWrap"
            options={[
              { value: "nowrap", label: "Don't wrap" },
              { value: "wrap", label: "Wrap", icon: <TextWrap size={I} />, text: true },
            ]}
          />
        </div>
      </Row>
      {panel.get("flexWrap") === "wrap" && (
        <Row label="Lines" props={["alignContent"]}>
          <div className={ui.grow}>
            <PropToggle prop="alignContent" options={justifyOptions(!column)} />
          </div>
        </Row>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Grid */

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 12,
  label,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className={s.stepper} aria-label={label} data-disabled={disabled}>
      <button type="button" className={ui.iconButton} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}>
        <Minus size={12} />
      </button>
      <span>{value}</span>
      <button type="button" className={ui.iconButton} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>
        <Plus size={12} />
      </button>
    </div>
  );
}

function TrackList({ label, tracks, onChange }: { label: string; tracks: string[]; onChange: (t: string[]) => void }) {
  return (
    <div className={s.tracks}>
      {tracks.map((t, i) => (
        <div className={s.track} key={i}>
          <span className={s.trackIndex}>{i + 1}</span>
          <UnitInput
            value={t}
            onChange={(v) => onChange(tracks.map((x, j) => (j === i ? (v ?? "1fr") : x)))}
            units={["fr", "px", "%", "rem"]}
            keywords={["auto", "min-content", "max-content"]}
            defaultUnit="fr"
            min={0}
            aria-label={`${label} ${i + 1} size`}
          />
          <button
            type="button"
            className={ui.iconButton}
            disabled={tracks.length <= 1}
            onClick={() => onChange(tracks.filter((_, j) => j !== i))}
            aria-label={`Remove ${label} ${i + 1}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button type="button" className={ui.button} onClick={() => onChange([...tracks, "1fr"])}>
        <Plus size={12} /> Add {label}
      </button>
    </div>
  );
}

function GridControls() {
  const panel = usePanel();
  const pop = usePopover();
  const colsRaw = panel.get("gridTemplateColumns");
  const rowsRaw = panel.get("gridTemplateRows");
  const cols = parseTracks(colsRaw);
  const rows = parseTracks(rowsRaw);
  const visual = cols !== null && rows !== null;
  const colTracks = cols?.length ? cols : ["1fr"];
  const rowTracks = rows?.length ? rows : ["auto"];

  const setCols = (t: string[]) => panel.write("gridTemplateColumns", serializeTracks(t) || undefined);
  const setRows = (t: string[]) =>
    panel.write("gridTemplateRows", t.every((x) => x === "auto") ? (t.length > 1 ? serializeTracks(t) : undefined) : serializeTracks(t));
  const resize = (tracks: string[], n: number, fill: string) =>
    n > tracks.length ? [...tracks, ...Array(n - tracks.length).fill(fill)] : tracks.slice(0, n);

  const preview = (
    <div
      className={s.gridPreview}
      style={{
        gridTemplateColumns: colTracks.map((t) => (t.endsWith("fr") ? `minmax(0,${t})` : "minmax(0,1fr)")).join(" "),
      }}
      ref={(el) => {
        pop.anchorRef.current = el;
      }}
      role="button"
      tabIndex={0}
      title="Edit grid"
      onClick={pop.toggle}
    >
      {Array.from({ length: colTracks.length * rowTracks.length }, (_, i) => (
        <span key={i} className={s.gridCell} />
      ))}
    </div>
  );

  return (
    <>
      {visual ? (
        <>
          {preview}
          <div className={ui.grid2}>
            <Row label="Columns" props={["gridTemplateColumns"]} stacked>
              <div className={ui.grow}>
                <Stepper label="columns" value={colTracks.length} onChange={(n) => setCols(resize(colTracks, n, "1fr"))} />
              </div>
            </Row>
            <Row label="Rows" props={["gridTemplateRows"]} stacked>
              <div className={ui.grow}>
                <Stepper label="rows" value={rowTracks.length} onChange={(n) => setRows(resize(rowTracks, n, "auto"))} />
              </div>
              <button type="button" className={ui.iconButton} title="Edit grid" onClick={pop.toggle}>
                <Settings2 size={13} />
              </button>
            </Row>
          </div>
        </>
      ) : (
        <>
          <Row label="Columns" props={["gridTemplateColumns"]}>
            <TextInput value={panel.read("gridTemplateColumns").value} placeholder={colsRaw} onChange={(v) => panel.write("gridTemplateColumns", v)} />
          </Row>
          <Row label="Rows" props={["gridTemplateRows"]}>
            <TextInput value={panel.read("gridTemplateRows").value} placeholder={rowsRaw ?? "auto"} onChange={(v) => panel.write("gridTemplateRows", v)} />
          </Row>
          <button
            type="button"
            className={ui.button}
            onClick={() => panel.writeMany({ gridTemplateColumns: serializeTracks(["1fr", "1fr"]), gridTemplateRows: undefined })}
          >
            Switch to visual grid (2 columns)
          </button>
        </>
      )}
      <GapRow />
      <Row label="Align" props={["alignItems"]}>
        <div className={ui.grow}>
          <PropToggle prop="alignItems" options={GRID_ALIGN} />
        </div>
      </Row>
      <Row label="Justify" props={["justifyItems"]}>
        <div className={ui.grow}>
          <PropToggle prop="justifyItems" options={GRID_JUSTIFY} />
        </div>
      </Row>
      <Popover state={pop} title="Grid" width={260}>
        {preview}
        <div className={s.subhead}>Columns</div>
        <TrackList label="column" tracks={colTracks} onChange={setCols} />
        <div className={s.subhead}>Rows</div>
        <TrackList label="row" tracks={rowTracks} onChange={setRows} />
        <div className={s.subhead}>Auto flow</div>
        <PropToggle
          prop="gridAutoFlow"
          options={[
            { value: "row", label: "Rows", icon: <ArrowRight size={I} />, text: true },
            { value: "column", label: "Columns", icon: <ArrowDown size={I} />, text: true },
            { value: "row dense", label: "Dense" },
          ]}
        />
        <div className={ui.muted}>Tip: fr = share of the free space. Columns use minmax(0, …fr) so content can't overflow.</div>
      </Popover>
    </>
  );
}

export function LayoutSection() {
  const panel = usePanel();
  const display = panel.read("display");
  const effective = panel.get("display");
  const isFlex = /flex/.test(effective ?? "");
  const isGrid = /grid/.test(effective ?? "");
  const isMore = MORE_DISPLAY.some((o) => o.value === effective);
  const more = usePopover();

  return (
    <Section id="layout" title="Layout" icon={<LayoutDashboard size={14} />} props={PROPS} defaultOpen>
      <Row label="Display" props={["display"]}>
        <div className={ui.grow}>
          <ToggleGroup
            value={isMore ? undefined : display.value}
            inherited={isMore ? undefined : display.inherited}
            options={DISPLAY}
            readOnly={panel.readOnly}
            onChange={(v) => panel.write("display", v)}
          />
        </div>
        <button
          ref={(el) => {
            more.anchorRef.current = el;
          }}
          type="button"
          className={ui.iconButton}
          aria-pressed={isMore}
          aria-haspopup="listbox"
          aria-expanded={more.open}
          title={isMore ? `Display: ${effective}` : "More display types"}
          disabled={panel.readOnly}
          onClick={more.toggle}
        >
          <Ellipsis size={14} />
        </button>
        <DropdownMenu state={more} width={170} value={isMore ? effective : undefined} options={MORE_DISPLAY} onSelect={(v) => panel.write("display", v)} />
      </Row>
      {isMore && <div className={ui.muted}>Display: {effective}</div>}
      {isFlex && <FlexControls />}
      {isGrid && <GridControls />}
    </Section>
  );
}
