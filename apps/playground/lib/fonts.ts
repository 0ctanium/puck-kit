import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FontDefinition } from "puck-kit";
import { appPath } from "./paths";

const file = () => appPath("data", "fonts.json");

/** Fonts a fresh playground starts with. */
const seed: FontDefinition[] = [
  { family: "Inter", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800], source: { type: "google" } },
  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900], italic: true, source: { type: "google" } },
  { family: "JetBrains Mono", category: "monospace", weights: [400, 500, 700], italic: true, source: { type: "google" } },
];

export async function loadFonts(): Promise<FontDefinition[]> {
  try {
    return JSON.parse(await readFile(file(), "utf8"));
  } catch {
    return seed;
  }
}

export async function saveFonts(fonts: FontDefinition[]) {
  await mkdir(path.dirname(file()), { recursive: true });
  await writeFile(file(), JSON.stringify(fonts, null, 2));
}

const SOURCES = new Set(["google", "css", "files", "system"]);
const isUrl = (u: unknown) => typeof u === "string" && /^(https?:\/\/|\/)[^\s"'<>]*$/.test(u);

/** Keep only well-formed font definitions (the API accepts user input). */
export function sanitizeFonts(input: unknown): FontDefinition[] {
  if (!Array.isArray(input)) return [];
  const out: FontDefinition[] = [];
  for (const f of input) {
    if (!f || typeof f !== "object") continue;
    const { family, label, category, weights, italic, source } = f as FontDefinition;
    if (typeof family !== "string" || !family.trim() || family.length > 80 || !source || !SOURCES.has(source.type)) continue;
    if (source.type === "css" && !isUrl(source.url)) continue;
    if (source.type === "files" && (!Array.isArray(source.files) || !source.files.every((x) => isUrl(x?.url)))) continue;
    out.push({
      family: family.trim(),
      label: typeof label === "string" ? label.slice(0, 80) : undefined,
      category,
      weights: Array.isArray(weights) ? weights.map(Number).filter((w) => w >= 1 && w <= 1000) : undefined,
      italic: !!italic,
      source,
    });
  }
  return out;
}
