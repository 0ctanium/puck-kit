export type BreakpointIcon = "Smartphone" | "Tablet" | "Laptop" | "Monitor";

/**
 * A breakpoint is either the **base** (no `minWidth`/`maxWidth`: styles that apply everywhere),
 * a **smaller** screen (`maxWidth`: inherits from the base and the larger smaller-screens, down)
 * or a **larger** screen (`minWidth`: inherits from the base and the smaller larger-screens, up).
 * Desktop-first is a base plus `maxWidth` breakpoints, mobile-first a base plus `minWidth` ones;
 * both can be mixed (Webflow-style).
 */
export interface Breakpoint {
  /** Key used in the `styles` prop, e.g. `base`, `tablet`. Exactly one breakpoint is the base. */
  key: string;
  label: string;
  /** Larger screens: styles apply from this width up. */
  minWidth?: number;
  /** Smaller screens: styles apply up to this width. */
  maxWidth?: number;
  /** Width of the matching Puck viewport in the editor. */
  viewport: number;
  icon?: BreakpointIcon;
}

/** Desktop-first: Desktop is the base, Tablet and Mobile inherit from it, Wide goes up from it. */
export const defaultBreakpoints: Breakpoint[] = [
  { key: "wide", label: "Wide", minWidth: 1280, viewport: 1440, icon: "Monitor" },
  { key: "base", label: "Desktop", viewport: 1024, icon: "Laptop" },
  { key: "tablet", label: "Tablet", maxWidth: 1023, viewport: 768, icon: "Tablet" },
  { key: "mobile", label: "Mobile", maxWidth: 767, viewport: 375, icon: "Smartphone" },
];

/** Mobile-first alternative: Mobile is the base, larger screens inherit from it. */
export const mobileFirstBreakpoints: Breakpoint[] = [
  { key: "base", label: "Mobile", viewport: 375, icon: "Smartphone" },
  { key: "md", label: "Tablet", minWidth: 768, viewport: 768, icon: "Tablet" },
  { key: "lg", label: "Desktop", minWidth: 1024, viewport: 1024, icon: "Laptop" },
  { key: "xl", label: "Wide", minWidth: 1280, viewport: 1440, icon: "Monitor" },
];

export function isBaseBreakpoint(bp: Breakpoint): boolean {
  return !bp.minWidth && !bp.maxWidth;
}

export function baseBreakpoint(breakpoints: Breakpoint[]): Breakpoint {
  return breakpoints.find(isBaseBreakpoint) ?? breakpoints[0];
}

/** Position on the screen-width axis, for ordering (any value inside the breakpoint's range works). */
function rank(bp: Breakpoint): number {
  if (bp.minWidth) return bp.minWidth;
  if (bp.maxWidth) return -1e6 + bp.maxWidth;
  return 0;
}

/** Display order: widest first (Wide, Desktop, Tablet, Mobile). */
export function sortBreakpoints(breakpoints: Breakpoint[]): Breakpoint[] {
  return [...breakpoints].sort((a, b) => rank(b) - rank(a));
}

/**
 * Breakpoints a given one inherits from, base first and itself last: the order its styles
 * cascade in (and the order CSS must be emitted in, so the later ones win).
 */
export function cascadeOf(breakpoints: Breakpoint[], key: string): Breakpoint[] {
  const bp = breakpoints.find((b) => b.key === key);
  const base = baseBreakpoint(breakpoints);
  if (!bp || bp === base) return [base];
  if (bp.minWidth) {
    const up = breakpoints.filter((b) => b.minWidth && b.minWidth <= bp.minWidth!).sort((a, b) => a.minWidth! - b.minWidth!);
    return [base, ...up];
  }
  const down = breakpoints.filter((b) => b.maxWidth && b.maxWidth >= bp.maxWidth!).sort((a, b) => b.maxWidth! - a.maxWidth!);
  return [base, ...down];
}

