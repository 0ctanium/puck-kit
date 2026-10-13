export type FontCategory = "sans-serif" | "serif" | "monospace" | "display" | "handwriting";

export interface FontFile {
  url: string;
  weight?: number;
  style?: "normal" | "italic";
  /** e.g. "woff2". Inferred from the URL extension when omitted. */
  format?: string;
}

export type FontSource =
  /** Loaded from fonts.googleapis.com (css2 API). */
  | { type: "google" }
  /** Any stylesheet declaring the font (Adobe Fonts, Bunny Fonts, your own CSS…). */
  | { type: "css"; url: string }
  /** Self-hosted font files: the kit writes the @font-face rules. */
  | { type: "files"; files: FontFile[] }
  /** Installed on the visitor's device: nothing to load. */
  | { type: "system" };

export interface FontDefinition {
  /** CSS family name, e.g. "Inter". */
  family: string;
  /** Display name (defaults to `family`). */
  label?: string;
  category?: FontCategory;
  /** Generic fallback appended to the stack (defaults from the category). */
  fallback?: string;
  /** Full CSS stack, overriding `family` + `fallback` (used for system stacks). */
  stack?: string;
  /** Available weights (default [400, 700]). Google requests exactly these. */
  weights?: number[];
  /** Whether italics exist (for every listed weight). */
  italic?: boolean;
  source: FontSource;
}
