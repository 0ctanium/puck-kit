"use client";

import { createUsePuck } from "@puckeditor/core";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { useCallback, useMemo, type ComponentType } from "react";
import { breakpointForWidth, defaultBreakpoints, sortBreakpoints, type Breakpoint } from "../breakpoints";
import { cx } from "../components/shared";
import { resolveValue } from "../styles/compile";
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

export function StylePanel({ value, onChange, readOnly = false, breakpoints = defaultBreakpoints, sections }: StylePanelProps) {
  const styles: Styles = value ?? {};
  const bps = useMemo(() => sortBreakpoints(breakpoints), [breakpoints]);
  const [active, setActive] = useActiveBreakpoint(bps);
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
    tokens,
    readOnly,
    parent,
    read: (prop): PropRead => {
      const own = styles[active.key]?.[prop];
      const resolved = resolveValue(styles, prop, active.key, bps);
      const inherited = own === undefined ? resolved.value : undefined;
      return {
        value: own,
        inherited,
        from: bps.find((b) => b.key === resolved.from)?.label,
        state: own !== undefined ? "set" : inherited !== undefined ? "inherited" : "empty",
      };
    },
    get: (prop) => resolveValue(styles, prop, active.key, bps).value,
    write: (prop, v) => onChange(applyValues(styles, active.key, { [prop]: v })),
    writeMany: (values) => onChange(applyValues(styles, active.key, values)),
  };

  // "child" (older option name) means both child sections.
  const wanted = sections?.flatMap((id) => (id === "child" ? ["flexChild", "gridChild"] : [id]));
  const visible = STYLE_SECTIONS.filter((s) => (!wanted || wanted.includes(s.id)) && (!s.when || s.when(api)));

  return (
    <PanelProvider value={api}>
      <div className={cx(ui.theme, css.root)} data-pk-panel="">
        <div className={css.bar}>
          <div className={css.breakpoints} role="group" aria-label="Breakpoint">
            {bps.map((bp) => {
              const Icon = ICONS[bp.icon ?? "Monitor"] ?? Monitor;
              const count = Object.keys(styles[bp.key] ?? {}).length;
              return (
                <button
                  key={bp.key}
                  type="button"
                  className={css.breakpoint}
                  aria-pressed={bp.key === active.key}
                  aria-label={bp.label}
                  title={`${bp.label} — ${bp.minWidth ? `${bp.minWidth}px and up` : "all sizes (base)"}${count ? ` · ${count} styles` : ""}`}
                  onClick={() => setActive(bp)}
                >
                  <Icon size={15} />
                  {count > 0 && <span className={css.dot} />}
                </button>
              );
            })}
          </div>
          <div className={css.hint}>
            <span>
              <strong>{active.label}</strong> {active.minWidth ? `≥ ${active.minWidth}px` : "· base"}
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
