import { describe, expect, it } from "vitest";
import { mobileFirstBreakpoints } from "../breakpoints";
import { compileStyles, resolveValue, sanitizeValue, styleClass } from "../styles/compile";
import { getPageCss } from "../styles/pageCss";
import { tokenRef, tokensToCss } from "../styles/tokens";

describe("compileStyles", () => {
  it("emits base styles first, then larger screens up and smaller screens down (desktop-first)", () => {
    const css = compileStyles(".x", {
      mobile: { flexDirection: "column" },
      base: { display: "flex", flexDirection: "row" },
      wide: { paddingTop: "40px" },
      tablet: { gap: "8px" },
    });
    expect(css).toBe(
      ".x{display:flex;flex-direction:row}" +
        "@media (min-width:1280px){.x{padding-top:40px}}" +
        "@media (max-width:1023px){.x{gap:8px}}" +
        "@media (max-width:767px){.x{flex-direction:column}}",
    );
  });

  it("still compiles mobile-first breakpoints", () => {
    const css = compileStyles(
      ".x",
      { lg: { paddingTop: "40px" }, base: { display: "flex" }, md: { flexDirection: "row" } },
      mobileFirstBreakpoints,
    );
    expect(css).toBe(
      ".x{display:flex}@media (min-width:768px){.x{flex-direction:row}}@media (min-width:1024px){.x{padding-top:40px}}",
    );
  });

  it("skips empty values, empty breakpoints and unknown properties", () => {
    const css = compileStyles(".x", {
      base: { color: "", width: "  " },
      tablet: {},
      mobile: { evil: "x" } as never,
    });
    expect(css).toBe("");
  });

  it("adds px to bare numbers except unitless properties", () => {
    expect(compileStyles(".x", { base: { width: "120", lineHeight: "1.4", zIndex: "2", marginTop: "0" } })).toBe(
      ".x{margin-top:0;width:120px;z-index:2;line-height:1.4}",
    );
  });

  it("strips characters that could escape the declaration or the style tag", () => {
    expect(sanitizeValue("color", "red;}</style><script>")).toBe("red/stylescript");
  });

  it("supports token references", () => {
    expect(compileStyles(".x", { base: { color: tokenRef("colors", "Brand Blue") } })).toBe(
      ".x{color:var(--pk-color-brand-blue)}",
    );
  });
});

it("emits shorthands before longhands whatever the insertion order", () => {
    expect(compileStyles(".x", { base: { borderTopWidth: "2px", borderWidth: "1px" } })).toBe(
      ".x{border-width:1px;border-top-width:2px}",
    );
  });

describe("states", () => {
  const styles = {
    base: { color: "black" },
    "base:active": { color: "red" },
    "base:hover": { color: "blue" },
    "tablet:hover": { transform: "scale(1.02)" },
    "base:bogus": { color: "green" },
  };

  it("emits state rules after the plain rule, inside the same media query, in cascade order", () => {
    expect(compileStyles(".x", styles)).toBe(
      ".x{color:black}.x:hover{color:blue}.x:active{color:red}" +
        "@media (max-width:1023px){.x:hover{transform:scale(1.02)}}",
    );
  });

  it("adds the editor preview selector only in preview mode", () => {
    expect(compileStyles(".x", { "base:hover": { color: "blue" } }, undefined, { preview: true })).toBe(
      '.x:hover,.x[data-pk-state="hover"]{color:blue}',
    );
  });

  it("resolves state values through the cascade, falling back to the plain value", () => {
    expect(resolveValue(styles, "color", "mobile", undefined, "hover")).toEqual({ value: "blue", from: "base", fromState: "hover" });
    expect(resolveValue(styles, "transform", "mobile", undefined, "hover")).toEqual({ value: "scale(1.02)", from: "tablet", fromState: "hover" });
    expect(resolveValue(styles, "transform", "base", undefined, "hover")).toEqual({ value: undefined, from: undefined });
    expect(resolveValue(styles, "transform", "wide", undefined, "hover")).toEqual({ value: undefined, from: undefined });
    expect(resolveValue(styles, "color", "tablet", undefined, "focus")).toEqual({ value: "black", from: "base", fromState: undefined });
  });
});

describe("resolveValue", () => {
  const styles = { base: { color: "red" }, tablet: { color: "blue" }, wide: { width: "50%" } };
  it("cascades down from the base to smaller screens and up to larger ones", () => {
    expect(resolveValue(styles, "color", "mobile")).toEqual({ value: "blue", from: "tablet" });
    expect(resolveValue(styles, "color", "wide")).toEqual({ value: "red", from: "base" });
    expect(resolveValue(styles, "width", "base")).toEqual({ value: undefined, from: undefined });
    expect(resolveValue(styles, "width", "mobile")).toEqual({ value: undefined, from: undefined });
    expect(resolveValue(styles, "width", "wide")).toEqual({ value: "50%", from: "wide" });
  });
  it("cascades up with mobile-first breakpoints", () => {
    const mf = { base: { color: "red" }, lg: { color: "blue" } };
    expect(resolveValue(mf, "color", "md", mobileFirstBreakpoints)).toEqual({ value: "red", from: "base" });
    expect(resolveValue(mf, "color", "xl", mobileFirstBreakpoints)).toEqual({ value: "blue", from: "lg" });
  });
});

describe("styleClass", () => {
  it("is deterministic and CSS-safe", () => {
    expect(styleClass("Heading-1a2b c")).toBe("pk-Heading-1a2b_c");
  });
});

describe("tokens", () => {
  it("compiles tokens to custom properties", () => {
    expect(tokensToCss({ colors: [{ name: "Primary", value: "#000" }], sizes: [{ name: "", value: "1px" }] })).toBe(
      ":root{--pk-color-primary:#000}",
    );
  });
});

describe("getPageCss", () => {
  it("collects styles of nested slot content", () => {
    const css = getPageCss({
      root: { props: { tokens: { colors: [{ name: "A", value: "#111" }] } } },
      content: [
        {
          type: "Box",
          props: {
            id: "Box-1",
            styles: { base: { gap: "8px" } },
            content: [{ type: "Heading", props: { id: "Heading-2", styles: { mobile: { fontSize: "40px" } } } }],
          },
        },
        { type: "Columns", props: { id: "Columns-3", columns: [{ content: [{ type: "Text", props: { id: "Text-4", styles: { base: { color: "red" } } } }] }] } },
      ],
    });
    expect(css).toContain(":root{--pk-color-a:#111}");
    expect(css).toContain(".pk-Box-1{gap:8px}");
    expect(css).toContain("@media (max-width:767px){.pk-Heading-2{font-size:40px}}");
    expect(css).toContain(".pk-Text-4{color:red}");
  });
});
