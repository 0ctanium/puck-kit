import { firstFamily } from "./stack";
import type { FontDefinition, FontFile } from "./types";
import { fontWeights } from "./stack";

export interface FontAssets {
  /** Stylesheet URLs to <link> (one Google Fonts URL per family + `css` sources). */
  stylesheets: string[];
  /** @font-face rules for self-hosted `files` fonts. */
  fontFaceCss: string;
  /** True when Google Fonts are used (preconnect to fonts.gstatic.com). */
  google: boolean;
}

/** Google Fonts css2 URL for several families (axes sorted as the API requires). */
export function googleFontsUrl(fonts: FontDefinition[]): string | undefined {
  const families = fonts
    .filter((f) => f.source.type === "google")
    .map((f) => {
      const name = encodeURIComponent(f.family.trim()).replace(/%20/g, "+");
      const weights = fontWeights(f);
      if (f.italic) {
        const tuples = [...weights.map((w) => `0,${w}`), ...weights.map((w) => `1,${w}`)];
        return `family=${name}:ital,wght@${tuples.join(";")}`;
      }
      return `family=${name}:wght@${weights.join(";")}`;
    });
  if (!families.length) return undefined;
  return `https://fonts.googleapis.com/css2?${[...new Set(families)].join("&")}&display=swap`;
}

const clean = (s: string) => s.replace(/["\\<>{};\n\r]/g, "").trim();

function format(file: FontFile) {
  if (file.format) return clean(file.format);
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(file.url)?.[1]?.toLowerCase();
  return ({ woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" } as Record<string, string>)[ext ?? ""];
}

export function fontFaceCss(fonts: FontDefinition[]): string {
  const rules: string[] = [];
  for (const f of fonts) {
    if (f.source.type !== "files") continue;
    for (const file of f.source.files) {
      if (!file.url) continue;
      const fmt = format(file);
      rules.push(
        `@font-face{font-family:"${clean(f.family)}";src:url("${clean(file.url)}")${fmt ? ` format("${fmt}")` : ""};` +
          `font-weight:${Number(file.weight) || 400};font-style:${file.style === "italic" ? "italic" : "normal"};font-display:swap}`,
      );
    }
  }
  return rules.join("\n");
}

export function getFontAssets(fonts: FontDefinition[]): FontAssets {
  // One stylesheet per Google family: css2 rejects a whole request when one family lacks a
  // requested weight, so a misconfigured font can only break itself.
  const google = fonts.flatMap((f) => {
    const url = f.source.type === "google" ? googleFontsUrl([f]) : undefined;
    return url ? [url] : [];
  });
  const css = fonts.flatMap((f) => (f.source.type === "css" && f.source.url ? [f.source.url] : []));
  return {
    stylesheets: [...new Set([...google, ...css])],
    fontFaceCss: fontFaceCss(fonts),
    google: google.length > 0,
  };
}

/** Collect every `fontFamily` value (any breakpoint, any element) and the font tokens of a page. */
function collectStacks(value: unknown, out: Set<string>) {
  if (Array.isArray(value)) {
    for (const v of value) collectStacks(v, out);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [k, v] of Object.entries(value)) {
    if (k === "fontFamily" && typeof v === "string") out.add(v);
    else collectStacks(v, out);
  }
}

/** Library fonts a page actually uses: through font tokens or directly in element styles. */
export function usedFonts(
  data: { content?: unknown; zones?: unknown; root?: unknown },
  library: FontDefinition[],
): FontDefinition[] {
  const stacks = new Set<string>();
  collectStacks([data.content, data.zones], stacks);
  const root = data.root as { props?: { styles?: unknown; tokens?: { fonts?: { value?: string }[] } } } | undefined;
  collectStacks(root?.props?.styles, stacks);
  for (const t of root?.props?.tokens?.fonts ?? []) if (t?.value) stacks.add(t.value);
  const names = new Set([...stacks].map(firstFamily).filter(Boolean));
  return library.filter((f) => names.has(f.family.toLowerCase()));
}

export const FONT_METADATA_KEY = "pkFonts";

/**
 * Puck `metadata` carrying the fonts to load. Editor: all fonts (`BuilderEditor` does this).
 * Public pages: pass the page `data` to load only the fonts it uses:
 * `<Render config={config} data={data} metadata={fontMetadata(fonts, data)} />`
 */
export function fontMetadata(
  library: FontDefinition[] | undefined,
  data?: { content?: unknown; zones?: unknown; root?: unknown },
): Record<string, FontDefinition[]> {
  const fonts = library ?? [];
  return { [FONT_METADATA_KEY]: data ? usedFonts(data, fonts) : fonts };
}
