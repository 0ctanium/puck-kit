import { describe, expect, it } from "vitest";
import { compileStyles, resolveValue, sanitizeValue, styleClass } from "../styles/compile";
import { getPageCss } from "../styles/pageCss";
import { tokenRef, tokensToCss } from "../styles/tokens";

describe("compileStyles", () => {
  it("emits base styles without a media query and larger breakpoints mobile-first", () => {
    const css = compileStyles(".x", {
      lg: { paddingTop: "40px" },
      base: { display: "flex", flexDirection: "column" },
      md: { flexDirection: "row" },
    });
    expect(css).toBe(
      ".x{display:flex;flex-direction:column}" +
        "@media (min-width:768px){.x{flex-direction:row}}" +
        "@media (min-width:1024px){.x{padding-top:40px}}",
    );
  });

  it("skips empty values, empty breakpoints and unknown properties", () => {
    const css = compileStyles(".x", {
      base: { color: "", width: "  " },
      md: {},
      lg: { evil: "x" } as never,
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

describe("resolveValue", () => {
  const styles = { base: { color: "red" }, lg: { color: "blue" } };
  it("cascades from smaller breakpoints", () => {
    expect(resolveValue(styles, "color", "md")).toEqual({ value: "red", from: "base" });
    expect(resolveValue(styles, "color", "xl")).toEqual({ value: "blue", from: "lg" });
    expect(resolveValue(styles, "width", "xl")).toEqual({ value: undefined, from: undefined });
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
            content: [{ type: "Heading", props: { id: "Heading-2", styles: { md: { fontSize: "40px" } } } }],
          },
        },
        { type: "Columns", props: { id: "Columns-3", columns: [{ content: [{ type: "Text", props: { id: "Text-4", styles: { base: { color: "red" } } } }] }] } },
      ],
    });
    expect(css).toContain(":root{--pk-color-a:#111}");
    expect(css).toContain(".pk-Box-1{gap:8px}");
    expect(css).toContain("@media (min-width:768px){.pk-Heading-2{font-size:40px}}");
    expect(css).toContain(".pk-Text-4{color:red}");
  });
});
