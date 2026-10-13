import { defaultBreakpoints, sortBreakpoints, type Breakpoint } from "../breakpoints";
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

/**
 * Compile per-breakpoint styles to CSS, mobile-first:
 * `.sel{...}@media (min-width:768px){.sel{...}}`
 */
export function compileStyles(
  selector: string,
  styles: Styles | null | undefined,
  breakpoints: Breakpoint[] = defaultBreakpoints,
): string {
  if (!styles) return "";
  let css = "";
  for (const bp of sortBreakpoints(breakpoints)) {
    const body = declToCss(styles[bp.key]);
    if (!body) continue;
    css += bp.minWidth > 0
      ? `@media (min-width:${bp.minWidth}px){${selector}{${body}}}`
      : `${selector}{${body}}`;
  }
  return css;
}

/** Value for a property at a breakpoint, following the mobile-first cascade. */
export function resolveValue(
  styles: Styles | null | undefined,
  prop: StyleProp,
  bpKey: string,
  breakpoints: Breakpoint[] = defaultBreakpoints,
): { value: string | undefined; from: string | undefined } {
  let found: { value: string | undefined; from: string | undefined } = { value: undefined, from: undefined };
  for (const bp of sortBreakpoints(breakpoints)) {
    const v = styles?.[bp.key]?.[prop];
    if (v != null && v !== "") found = { value: v, from: bp.key };
    if (bp.key === bpKey) break;
  }
  return found;
}
