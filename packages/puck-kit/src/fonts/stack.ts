import type { FontCategory, FontDefinition } from "./types";

const FALLBACKS: Record<FontCategory, string> = {
  "sans-serif": "sans-serif",
  serif: "serif",
  monospace: "monospace",
  display: "sans-serif",
  handwriting: "cursive",
};

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|emoji|math|fangsong)$/;

function quote(family: string) {
  const clean = family.replace(/["\\<>{};]/g, "").trim();
  return GENERIC.test(clean) ? clean : `"${clean}"`;
}

/** CSS `font-family` value for a font: `"Inter", sans-serif`. */
export function fontStack(font: FontDefinition): string {
  if (font.stack) return font.stack;
  return `${quote(font.family)}, ${font.fallback ?? FALLBACKS[font.category ?? "sans-serif"]}`;
}

export function fontLabel(font: FontDefinition): string {
  return font.label ?? font.family;
}

export function fontWeights(font: FontDefinition): number[] {
  return [...(font.weights?.length ? font.weights : [400, 700])].sort((a, b) => a - b);
}

/** First family name of a CSS stack, unquoted and lower-cased. */
export function firstFamily(stack: string | undefined): string | undefined {
  const first = stack?.split(",")[0]?.trim().replace(/^["']|["']$/g, "").trim();
  return first ? first.toLowerCase() : undefined;
}

/** The font of a library whose family is the stack's first family. */
export function findFont(stack: string | undefined, library: FontDefinition[]): FontDefinition | undefined {
  const name = firstFamily(stack);
  if (!name) return undefined;
  return library.find((f) => f.family.toLowerCase() === name);
}

/** Fonts installed everywhere: no loading needed. The default library. */
export const systemFonts: FontDefinition[] = (
  [
  { family: "ui-sans-serif", label: "System sans", category: "sans-serif", stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { family: "ui-serif", label: "System serif", category: "serif", stack: "ui-serif, Georgia, Cambria, 'Times New Roman', serif" },
  { family: "ui-monospace", label: "System mono", category: "monospace", stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  { family: "Seravek", label: "Humanist", category: "sans-serif", stack: "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif" },
  { family: "Avenir", label: "Geometric", category: "sans-serif", stack: "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif" },
  { family: "Charter", label: "Transitional", category: "serif", stack: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif" },
  { family: "Iowan Old Style", label: "Old style", category: "serif", stack: "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif" },
  { family: "ui-rounded", label: "Rounded", category: "sans-serif", stack: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', Calibri, source-sans-pro, sans-serif" },
  ] as Omit<FontDefinition, "source">[]
).map((f) => ({ ...f, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: true, source: { type: "system" as const } }));
