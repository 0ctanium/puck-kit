import { defaultBreakpoints, type Breakpoint } from "../breakpoints";
import { baseCss } from "./base";
import { compileStyles, styleClass } from "./compile";
import { tokensToCss, type Tokens } from "./tokens";
import type { Styles } from "./types";

type Node = { type?: unknown; props?: Record<string, unknown> };

function walk(value: unknown, visit: (node: Node) => void) {
  if (Array.isArray(value)) {
    for (const v of value) walk(v, visit);
    return;
  }
  if (!value || typeof value !== "object") return;
  const node = value as Node;
  if (typeof node.type === "string" && node.props && typeof node.props === "object") visit(node);
  for (const v of Object.values(node.props ?? node)) walk(v, visit);
}

/**
 * The whole stylesheet of a page (base + tokens + every element), e.g. to serve it as a
 * cached .css file or inline it in <head> for static exports.
 */
export function getPageCss(
  data: { root?: { props?: Record<string, unknown> }; content?: unknown; zones?: unknown },
  breakpoints: Breakpoint[] = defaultBreakpoints,
): string {
  const parts = [baseCss, tokensToCss(data.root?.props?.tokens as Tokens | undefined)];
  const seen = new Set<string>();
  walk([data.content, data.zones], (node) => {
    const id = node.props?.id;
    if (typeof id !== "string" || seen.has(id)) return;
    seen.add(id);
    parts.push(compileStyles(`.${styleClass(id)}`, node.props?.styles as Styles | undefined, breakpoints));
  });
  return parts.filter(Boolean).join("\n");
}
