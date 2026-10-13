"use client";

import { createUsePuck } from "@puckeditor/core";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from "react";
import { breakpointForWidth, coverageVars, defaultBreakpoints, rangeLabel, sortBreakpoints, type Breakpoint } from "../breakpoints";
import { cx } from "../components/shared";
import { resolveValue, styleClass } from "../styles/compile";
import { defaultStates, PREVIEW_STATE_ATTR, styleKey, type StyleState } from "../styles/states";
import type { Tokens } from "../styles/tokens";
import type { StyleDecl, StyleProp, Styles } from "../styles/types";
import { PanelProvider, type PanelApi, type PropRead } from "./context";
import { BackgroundSection } from "./sections/BackgroundSection";
import { BorderSection } from "./sections/BorderSection";
import { FlexChildSection, GridChildSection } from "./sections/ChildSections";
import { EffectsSection } from "./sections/EffectsSection";
import { LayoutSection } from "./sections/LayoutSection";
import { PositionSection } from "./sections/PositionSection";
import { SizeSection } from "./sections/SizeSection";
import { SpacingSection } from "./sections/SpacingSection";
import { TypographySection } from "./sections/TypographySection";
import { StateBar } from "./StateBar";
import css from "./StylePanel.module.css";
import ui from "./ui/ui.module.css";

const usePuck = createUsePuck();

/** Section ids accepted by `styleField({ sections })`, in display order. */
export const STYLE_SECTIONS: { id: string; Component: ComponentType; when?: (panel: PanelApi) => boolean }[] = [
  { id: "layout", Component: LayoutSection },
  { id: "flexChild", Component: FlexChildSection, when: (p) => /flex/.test(p.parent?.display ?? "") },
  { id: "gridChild", Component: GridChildSection, when: (p) => /grid/.test(p.parent?.display ?? "") },
  { id: "spacing", Component: SpacingSection },
  { id: "size", Component: SizeSection },
  { id: "position", Component: PositionSection },
  { id: "typography", Component: TypographySection },
  { id: "background", Component: BackgroundSection },
  { id: "border", Component: BorderSection },
  { id: "effects", Component: EffectsSection },
];

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
};

export interface StylePanelProps {
  value: Styles | null | undefined;
  onChange: (value: Styles) => void;
  readOnly?: boolean;
  breakpoints?: Breakpoint[];
  /** Restrict which sections are shown (ids from STYLE_SECTIONS). */
  sections?: string[];
  /** Pseudo-class states offered in the state bar; `false` hides it (e.g. page styles). */
  states?: StyleState[] | false;
}

// The edited state is shared across elements while editing, like Webflow: you can hover-style
// several buttons in a row.
let lastStateKey: string | undefined;

/**
 * While a state is edited, force it on the selected element in Puck's canvas iframe
 * (`[data-pk-state]` is matched by the editor-only CSS, see `compileStyles({ preview })`).
 */
function usePreviewState(state: string | undefined, deps: unknown) {
  const id = usePuck((s) => s.selectedItem?.props?.id as string | undefined);
  useEffect(() => {
    if (!state || !id) return;
    const cls = styleClass(id);
    const targets: Element[] = [];
    for (const frame of document.querySelectorAll("iframe")) {
      try {
        frame.contentDocument?.querySelectorAll(`.${cls}`).forEach((el) => targets.push(el));
      } catch {
        /* cross-origin frame */
      }
    }
    targets.forEach((el) => el.setAttribute(PREVIEW_STATE_ATTR, state));
    return () => targets.forEach((el) => el.removeAttribute(PREVIEW_STATE_ATTR));
  }, [state, id, deps]);
}

function applyValues(styles: Styles, bp: string, values: Partial<Record<StyleProp, string | undefined>>): Styles {
  const decl: StyleDecl = { ...(styles[bp] ?? {}) };
  for (const [prop, value] of Object.entries(values) as [StyleProp, string | undefined][]) {
    if (value === undefined || value === "") delete decl[prop];
    else decl[prop] = value;
  }
  const next: Styles = { ...styles };
  if (Object.keys(decl).length) next[bp] = decl;
  else delete next[bp];
  return next;
}

/**
 * Styles of the selected element's parent, when the element sits in the parent's main `content`
 * slot (the slot rendered *as* the parent element). Children of other slots (e.g. a Columns
 * column) live in a plain wrapper, so the parent's display doesn't apply to them.
 */
function useParentStyles(): Styles | null {
  return usePuck((s) => {
    const id = s.selectedItem?.props?.id as string | undefined;
    if (!id) return null;
    const zone = s.getSelectorForId(id)?.zone;
    if (!zone || zone.slice(zone.indexOf(":") + 1) !== "content") return null;
    return (s.getParentById(id)?.props?.styles as Styles | undefined) ?? null;
  });
}

/** Breakpoint switcher synced with Puck's viewport. Usable on its own (e.g. in a plugin or header). */
export function useActiveBreakpoint(breakpoints: Breakpoint[] = defaultBreakpoints) {
  const viewports = usePuck((s) => s.appState.ui.viewports);
  const dispatch = usePuck((s) => s.dispatch);
  const active = breakpointForWidth(breakpoints, viewports.current.width);
  const setActive = useCallback(
    (bp: Breakpoint) =>
      dispatch({
        type: "setUi",
        ui: { viewports: { ...viewports, current: { width: bp.viewport, height: "auto" } } },
      }),
    [dispatch, viewports],
  );
  return [active, setActive] as const;
}

