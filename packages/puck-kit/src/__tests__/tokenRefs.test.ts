import { describe, expect, it } from "vitest";
import { countTokenUsage, replaceTokenRefs } from "../styles/tokenRefs";

const data = {
  root: {
    props: {
      tokens: { colors: [{ name: "Primary", value: "var(--pk-color-primary)" }] },
      styles: { base: { color: "var(--pk-color-primary)" } },
    },
  },
  content: [
    {
      type: "Box",
      props: {
        id: "a",
        styles: {
          base: { backgroundColor: "var(--pk-color-primary)", borderColor: "var(--pk-color-primary-dark)" },
          md: { boxShadow: "0 1px 2px var(--pk-color-primary), 0 0 0 var(--pk-color-primary)" },
        },
        content: [{ type: "Text", props: { id: "b", styles: { base: { color: "#000" } } } }],
      },
    },
  ],
};

describe("countTokenUsage", () => {
  it("counts exact references in elements and root styles, not in the token list", () => {
    expect(countTokenUsage(data, "--pk-color-primary")).toBe(4);
    expect(countTokenUsage(data, "--pk-color-primary-dark")).toBe(1);
    expect(countTokenUsage(data, "--pk-color-unused")).toBe(0);
  });
});

describe("replaceTokenRefs", () => {
  it("rewrites references without touching similar names or the token list", () => {
    const next = replaceTokenRefs(data, "--pk-color-primary", "var(--pk-color-brand)");
    expect(countTokenUsage(next, "--pk-color-brand")).toBe(4);
    expect(countTokenUsage(next, "--pk-color-primary")).toBe(0);
    expect(countTokenUsage(next, "--pk-color-primary-dark")).toBe(1);
    expect(next.root.props.tokens).toBe(data.root.props.tokens);
    // Untouched branches keep their identity.
    expect(next.content[0].props.content).toBe(data.content[0].props.content);
  });
  it("can detach a token into its raw value", () => {
    const next = replaceTokenRefs(data, "--pk-color-primary", "#4f46e5");
    expect(next.content[0].props.styles.base.backgroundColor).toBe("#4f46e5");
  });
});
