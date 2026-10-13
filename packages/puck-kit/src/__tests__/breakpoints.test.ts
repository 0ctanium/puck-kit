import { describe, expect, it } from "vitest";
import {
  breakpointForWidth,
  cascadeOf,
  coverageVars,
  coveredBy,
  defaultBreakpoints as bps,
  mobileFirstBreakpoints,
  sortBreakpoints,
  validateBreakpoints,
} from "../breakpoints";
import { responsiveStyles } from "../components/shared";

const keys = (list: { key: string }[]) => list.map((b) => b.key);

describe("breakpoints", () => {
  it("are displayed widest first", () => {
    expect(keys(sortBreakpoints(bps))).toEqual(["wide", "base", "tablet", "mobile"]);
    expect(keys(sortBreakpoints(mobileFirstBreakpoints))).toEqual(["xl", "lg", "md", "base"]);
  });

  it("cascade from the base outwards", () => {
    expect(keys(cascadeOf(bps, "mobile"))).toEqual(["base", "tablet", "mobile"]);
    expect(keys(cascadeOf(bps, "wide"))).toEqual(["base", "wide"]);
    expect(keys(cascadeOf(bps, "base"))).toEqual(["base"]);
    expect(keys(cascadeOf(mobileFirstBreakpoints, "lg"))).toEqual(["base", "md", "lg"]);
  });

  it("know which breakpoints inherit from one", () => {
    expect(keys(coveredBy(bps, "tablet"))).toEqual(["tablet", "mobile"]);
    expect(keys(coveredBy(bps, "base"))).toEqual(["wide", "base", "tablet", "mobile"]);
    const sorted = sortBreakpoints(bps);
    expect(coverageVars(sorted, "tablet")).toEqual({ "--pk-bp-start": 2, "--pk-bp-end": 4, "--pk-bp-count": 4 });
    expect(coverageVars(sorted, "wide")).toEqual({ "--pk-bp-start": 0, "--pk-bp-end": 1, "--pk-bp-count": 4 });
  });

  it("match viewport widths", () => {
    expect(breakpointForWidth(bps, 375).key).toBe("mobile");
    expect(breakpointForWidth(bps, 768).key).toBe("tablet");
    expect(breakpointForWidth(bps, 1024).key).toBe("base");
    expect(breakpointForWidth(bps, 1440).key).toBe("wide");
    expect(breakpointForWidth(mobileFirstBreakpoints, 375).key).toBe("base");
    expect(breakpointForWidth(mobileFirstBreakpoints, 1100).key).toBe("lg");
  });

  it("reject setups without a single base or with overlapping ranges", () => {
    expect(() => validateBreakpoints(bps)).not.toThrow();
    expect(() => validateBreakpoints(bps.filter((b) => b.key !== "base"))).toThrow(/base/);
    expect(() => validateBreakpoints([...bps, { key: "x", label: "X", maxWidth: 1400, viewport: 1300 }])).toThrow(/below/);
  });

  it("build size-dependent defaults with only the differences", () => {
    const widths = (list: typeof bps) =>
      responsiveStyles(list, (bp) => ({ maxWidth: bp.viewport >= 1024 ? "960px" : "none" }));
    expect(widths(bps)).toEqual({ base: { maxWidth: "960px" }, tablet: { maxWidth: "none" } });
    expect(widths(mobileFirstBreakpoints)).toEqual({ base: { maxWidth: "none" }, lg: { maxWidth: "960px" } });
  });
});
