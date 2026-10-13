import type { FontCategory } from "puck-kit";

export interface CatalogFont {
  family: string;
  category: FontCategory;
  weights: number[];
  italic?: boolean;
}

const range = (from: number, to: number) => Array.from({ length: (to - from) / 100 + 1 }, (_, i) => from + i * 100);

/**
 * A curated subset of Google Fonts (no API key needed). Weights/italics must exist on Google:
 * the css2 API rejects requests for missing styles. A real app could load the full catalog
 * from https://www.googleapis.com/webfonts/v1/webfonts (API key) instead.
 */
export const googleCatalog: CatalogFont[] = [
  // Sans serif
  { family: "Inter", category: "sans-serif", weights: range(100, 900) },
  { family: "Roboto", category: "sans-serif", weights: [100, 300, 400, 500, 700, 900], italic: true },
  { family: "Open Sans", category: "sans-serif", weights: range(300, 800), italic: true },
  { family: "Lato", category: "sans-serif", weights: [100, 300, 400, 700, 900], italic: true },
  { family: "Montserrat", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "Poppins", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "Raleway", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "Nunito", category: "sans-serif", weights: range(200, 900), italic: true },
  { family: "Work Sans", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "DM Sans", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "Manrope", category: "sans-serif", weights: range(200, 800) },
  { family: "Space Grotesk", category: "sans-serif", weights: range(300, 700) },
  { family: "Plus Jakarta Sans", category: "sans-serif", weights: range(200, 800), italic: true },
  { family: "Outfit", category: "sans-serif", weights: range(100, 900) },
  { family: "Rubik", category: "sans-serif", weights: range(300, 900), italic: true },
  { family: "Karla", category: "sans-serif", weights: range(200, 800), italic: true },
  { family: "Source Sans 3", category: "sans-serif", weights: range(200, 900), italic: true },
  { family: "IBM Plex Sans", category: "sans-serif", weights: range(100, 700), italic: true },
  { family: "Fira Sans", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "Barlow", category: "sans-serif", weights: range(100, 900), italic: true },
  { family: "Josefin Sans", category: "sans-serif", weights: range(100, 700), italic: true },
  { family: "Quicksand", category: "sans-serif", weights: range(300, 700) },
  // Serif
  { family: "Playfair Display", category: "serif", weights: range(400, 900), italic: true },
  { family: "Lora", category: "serif", weights: range(400, 700), italic: true },
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900], italic: true },
  { family: "EB Garamond", category: "serif", weights: range(400, 800), italic: true },
  { family: "Cormorant Garamond", category: "serif", weights: range(300, 700), italic: true },
  { family: "Crimson Pro", category: "serif", weights: range(200, 900), italic: true },
  { family: "Source Serif 4", category: "serif", weights: range(200, 900), italic: true },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700] },
  { family: "PT Serif", category: "serif", weights: [400, 700], italic: true },
  { family: "Roboto Slab", category: "serif", weights: range(100, 900) },
  { family: "Bitter", category: "serif", weights: range(100, 900), italic: true },
  { family: "DM Serif Display", category: "serif", weights: [400], italic: true },
  // Monospace
  { family: "JetBrains Mono", category: "monospace", weights: range(100, 800), italic: true },
  { family: "Fira Code", category: "monospace", weights: range(300, 700) },
  { family: "IBM Plex Mono", category: "monospace", weights: range(100, 700), italic: true },
  { family: "Roboto Mono", category: "monospace", weights: range(100, 700), italic: true },
  { family: "Source Code Pro", category: "monospace", weights: range(200, 900), italic: true },
  { family: "Space Mono", category: "monospace", weights: [400, 700], italic: true },
  // Display & handwriting
  { family: "Bebas Neue", category: "display", weights: [400] },
  { family: "Oswald", category: "display", weights: range(200, 700) },
  { family: "Abril Fatface", category: "display", weights: [400] },
  { family: "Archivo Black", category: "display", weights: [400] },
  { family: "Righteous", category: "display", weights: [400] },
  { family: "Lobster", category: "display", weights: [400] },
  { family: "Pacifico", category: "handwriting", weights: [400] },
  { family: "Caveat", category: "handwriting", weights: range(400, 700) },
  { family: "Dancing Script", category: "handwriting", weights: range(400, 700) },
];
