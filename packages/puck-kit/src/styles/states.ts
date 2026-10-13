/** A pseudo-class state editable in the style panel. Stored as `<breakpoint>:<key>` in `Styles`. */
export interface StyleState {
  key: string;
  label: string;
  /** Appended to the element selector, e.g. `:hover`. */
  selector: string;
}

/**
 * Default states, in cascade order (later wins at equal specificity): link-visited-hover-focus-
 * active order, so Pressed overrides Hover. Structural states come last.
 */
export const defaultStates: StyleState[] = [
  { key: "hover", label: "Hover", selector: ":hover" },
  { key: "focus-visible", label: "Keyboard focus", selector: ":focus-visible" },
  { key: "focus", label: "Focused", selector: ":focus" },
  { key: "focus-within", label: "Focus within", selector: ":focus-within" },
  { key: "active", label: "Pressed", selector: ":active" },
  { key: "first-child", label: "First child", selector: ":first-child" },
  { key: "last-child", label: "Last child", selector: ":last-child" },
  { key: "odd", label: "Odd children", selector: ":nth-child(odd)" },
  { key: "even", label: "Even children", selector: ":nth-child(even)" },
];

/** Key of a breakpoint (+ state) in a `Styles` object: `md` or `md:hover`. */
export function styleKey(breakpoint: string, state?: string): string {
  return state ? `${breakpoint}:${state}` : breakpoint;
}

/** Editor-only attribute that forces a state's styles on the canvas while it's edited. */
export const PREVIEW_STATE_ATTR = "data-pk-state";