/** Breakpoints that inherit what's set on `key` (itself included). */
export function coveredBy(breakpoints: Breakpoint[], key: string): Breakpoint[] {
  return breakpoints.filter((b) => cascadeOf(breakpoints, b.key).some((c) => c.key === key));
}

/**
 * CSS variables positioning a "coverage" bar under breakpoint buttons laid out in
 * `sortBreakpoints` order: it spans the active breakpoint and every one inheriting from it.
 */
export function coverageVars(sorted: Breakpoint[], key: string): Record<string, number> {
  const covered = new Set(coveredBy(sorted, key).map((b) => b.key));
  const indexes = sorted.flatMap((b, i) => (covered.has(b.key) ? [i] : []));
  return {
    "--pk-bp-start": Math.min(...indexes),
    "--pk-bp-end": Math.max(...indexes) + 1,
    "--pk-bp-count": sorted.length,
  };
}

/** All breakpoints in CSS emission order: base, larger screens up, smaller screens down. */
export function emissionOrder(breakpoints: Breakpoint[]): Breakpoint[] {
  const base = baseBreakpoint(breakpoints);
  const up = breakpoints.filter((b) => b.minWidth).sort((a, b) => a.minWidth! - b.minWidth!);
  const down = breakpoints.filter((b) => b.maxWidth).sort((a, b) => b.maxWidth! - a.maxWidth!);
  return [base, ...up, ...down];
}

/** Media query of a breakpoint (`null` for the base). */
export function mediaQuery(bp: Breakpoint): string | null {
  if (bp.minWidth) return `(min-width:${bp.minWidth}px)`;
  if (bp.maxWidth) return `(max-width:${bp.maxWidth}px)`;
  return null;
}

/** Short description of a breakpoint's range, e.g. "≤ 767px", "≥ 1280px", "base". */
export function rangeLabel(bp: Breakpoint): string {
  if (bp.minWidth) return `≥ ${bp.minWidth}px`;
  if (bp.maxWidth) return `≤ ${bp.maxWidth}px`;
  return "base";
}

/** Breakpoint active for a given viewport width. */
export function breakpointForWidth(breakpoints: Breakpoint[], width: number | "100%"): Breakpoint {
  const sorted = sortBreakpoints(breakpoints);
  if (width === "100%") return sorted[0];
  const smaller = breakpoints.filter((b) => b.maxWidth && width <= b.maxWidth).sort((a, b) => a.maxWidth! - b.maxWidth!);
  if (smaller.length) return smaller[0];
  const larger = breakpoints.filter((b) => b.minWidth && width >= b.minWidth).sort((a, b) => b.minWidth! - a.minWidth!);
  if (larger.length) return larger[0];
  return baseBreakpoint(breakpoints);
}

/** Throws if the breakpoints can't form a cascade. */
export function validateBreakpoints(breakpoints: Breakpoint[]): void {
  const bases = breakpoints.filter(isBaseBreakpoint);
  if (bases.length !== 1) {
    throw new Error("puck-kit: exactly one breakpoint must be the base (no minWidth / maxWidth).");
  }
  const maxSmaller = Math.max(0, ...breakpoints.map((b) => b.maxWidth ?? 0));
  const minLarger = Math.min(Infinity, ...breakpoints.map((b) => b.minWidth || Infinity));
  if (maxSmaller >= minLarger) {
    throw new Error("puck-kit: every maxWidth breakpoint must be below every minWidth breakpoint.");
  }
  const keys = new Set(breakpoints.map((b) => b.key));
  if (keys.size !== breakpoints.length) throw new Error("puck-kit: breakpoint keys must be unique.");
}

export function toViewports(breakpoints: Breakpoint[]) {
  return sortBreakpoints(breakpoints).map((bp) => ({
    width: bp.viewport,
    height: "auto" as const,
    label: bp.label,
    // Puck only knows these three icons.
    icon: bp.icon === "Laptop" || !bp.icon ? ("Monitor" as const) : bp.icon,
  }));
}
