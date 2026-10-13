import { describe, expect, it } from "vitest";
import { formatColor, hsvaToRgba, parseColor, rgbaToHsva } from "../fields/css/color";
import { splitTopLevel } from "../fields/css/split";
import {
  parseBackgroundLayers,
  parseFilters,
  parseGradient,
  parseShadows,
  parseTracks,
  parseTransforms,
  parseTransitions,
  serializeBackgroundLayers,
  serializeGradient,
  serializeShadows,
  serializeTextShadows,
  serializeTracks,
  serializeTransforms,
  serializeTransitions,
} from "../fields/css/values";

describe("splitTopLevel", () => {
  it("ignores separators inside functions and quotes", () => {
    expect(splitTopLevel("rgba(0, 0, 0, .5) 0 1px, url('a,b.png')", ",")).toEqual(["rgba(0, 0, 0, .5) 0 1px", "url('a,b.png')"]);
  });
});

describe("grid tracks", () => {
  it("expands repeat and unwraps minmax(0,fr)", () => {
    expect(parseTracks("repeat(3,minmax(0,1fr))")).toEqual(["1fr", "1fr", "1fr"]);
    expect(parseTracks("minmax(0,1fr) minmax(0,2fr) 200px auto")).toEqual(["1fr", "2fr", "200px", "auto"]);
  });
  it("returns null for templates it can't edit", () => {
    expect(parseTracks("repeat(auto-fit, minmax(200px, 1fr))")).toBeNull();
    expect(parseTracks("[full] 1fr")).toBeNull();
  });
  it("round-trips", () => {
    expect(serializeTracks(["1fr", "1fr"])).toBe("repeat(2,minmax(0,1fr))");
    expect(serializeTracks(["1fr", "200px"])).toBe("minmax(0,1fr) 200px");
    expect(serializeTracks([])).toBe("");
  });
});

describe("shadows", () => {
  it("parses multiple layers with inset and colors anywhere", () => {
    const s = parseShadows("0 4px 12px rgba(0, 0, 0, 0.1), inset #fff 1px 2px");
    expect(s).toEqual([
      { inset: false, x: "0", y: "4px", blur: "12px", spread: "0px", color: "rgba(0, 0, 0, 0.1)" },
      { inset: true, x: "1px", y: "2px", blur: "0px", spread: "0px", color: "#fff" },
    ]);
    expect(serializeShadows(s)).toBe("0 4px 12px 0px rgba(0, 0, 0, 0.1), inset 1px 2px 0px 0px #fff");
  });
});

describe("text shadows", () => {
  it("parses x y blur color and serializes without spread", () => {
    const s = parseShadows("1px 2px 3px #000, 0 0 8px rgba(0, 0, 0, 0.5)");
    expect(s.map((x) => [x.x, x.y, x.blur, x.color])).toEqual([
      ["1px", "2px", "3px", "#000"],
      ["0", "0", "8px", "rgba(0, 0, 0, 0.5)"],
    ]);
    expect(serializeTextShadows(s)).toBe("1px 2px 3px #000, 0 0 8px rgba(0, 0, 0, 0.5)");
  });
});

describe("transforms", () => {
  it("parses common functions and normalizes them", () => {
    const t = parseTransforms("translateY(-2px) scale(1.05) rotate(5deg)")!;
    expect(t).toEqual([
      { kind: "move", x: "0px", y: "-2px" },
      { kind: "scale", x: "1.05", y: "1.05" },
      { kind: "rotate", angle: "5deg" },
    ]);
    expect(serializeTransforms(t)).toBe("translate(0px, -2px) scale(1.05, 1.05) rotate(5deg)");
  });
  it("returns null for unsupported functions", () => {
    expect(parseTransforms("matrix(1,0,0,1,0,0)")).toBeNull();
  });
});

describe("transitions", () => {
  it("parses and serializes", () => {
    const t = parseTransitions("opacity .2s ease-in, transform 300ms cubic-bezier(.2,0,0,1) 50ms");
    expect(t).toEqual([
      { property: "opacity", duration: ".2s", easing: "ease-in", delay: "0ms" },
      { property: "transform", duration: "300ms", easing: "cubic-bezier(.2,0,0,1)", delay: "50ms" },
    ]);
    expect(serializeTransitions(t)).toBe("opacity .2s ease-in, transform 300ms cubic-bezier(.2,0,0,1) 50ms");
  });
});

describe("filters", () => {
  it("parses known filters only", () => {
    expect(parseFilters("blur(4px) saturate(150%)")).toEqual([
      { name: "blur", value: "4px" },
      { name: "saturate", value: "150%" },
    ]);
    expect(parseFilters("url(#svg)")).toBeNull();
  });
});

describe("gradients", () => {
  it("parses linear gradients with side keywords and implicit positions", () => {
    expect(parseGradient("linear-gradient(to right, red, rgba(0, 0, 255, 0.5))")).toEqual({
      type: "linear",
      angle: 90,
      stops: [
        { color: "red", position: 0 },
        { color: "rgba(0, 0, 255, 0.5)", position: 100 },
      ],
    });
  });
  it("round-trips", () => {
    const g = parseGradient("linear-gradient(45deg, #000 10%, #fff 90%)")!;
    expect(serializeGradient(g)).toBe("linear-gradient(45deg, #000 10%, #fff 90%)");
    expect(serializeGradient({ ...g, type: "radial" })).toBe("radial-gradient(circle, #000 10%, #fff 90%)");
  });
});

describe("background layers", () => {
  it("aligns size/position/repeat lists with images", () => {
    const layers = parseBackgroundLayers({
      image: 'url("a.png"), linear-gradient(#000 0%, #fff 100%)',
      size: "cover",
      repeat: "no-repeat, repeat",
    });
    expect(layers.map((l) => [l.size, l.position, l.repeat])).toEqual([
      ["cover", "0% 0%", "no-repeat"],
      ["cover", "0% 0%", "repeat"],
    ]);
    expect(serializeBackgroundLayers(layers).size).toBe("cover, cover");
  });
});

describe("background image layer without URL", () => {
  it("keeps a lone `none` layer when it has layer settings (new image layer)", () => {
    const layers = parseBackgroundLayers({ image: "none", size: "cover", position: "center center", repeat: "no-repeat" });
    expect(layers).toHaveLength(1);
    expect(serializeBackgroundLayers(layers).image).toBe("none");
  });
  it("treats a bare `none` as no background", () => {
    expect(parseBackgroundLayers({ image: "none" })).toEqual([]);
  });
});

describe("colors", () => {
  it("parses hex and rgba", () => {
    expect(parseColor("#0f08")).toEqual({ r: 0, g: 255, b: 0, a: 136 / 255 });
    expect(parseColor("rgb(10 20 30 / 50%)")).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
    expect(parseColor("var(--x)")).toBeNull();
  });
  it("formats as hex when opaque", () => {
    expect(formatColor({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
    expect(formatColor({ r: 255, g: 0, b: 0, a: 0.5 })).toBe("rgba(255, 0, 0, 0.5)");
  });
  it("converts hsv round-trip", () => {
    const c = { r: 79, g: 70, b: 229, a: 1 };
    const back = hsvaToRgba(rgbaToHsva(c));
    expect([back.r, back.g, back.b].map(Math.round)).toEqual([79, 70, 229]);
  });
});
