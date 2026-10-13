export type BreakpointIcon = "Smartphone" | "Tablet" | "Monitor";

export interface Breakpoint {
  /** Key used in the `styles` prop, e.g. `base`, `md`. The smallest breakpoint must have `minWidth: 0`. */
  key: string;
  label: string;
  /** Mobile-first: styles apply from this width up. */
  minWidth: number;
  /** Width of the matching Puck viewport in the editor. */
  viewport: number;
  icon?: BreakpointIcon;
}

export const defaultBreakpoints: Breakpoint[] = [
  { key: "base", label: "Mobile", minWidth: 0, viewport: 375, icon: "Smartphone" },
  { key: "md", label: "Tablet", minWidth: 768, viewport: 768, icon: "Tablet" },
  { key: "lg", label: "Desktop", minWidth: 1024, viewport: 1024, icon: "Monitor" },
  { key: "xl", label: "Wide", minWidth: 1280, viewport: 1440, icon: "Monitor" },
];

export function sortBreakpoints(breakpoints: Breakpoint[]): Breakpoint[] {
  return [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);
}

/** Breakpoint active for a given viewport width (largest `minWidth` that fits). */
export function breakpointForWidth(
  breakpoints: Breakpoint[],
  width: number | "100%",
): Breakpoint {
  const sorted = sortBreakpoints(breakpoints);
  if (width === "100%") return sorted[sorted.length - 1];
  let match = sorted[0];
  for (const bp of sorted) if (width >= bp.minWidth) match = bp;
  return match;
}

export function toViewports(breakpoints: Breakpoint[]) {
  return sortBreakpoints(breakpoints).map((bp) => ({
    width: bp.viewport,
    height: "auto" as const,
    label: bp.label,
    icon: bp.icon ?? "Monitor",
  }));
}
