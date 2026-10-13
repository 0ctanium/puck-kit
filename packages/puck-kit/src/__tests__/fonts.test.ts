import { describe, expect, it } from "vitest";
import { fontFaceCss, fontMetadata, getFontAssets, googleFontsUrl, usedFonts } from "../fonts/load";
import { findFont, firstFamily, fontStack, systemFonts } from "../fonts/stack";
import type { FontDefinition } from "../fonts/types";

const inter: FontDefinition = { family: "Inter", category: "sans-serif", weights: [700, 400], source: { type: "google" } };
const playfair: FontDefinition = { family: "Playfair Display", category: "serif", weights: [400, 900], italic: true, source: { type: "google" } };
const brand: FontDefinition = {
  family: "Brand Sans",
  category: "display",
  source: {
    type: "files",
    files: [
      { url: "/fonts/brand-regular.woff2", weight: 400 },
      { url: '/fonts/brand"italic.ttf?v=2', weight: 400, style: "italic" },
    ],
  },
};
const adobe: FontDefinition = { family: "Proxima Nova", source: { type: "css", url: "https://use.typekit.net/abc.css" } };

describe("stacks", () => {
  it("quotes the family and adds the category fallback", () => {
    expect(fontStack(inter)).toBe('"Inter", sans-serif');
    expect(fontStack(brand)).toBe('"Brand Sans", sans-serif');
    expect(fontStack({ family: "Caveat", category: "handwriting", source: { type: "google" } })).toBe('"Caveat", cursive');
    expect(fontStack(systemFonts[0])).toBe(systemFonts[0].stack);
  });

  it("finds a font by the first family of a stack, ignoring quotes and case", () => {
    const lib = [inter, playfair, ...systemFonts];
    expect(firstFamily(" 'Playfair Display' , serif")).toBe("playfair display");
    expect(findFont("playfair display, serif", lib)).toBe(playfair);
    expect(findFont('"Inter", Arial', lib)).toBe(inter);
    expect(findFont("ui-sans-serif, system-ui, sans-serif", lib)?.label).toBe("System sans");
    expect(findFont("Comic Sans MS", lib)).toBeUndefined();
    expect(findFont(undefined, lib)).toBeUndefined();
  });
});

describe("loading", () => {
  it("builds one Google css2 URL with sorted weights and italic tuples", () => {
    expect(googleFontsUrl([inter, playfair, brand])).toBe(
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,900;1,400;1,900&display=swap",
    );
    expect(googleFontsUrl([brand])).toBeUndefined();
  });

  it("writes sanitized @font-face rules for self-hosted files", () => {
    expect(fontFaceCss([brand])).toBe(
      '@font-face{font-family:"Brand Sans";src:url("/fonts/brand-regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:swap}\n' +
        '@font-face{font-family:"Brand Sans";src:url("/fonts/branditalic.ttf?v=2") format("truetype");font-weight:400;font-style:italic;font-display:swap}',
    );
  });

  it("collects all assets", () => {
    const assets = getFontAssets([inter, playfair, adobe, brand, systemFonts[0]]);
    expect(assets.stylesheets).toEqual([googleFontsUrl([inter]), googleFontsUrl([playfair]), "https://use.typekit.net/abc.css"]);
    expect(assets.google).toBe(true);
    expect(assets.fontFaceCss).toContain("Brand Sans");
  });
});

describe("usedFonts", () => {
  const library = [inter, playfair, brand, adobe];
  const data = {
    root: { props: { tokens: { fonts: [{ name: "Heading", value: '"Playfair Display", serif' }] }, styles: {} } },
    content: [
      {
        type: "Box",
        props: {
          id: "a",
          styles: { base: { fontFamily: "var(--pk-font-heading)" }, lg: { fontFamily: "'Brand Sans', sans-serif" } },
          content: [
            { type: "Text", props: { id: "b", styles: { base: { fontFamily: "Comic Sans MS" } } } },
            // A `font` field value in a component prop, and a text that merely mentions a font name.
            { type: "Banner", props: { id: "c", headingFont: '"Proxima Nova", sans-serif', title: "Inter" } },
          ],
        },
      },
    ],
  };

  it("keeps fonts used by tokens and element styles only", () => {
    expect(usedFonts(data, library)).toEqual([playfair, brand, adobe]);
    expect(fontMetadata(library, data)).toEqual({ pkFonts: [playfair, brand, adobe] });
    expect(fontMetadata(library)).toEqual({ pkFonts: library });
  });
});
