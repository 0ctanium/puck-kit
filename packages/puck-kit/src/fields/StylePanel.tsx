"use client";

import { createUsePuck } from "@puckeditor/core";
import { useCallback, useMemo } from "react";
import {
  breakpointForWidth,
  defaultBreakpoints,
  sortBreakpoints,
  type Breakpoint,
} from "../breakpoints";
import { resolveValue } from "../styles/compile";
import type { Tokens } from "../styles/tokens";
import type { StyleDecl, StyleProp, Styles } from "../styles/types";
import { SizeTokenList, StyleControl, TextInput } from "./controls";
import css from "./panel.module.css";
import { SECTIONS, type PropSpec, type Section } from "./schema";
import { XIcon } from "lucide-react";

const usePuck = createUsePuck();

export interface StylePanelProps {
  value: Styles | null | undefined;
  onChange: (value: Styles) => void;
  readOnly?: boolean;
  breakpoints?: Breakpoint[];
  /** Restrict which sections are shown (ids from SECTIONS). */
  sections?: string[];
}

function setProp(
  styles: Styles,
  bp: string,
  prop: StyleProp,
  value: string | undefined,
): Styles {
  const decl: StyleDecl = { ...(styles[bp] ?? {}) };
  if (value === undefined || value === "") delete decl[prop];
  else decl[prop] = value;
  const next: Styles = { ...styles };
  if (Object.keys(decl).length) next[bp] = decl;
  else delete next[bp];
  return next;
}

/** Breakpoint switcher synced with Puck's viewport. Usable on its own (e.g. in a plugin or header). */
export function useActiveBreakpoint(
  breakpoints: Breakpoint[] = defaultBreakpoints,
) {
  const viewports = usePuck((s) => s.appState.ui.viewports);
  const dispatch = usePuck((s) => s.dispatch);
  const active = breakpointForWidth(breakpoints, viewports.current.width);
  const setActive = useCallback(
    (bp: Breakpoint) =>
      dispatch({
        type: "setUi",
        ui: {
          viewports: {
            ...viewports,
            current: { width: bp.viewport, height: "auto" },
          },
        },
      }),
    [dispatch, viewports],
  );
  return [active, setActive] as const;
}

