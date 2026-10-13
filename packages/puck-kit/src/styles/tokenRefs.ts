/** Any Puck-like page data. */
export interface PageLike {
  content?: unknown;
  zones?: unknown;
  root?: unknown;
}

/** Deep-map every string in a value (plain objects and arrays only). */
function mapStrings(value: unknown, fn: (s: string) => string, skipKey?: string): unknown {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => {
      const next = mapStrings(v, fn);
      if (next !== v) changed = true;
      return next;
    });
    return changed ? out : value;
  }
  if (value && typeof value === "object") {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const next = k === skipKey ? v : mapStrings(v, fn);
      if (next !== v) changed = true;
      out[k] = next;
    }
    return changed ? out : value;
  }
  return value;
}

/** How many times `var(<cssVar>)` is used in the page (elements + root styles, not the tokens). */
export function countTokenUsage(data: PageLike, cssVar: string): number {
  const needle = `var(${cssVar})`;
  let count = 0;
  const fn = (s: string) => {
    for (let i = s.indexOf(needle); i !== -1; i = s.indexOf(needle, i + needle.length)) count++;
    return s;
  };
  mapStrings(data.content, fn);
  mapStrings(data.zones, fn);
  mapStrings((data.root as { props?: unknown } | undefined)?.props, fn, "tokens");
  return count;
}

/**
 * Replace `var(<cssVar>)` everywhere in the page (not inside the token list) with `replacement`
 * — another `var(...)` when a token is renamed, or the raw value when it's detached.
 */
export function replaceTokenRefs<D extends PageLike>(data: D, cssVar: string, replacement: string): D {
  const needle = `var(${cssVar})`;
  const fn = (s: string) => (s.includes(needle) ? s.split(needle).join(replacement) : s);
  const root = data.root as { props?: Record<string, unknown> } | undefined;
  return {
    ...data,
    content: mapStrings(data.content, fn),
    zones: mapStrings(data.zones, fn),
    root: root?.props ? { ...root, props: mapStrings(root.props, fn, "tokens") } : data.root,
  } as D;
}
