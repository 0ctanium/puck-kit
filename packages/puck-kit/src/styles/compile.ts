import { cascadeOf, defaultBreakpoints, emissionOrder, mediaQuery, type Breakpoint } from "../breakpoints";
import { defaultStates, PREVIEW_STATE_ATTR, styleKey, type StyleState } from "./states";
import { STYLE_PROPS, UNITLESS_PROPS, type StyleDecl, type StyleProp, type Styles } from "./types";

/** Class name an element gets for its styles. Puck ids are stable, so this is SSR-safe. */
export function styleClass(id: string): string {
  return `pk-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function kebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Drop anything that could break out of a declaration or the <style> tag. */
export function sanitizeValue(prop: StyleProp, raw: string): string {
  const value = raw.replace(/[;{}<>]/g, "").trim();
  if (/^-?\d*\.?\d+$/.test(value) && value !== "0" && !UNITLESS_PROPS.has(prop)) {
    return `${value}px`;
  }
  return value;
}

export function declToCss(decl: StyleDecl | undefined): string {
  if (!decl) return "";
  const parts: string[] = [];
  // Emit in STYLE_PROPS order (not insertion order) so shorthands never override longhands.
  for (const prop of STYLE_PROPS) {
    const raw = decl[prop];
    if (raw == null || String(raw).trim() === "") continue;
    const value = sanitizeValue(prop, String(raw));
    if (value) parts.push(`${kebab(prop)}:${value}`);
  }
  return parts.join(";");
}

export interface CompileOptions {
  /** Pseudo-class states to emit (default: `defaultStates`). */
  states?: StyleState[];
  /**
   * Editor preview: each state rule also matches `[data-pk-state="<key>"]`, so the canvas can
   * show a state while it's being edited (CSS can't force `:hover`).
   */
  preview?: boolean;
}

/**
 * Compile per-breakpoint (and per-state) styles to CSS: base first, then larger screens
 * (min-width, ascending), then smaller screens (max-width, descending), so each breakpoint
 * overrides the ones it inherits from:
 * `.sel{...}.sel:hover{...}@media (max-width:1023px){.sel{...}}@media (max-width:767px){...}`.
 * State rules are more specific than plain ones, so `base:hover` keeps applying on other
 * breakpoints unless overridden there. `selector` can be any selector (element or, later, class).
 */
export function compileStyles(
  selector: string,
  styles: Styles | null | undefined,
  breakpoints: Breakpoint[] = defaultBreakpoints,
  { states = defaultStates, preview = false }: CompileOptions = {},
): string {
  if (!styles) return "";
  let css = "";
  for (const bp of emissionOrder(breakpoints)) {
    let block = "";
    const plain = declToCss(styles[bp.key]);
    if (plain) block += `${selector}{${plain}}`;
    for (const state of states) {
      const body = declToCss(styles[styleKey(bp.key, state.key)]);
      if (!body) continue;
      const sel = `${selector}${state.selector}`;
      block += preview ? `${sel},${selector}[${PREVIEW_STATE_ATTR}="${state.key}"]{${body}}` : `${sel}{${body}}`;
    }
    if (!block) continue;
    const query = mediaQuery(bp);
    css += query ? `@media ${query}{${block}}` : block;
  }
  return css;
}

export interface ResolvedValue {
  value: string | undefined;
  /** Breakpoint key the value comes from. */
  from: string | undefined;
  /** State the value comes from (undefined = the plain, stateless value). */
  fromState?: string;
}

/**
 * Value for a property at a breakpoint (and optional state), following the CSS cascade:
 * the latest state value along the breakpoint's cascade wins (state rules are more specific),
 * otherwise the plain cascaded value.
 */
export function resolveValue(
  styles: Styles | null | undefined,
  prop: StyleProp,
  bpKey: string,
  breakpoints: Breakpoint[] = defaultBreakpoints,
  state?: string,
): ResolvedValue {
  const chain = cascadeOf(breakpoints, bpKey);
  const scan = (stateKey?: string): ResolvedValue => {
    let found: ResolvedValue = { value: undefined, from: undefined };
    for (const bp of chain) {
      const v = styles?.[styleKey(bp.key, stateKey)]?.[prop];
      if (v != null && v !== "") found = { value: v, from: bp.key, fromState: stateKey };
    }
    return found;
  };
  if (state) {
    const own = scan(state);
    if (own.value !== undefined) return own;
  }
  return scan();
}