export function StylePanel({
  value,
  onChange,
  readOnly,
  breakpoints = defaultBreakpoints,
  sections,
}: StylePanelProps) {
  const styles: Styles = value ?? {};
  const bps = useMemo(() => sortBreakpoints(breakpoints), [breakpoints]);
  const [active, setActive] = useActiveBreakpoint(bps);
  const tokens = (usePuck((s) => s.appState.data.root?.props?.tokens) ??
    {}) as Tokens;

  const read = (prop: StyleProp) => {
    const own = styles[active.key]?.[prop];
    const resolved = resolveValue(styles, prop, active.key, bps);
    return {
      value: own,
      inherited: own === undefined ? resolved.value : undefined,
      from: resolved.from,
    };
  };
  const get = (prop: StyleProp) =>
    resolveValue(styles, prop, active.key, bps).value;
  const write = (prop: StyleProp, v: string | undefined) =>
    onChange(setProp(styles, active.key, prop, v));

  const stateOf = (prop: StyleProp) => {
    const r = read(prop);
    return r.value !== undefined
      ? "set"
      : r.inherited !== undefined
        ? "inherited"
        : "empty";
  };

  const renderRow = (spec: PropSpec) => {
    if (spec.when && !spec.when(get)) return null;
    const r = read(spec.prop);
    const state = stateOf(spec.prop);
    const fromLabel = bps.find((b) => b.key === r.from)?.label;
    return (
      <div className={css.row} key={spec.prop}>
        <span
          className={css.label}
          data-state={state}
          title={
            state === "inherited" ? `Inherited from ${fromLabel}` : spec.prop
          }
        >
          {spec.label}
        </span>
        <div className={css.control}>
          <StyleControl
            control={spec.control}
            value={r.value}
            inherited={r.inherited}
            onChange={(v) => write(spec.prop, v)}
            tokens={tokens}
            readOnly={readOnly}
          />
        </div>
        {r.value !== undefined && !readOnly ? (
          <button
            type="button"
            className={css.clear}
            title="Reset"
            onClick={() => write(spec.prop, undefined)}
          >
            <XIcon />
          </button>
        ) : (
          <span className={css.noClear} />
        )}
      </div>
    );
  };

  const side = (
    prop: StyleProp,
    position: "top" | "right" | "bottom" | "left",
  ) => {
    const r = read(prop);
    return (
      <TextInput
        className={`${css.side} ${css[position]}`}
        aria-label={prop}
        title={prop}
        data-state={stateOf(prop)}
        value={r.value}
        placeholder={r.inherited ?? "0"}
        onChange={(v) => write(prop, v)}
        readOnly={readOnly}
        list={tokens.sizes?.length ? "pkf-size-tokens" : undefined}
      />
    );
  };

  const renderSpacing = () => (
    <div className={css.box}>
      <span className={css.boxTag}>Margin</span>
      {side("marginTop", "top")}
      {side("marginRight", "right")}
      {side("marginBottom", "bottom")}
      {side("marginLeft", "left")}
      <div className={css.boxInner}>
        <span className={css.boxTag}>Padding</span>
        {side("paddingTop", "top")}
        {side("paddingRight", "right")}
        {side("paddingBottom", "bottom")}
        {side("paddingLeft", "left")}
        <div className={css.boxCore} />
      </div>
    </div>
  );

  const countSet = (section: Section) => {
    const decl = styles[active.key] ?? {};
    const props: StyleProp[] =
      section.special === "spacing"
        ? [
            "marginTop",
            "marginRight",
            "marginBottom",
            "marginLeft",
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
          ]
        : (section.props ?? []).map((p) => p.prop);
    return props.filter((p) => decl[p] !== undefined).length;
  };

  const visibleSections = sections
    ? SECTIONS.filter((s) => sections.includes(s.id))
    : SECTIONS;

  return (
    <div className={css.root}>
      <SizeTokenList tokens={tokens} />
      <div className={css.breakpoints} role="group" aria-label="Breakpoint">
        {bps.map((bp) => (
          <button
            key={bp.key}
            type="button"
            className={css.breakpoint}
            aria-pressed={bp.key === active.key}
            title={
              bp.minWidth
                ? `${bp.label} — ${bp.minWidth}px and up`
                : `${bp.label} — all sizes`
            }
            onClick={() => setActive(bp)}
          >
            {bp.label}
            {styles[bp.key] && Object.keys(styles[bp.key]!).length > 0 && (
              <span className={css.breakpointDot} />
            )}
          </button>
        ))}
      </div>
      <div className={css.hint}>
        {active.minWidth === 0
          ? "Editing base styles (all screen sizes)."
          : `Editing ${active.label} — applies from ${active.minWidth}px up.`}{" "}
        <span className={css.hintSet}>Blue</span> = set here,{" "}
        <span className={css.hintInherited}>orange</span> = inherited.
      </div>
      {visibleSections.map((section) => {
        const count = countSet(section);
        return (
          <details
            key={section.id}
            className={css.section}
            open={section.open || count > 0}
          >
            <summary>
              {section.title}
              {count > 0 && <span className={css.count}>{count}</span>}
            </summary>
            <div className={css.body}>
              {section.special === "spacing"
                ? renderSpacing()
                : section.props?.map(renderRow)}
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** Render function for Puck custom fields. Breakpoints come from `field.metadata.breakpoints`. */
export function StyleFieldRender(props: {
  field: { metadata?: { breakpoints?: Breakpoint[]; sections?: string[] } };
  value: Styles;
  onChange: (value: Styles) => void;
  readOnly?: boolean;
}) {
  return (
    <StylePanel
      value={props.value}
      onChange={props.onChange}
      readOnly={props.readOnly}
      breakpoints={props.field.metadata?.breakpoints}
      sections={props.field.metadata?.sections}
    />
  );
}
