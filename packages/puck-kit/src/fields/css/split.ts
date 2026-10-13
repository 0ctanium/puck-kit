/** Split on a separator at nesting depth 0 (ignores separators inside parentheses and quotes). */
export function splitTopLevel(input: string, separator: "," | " "): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    const isSep = separator === " " ? /\s/.test(ch) : ch === separator;
    if (!quote && depth === 0 && isSep) {
      if (current.trim()) out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** `name(args)` → { name, args } with top-level comma split args. */
export function parseFunction(input: string): { name: string; args: string[] } | null {
  const m = /^([a-zA-Z-]+)\((.*)\)$/s.exec(input.trim());
  if (!m) return null;
  return { name: m[1].toLowerCase(), args: splitTopLevel(m[2], ",") };
}

export interface Length {
  num: number;
  unit: string;
}

/** "16px" → { num: 16, unit: "px" }, "1.5" → { num: 1.5, unit: "" }. Keywords/var()/calc() → null. */
export function parseLength(value: string | undefined): Length | null {
  if (value == null) return null;
  const m = /^(-?\d*\.?\d+)([a-z%]*)$/i.exec(value.trim());
  if (!m) return null;
  return { num: parseFloat(m[1]), unit: m[2].toLowerCase() };
}

export function formatNumber(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}
