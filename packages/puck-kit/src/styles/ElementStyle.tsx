import { defaultBreakpoints, type Breakpoint } from "../breakpoints";
import { compileStyles, styleClass } from "./compile";
import { hash } from "./hash";
import type { Styles } from "./types";

export interface ElementStyleProps {
  /** The Puck component id (`props.id`). */
  id: string;
  styles: Styles | null | undefined;
  /** Pass `puck.isEditing`. */
  editing?: boolean;
  breakpoints?: Breakpoint[];
}

/**
 * Emits the CSS of one element. In the editor it is a plain <style> (rendered inside Puck's
 * iframe, so media queries follow the viewport switcher). On public pages it uses React 19
 * stylesheet hoisting: moved to <head>, deduplicated, streamed with SSR.
 * Server-safe: no hooks.
 */
export function ElementStyle({ id, styles, editing, breakpoints = defaultBreakpoints }: ElementStyleProps) {
  const cls = `.${styleClass(id)}`;
  // In the editor, out-rank Puck's drop-zone rules and the slot reset (see `editorCss`).
  const css = compileStyles(editing ? cls + cls + cls : cls, styles, breakpoints, { preview: editing });
  if (!css) return null;
  if (editing) return <style>{css}</style>;
  return (
    <style href={`${styleClass(id)}-${hash(css)}`} precedence="puck-kit">
      {css}
    </style>
  );
}