export function StylePanel({
  value,
  onChange,
  readOnly = false,
  breakpoints = defaultBreakpoints,
  sections,
  states = defaultStates,
}: StylePanelProps) {
  const styles: Styles = value ?? {};
  const bps = useMemo(() => sortBreakpoints(breakpoints), [breakpoints]);
  const [active, setActive] = useActiveBreakpoint(bps);
  const [stateKey, setStateKey] = useState(lastStateKey);
  const activeState = states ? states.find((s) => s.key === stateKey) : undefined;
  const key = styleKey(active.key, activeState?.key);
  const selectState = (next: string | undefined) => {
    lastStateKey = next;
    setStateKey(next);
  };
  usePreviewState(activeState?.key, value);
  const tokens = (usePuck((s) => s.appState.data.root?.props?.tokens) ?? {}) as Tokens;
  const parentStyles = useParentStyles();
  const parent = useMemo(
    () =>
      parentStyles
        ? {
            display: resolveValue(parentStyles, "display", active.key, bps).value,
            flexDirection: resolveValue(parentStyles, "flexDirection", active.key, bps).value,
          }
        : null,
    [parentStyles, active.key, bps],
  );

  const api: PanelApi = {
    styles,
    breakpoints: bps,
    active,
    activeState,
    key,
    tokens,
    readOnly,
    parent,
    read: (prop): PropRead => {
      const own = styles[key]?.[prop];
      const resolved = resolveValue(styles, prop, active.key, bps, activeState?.key);
      const inherited = own === undefined ? resolved.value : undefined;
      const bpLabel = bps.find((b) => b.key === resolved.from)?.label;
      const stateLabel = states ? states.find((s) => s.key === resolved.fromState)?.label : undefined;
      return {
        value: own,
        inherited,
        from: activeState && bpLabel ? `${bpLabel} · ${stateLabel ?? "None"}` : bpLabel,
        state: own !== undefined ? "set" : inherited !== undefined ? "inherited" : "empty",
      };
    },
    get: (prop) => resolveValue(styles, prop, active.key, bps, activeState?.key).value,
    write: (prop, v) => onChange(applyValues(styles, key, { [prop]: v })),
    writeMany: (values) => onChange(applyValues(styles, key, values)),
  };

  // "child" (older option name) means both child sections.
  const wanted = sections?.flatMap((id) => (id === "child" ? ["flexChild", "gridChild"] : [id]));
  const visible = STYLE_SECTIONS.filter((s) => (!wanted || wanted.includes(s.id)) && (!s.when || s.when(api)));

  return (
    <PanelProvider value={api}>
      <div className={cx(ui.theme, css.root)} data-pk-panel="">
        <div className={css.bar}>
          <div
            className={css.breakpoints}
            role="group"
            aria-label="Breakpoint"
            style={coverageVars(bps, active.key) as CSSProperties}
          >
            {bps.map((bp) => {
              const Icon = ICONS[bp.icon ?? "Monitor"] ?? Monitor;
              const count = Object.keys(styles[styleKey(bp.key, activeState?.key)] ?? {}).length;
              return (
                <button
                  key={bp.key}
                  type="button"
                  className={css.breakpoint}
                  aria-pressed={bp.key === active.key}
                  aria-label={bp.label}
                  title={`${bp.label} — ${rangeLabel(bp) === "base" ? "base, inherited by all sizes" : rangeLabel(bp)}${count ? ` · ${count} styles` : ""}`}
                  onClick={() => setActive(bp)}
                >
                  <Icon size={15} />
                  {count > 0 && <span className={css.dot} />}
                </button>
              );
            })}
            {/* What's set here also applies to the breakpoints that inherit from this one. */}
            <span className={css.coverage} aria-hidden />
          </div>
          {states && states.length > 0 && (
            <StateBar states={states} styles={styles} breakpoint={active} value={activeState?.key} onChange={selectState} />
          )}
          <div className={css.hint}>
            <span>
              <strong>{active.label}</strong> {rangeLabel(active) === "base" ? "· base" : rangeLabel(active)}
              {activeState && (
                <>
                  {" · "}
                  <strong className={css.hintState}>{activeState.label}</strong>
                </>
              )}
            </span>
            <span className={css.legend}>
              <span>
                <i className={css.legendSet} />
                set
              </span>
              <span>
                <i className={css.legendInherited} />
                inherited
              </span>
            </span>
          </div>
        </div>
        <div className={css.sections}>
          {visible.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        </div>
      </div>
    </PanelProvider>
  );
}

/** Render function for Puck custom fields. Breakpoints come from `field.metadata.breakpoints`. */
export function StyleFieldRender(props: {
  field: { metadata?: { breakpoints?: Breakpoint[]; sections?: string[]; states?: StyleState[] | false } };
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
      states={props.field.metadata?.states}
    />
  );
}
