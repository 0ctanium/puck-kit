import { parseFunction, parseLength, splitTopLevel } from "./split";

/* ----------------------------------------------------------------------------------------
 * Grid tracks
 * -------------------------------------------------------------------------------------- */

/** "repeat(3,minmax(0,1fr))" → ["1fr","1fr","1fr"]. Returns null for templates we can't edit visually. */
export function parseTracks(value: string | undefined): string[] | null {
  if (!value?.trim()) return [];
  const tracks: string[] = [];
  for (const part of splitTopLevel(value, " ")) {
    const fn = parseFunction(part);
    if (fn?.name === "repeat") {
      const count = parseInt(fn.args[0], 10);
      const inner = fn.args.slice(1).join(",");
      if (!Number.isFinite(count) || count < 1 || count > 24) return null;
      const one = parseTracks(inner);
      if (!one || one.length !== 1) return null;
      for (let i = 0; i < count; i++) tracks.push(one[0]);
    } else if (fn?.name === "minmax" && fn.args[0] === "0" && /fr$/.test(fn.args[1])) {
      tracks.push(fn.args[1]);
    } else if (fn) {
      tracks.push(part);
    } else if (parseLength(part) || /^(auto|min-content|max-content)$/.test(part)) {
      tracks.push(part);
    } else {
      return null;
    }
  }
  return tracks;
}

/** fr tracks become `minmax(0,Nfr)` so long content can't blow up the grid. */
export function serializeTracks(tracks: string[]): string {
  if (!tracks.length) return "";
  const out = tracks.map((t) => (/^\d*\.?\d+fr$/.test(t) ? `minmax(0,${t})` : t));
  if (out.length > 1 && out.every((t) => t === out[0])) return `repeat(${out.length},${out[0]})`;
  return out.join(" ");
}

/* ----------------------------------------------------------------------------------------
 * Box shadows
 * -------------------------------------------------------------------------------------- */

export interface Shadow {
  inset: boolean;
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
}

export const defaultShadow: Shadow = { inset: false, x: "0px", y: "4px", blur: "12px", spread: "0px", color: "rgba(0, 0, 0, 0.15)" };

export function parseShadows(value: string | undefined): Shadow[] {
  if (!value?.trim() || value.trim() === "none") return [];
  return splitTopLevel(value, ",").map((layer) => {
    const parts = splitTopLevel(layer, " ");
    const shadow: Shadow = { inset: false, x: "0px", y: "0px", blur: "0px", spread: "0px", color: "rgba(0, 0, 0, 1)" };
    const lengths: string[] = [];
    for (const p of parts) {
      if (p === "inset") shadow.inset = true;
      else if (parseLength(p)) lengths.push(p);
      else shadow.color = p;
    }
    [shadow.x, shadow.y, shadow.blur = "0px", shadow.spread = "0px"] = [
      lengths[0] ?? "0px",
      lengths[1] ?? "0px",
      lengths[2],
      lengths[3],
    ];
    return shadow;
  });
}

/** text-shadow has no `inset` and no spread: `x y blur color`. */
export const defaultTextShadow: Shadow = { inset: false, x: "0px", y: "2px", blur: "4px", spread: "0px", color: "rgba(0, 0, 0, 0.25)" };

export function serializeTextShadows(shadows: Shadow[]): string {
  return shadows.map((s) => [s.x, s.y, s.blur, s.color].join(" ")).join(", ");
}

export function serializeShadows(shadows: Shadow[]): string {
  return shadows
    .map((s) => [s.inset && "inset", s.x, s.y, s.blur, s.spread, s.color].filter(Boolean).join(" "))
    .join(", ");
}

/* ----------------------------------------------------------------------------------------
 * Transforms
 * -------------------------------------------------------------------------------------- */

export type Transform =
  | { kind: "move"; x: string; y: string }
  | { kind: "scale"; x: string; y: string }
  | { kind: "rotate"; angle: string }
  | { kind: "skew"; x: string; y: string };

export const defaultTransforms: Record<Transform["kind"], Transform> = {
  move: { kind: "move", x: "0px", y: "0px" },
  scale: { kind: "scale", x: "1", y: "1" },
  rotate: { kind: "rotate", angle: "0deg" },
  skew: { kind: "skew", x: "0deg", y: "0deg" },
};

export function parseTransforms(value: string | undefined): Transform[] | null {
  if (!value?.trim() || value.trim() === "none") return [];
  const out: Transform[] = [];
  for (const part of splitTopLevel(value, " ")) {
    const fn = parseFunction(part);
    if (!fn) return null;
    const [a, b] = fn.args;
    switch (fn.name) {
      case "translate":
        out.push({ kind: "move", x: a ?? "0px", y: b ?? "0px" });
        break;
      case "translatex":
        out.push({ kind: "move", x: a, y: "0px" });
        break;
      case "translatey":
        out.push({ kind: "move", x: "0px", y: a });
        break;
      case "scale":
        out.push({ kind: "scale", x: a, y: b ?? a });
        break;
      case "scalex":
        out.push({ kind: "scale", x: a, y: "1" });
        break;
      case "scaley":
        out.push({ kind: "scale", x: "1", y: a });
        break;
      case "rotate":
        out.push({ kind: "rotate", angle: a });
        break;
      case "skew":
        out.push({ kind: "skew", x: a, y: b ?? "0deg" });
        break;
      case "skewx":
        out.push({ kind: "skew", x: a, y: "0deg" });
        break;
      case "skewy":
        out.push({ kind: "skew", x: "0deg", y: a });
        break;
      default:
        return null;
    }
  }
  return out;
}

export function serializeTransforms(transforms: Transform[]): string {
  return transforms
    .map((t) => {
      switch (t.kind) {
        case "move":
          return `translate(${t.x}, ${t.y})`;
        case "scale":
          return `scale(${t.x}, ${t.y})`;
        case "rotate":
          return `rotate(${t.angle})`;
        case "skew":
          return `skew(${t.x}, ${t.y})`;
      }
    })
    .join(" ");
}

/* ----------------------------------------------------------------------------------------
 * Transitions
 * -------------------------------------------------------------------------------------- */

export interface Transition {
  property: string;
  duration: string;
  easing: string;
  delay: string;
}

export const defaultTransition: Transition = { property: "all", duration: "200ms", easing: "ease", delay: "0ms" };

export function parseTransitions(value: string | undefined): Transition[] {
  if (!value?.trim() || value.trim() === "none") return [];
  return splitTopLevel(value, ",").map((layer) => {
    const t: Transition = { property: "all", duration: "0ms", easing: "ease", delay: "0ms" };
    const times: string[] = [];
    for (const p of splitTopLevel(layer, " ")) {
      if (/^-?\d*\.?\d+m?s$/.test(p)) times.push(p);
      else if (/^(ease|linear|ease-in|ease-out|ease-in-out|step-start|step-end)$/.test(p) || /^(cubic-bezier|steps)\(/.test(p)) t.easing = p;
      else t.property = p;
    }
    t.duration = times[0] ?? "0ms";
    t.delay = times[1] ?? "0ms";
    return t;
  });
}

export function serializeTransitions(list: Transition[]): string {
  return list
    .map((t) => [t.property, t.duration, t.easing, t.delay && t.delay !== "0ms" && t.delay !== "0s" ? t.delay : ""].filter(Boolean).join(" "))
    .join(", ");
}

/* ----------------------------------------------------------------------------------------
 * Filters (filter / backdrop-filter)
 * -------------------------------------------------------------------------------------- */

export interface FilterFn {
  name: string;
  value: string;
}

export const FILTERS: { name: string; label: string; unit: string; min: number; max: number; default: string }[] = [
  { name: "blur", label: "Blur", unit: "px", min: 0, max: 50, default: "4px" },
  { name: "brightness", label: "Brightness", unit: "%", min: 0, max: 200, default: "100%" },
  { name: "contrast", label: "Contrast", unit: "%", min: 0, max: 200, default: "100%" },
  { name: "grayscale", label: "Grayscale", unit: "%", min: 0, max: 100, default: "100%" },
  { name: "hue-rotate", label: "Hue rotate", unit: "deg", min: 0, max: 360, default: "90deg" },
  { name: "invert", label: "Invert", unit: "%", min: 0, max: 100, default: "100%" },
  { name: "opacity", label: "Opacity", unit: "%", min: 0, max: 100, default: "50%" },
  { name: "saturate", label: "Saturate", unit: "%", min: 0, max: 300, default: "150%" },
  { name: "sepia", label: "Sepia", unit: "%", min: 0, max: 100, default: "100%" },
];

export function parseFilters(value: string | undefined): FilterFn[] | null {
  if (!value?.trim() || value.trim() === "none") return [];
  const out: FilterFn[] = [];
  for (const part of splitTopLevel(value, " ")) {
    const fn = parseFunction(part);
    if (!fn || !FILTERS.some((f) => f.name === fn.name)) return null;
    out.push({ name: fn.name, value: fn.args[0] ?? "" });
  }
  return out;
}

export function serializeFilters(list: FilterFn[]): string {
  return list.map((f) => `${f.name}(${f.value})`).join(" ");
}

/* ----------------------------------------------------------------------------------------
 * Gradients
 * -------------------------------------------------------------------------------------- */

export interface GradientStop {
  color: string;
  position: number; // %
}

export interface Gradient {
  type: "linear" | "radial";
  angle: number; // deg, linear only
  stops: GradientStop[];
}

const SIDE_ANGLES: Record<string, number> = {
  "to top": 0,
  "to right": 90,
  "to bottom": 180,
  "to left": 270,
  "to top right": 45,
  "to right top": 45,
  "to bottom right": 135,
  "to right bottom": 135,
  "to bottom left": 225,
  "to left bottom": 225,
  "to top left": 315,
  "to left top": 315,
};

export function parseGradient(value: string): Gradient | null {
  const fn = parseFunction(value);
  if (!fn || (fn.name !== "linear-gradient" && fn.name !== "radial-gradient")) return null;
  const args = [...fn.args];
  const type = fn.name === "linear-gradient" ? "linear" : "radial";
  let angle = 180;
  if (type === "linear") {
    const first = args[0]?.trim() ?? "";
    if (/^-?\d*\.?\d+deg$/.test(first)) {
      angle = parseFloat(first);
      args.shift();
    } else if (first in SIDE_ANGLES) {
      angle = SIDE_ANGLES[first];
      args.shift();
    }
  } else if (args[0] && !/^(#|rgb|hsl|var|transparent|[a-z]+$)/.test(args[0].trim().split(" ")[0])) {
    args.shift(); // shape / position: not editable, reset to default
  } else if (args[0] && /^(circle|ellipse|closest|farthest)/.test(args[0].trim())) {
    args.shift();
  }
  const stops = args.map((arg, i) => {
    const parts = splitTopLevel(arg, " ");
    const pos = parts.length > 1 ? parseFloat(parts[parts.length - 1]) : NaN;
    return {
      color: parts.length > 1 && !Number.isNaN(pos) ? parts.slice(0, -1).join(" ") : arg.trim(),
      position: Number.isNaN(pos) ? (args.length > 1 ? (i / (args.length - 1)) * 100 : 0) : pos,
    };
  });
  if (stops.length < 2) return null;
  return { type, angle, stops };
}

export function serializeGradient(g: Gradient): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${Math.round(s.position * 10) / 10}%`)
    .join(", ");
  return g.type === "linear" ? `linear-gradient(${Math.round(g.angle)}deg, ${stops})` : `radial-gradient(circle, ${stops})`;
}

/* ----------------------------------------------------------------------------------------
 * Background layers (background-image + matching size/position/repeat lists)
 * -------------------------------------------------------------------------------------- */

export interface BackgroundLayer {
  /** A `url(...)`, a gradient, or any other image value. */
  image: string;
  size: string;
  position: string;
  repeat: string;
}

export function layerKind(image: string): "image" | "linear" | "radial" | "other" {
  const v = image.trim().toLowerCase();
  if (v.startsWith("url(") || v === "none") return "image";
  if (v.startsWith("linear-gradient(")) return "linear";
  if (v.startsWith("radial-gradient(")) return "radial";
  return "other";
}

export function imageUrl(image: string): string {
  const fn = parseFunction(image);
  return fn?.name === "url" ? (fn.args[0] ?? "").replace(/^["']|["']$/g, "") : "";
}

/** An image layer without a URL yet is stored as `none` (an empty url() would request the page itself). */
export function urlImage(url: string): string {
  const clean = url.replace(/["\\]/g, "").trim();
  return clean ? `url("${clean}")` : "none";
}

export function parseBackgroundLayers(bg: {
  image?: string;
  size?: string;
  position?: string;
  repeat?: string;
}): BackgroundLayer[] {
  if (!bg.image?.trim()) return [];
  // A lone `none` is "no background" unless the layer lists say it's an image layer awaiting its URL.
  if (bg.image.trim() === "none" && !bg.size && !bg.position && !bg.repeat) return [];
  const images = splitTopLevel(bg.image, ",");
  const list = (v: string | undefined) => (v ? splitTopLevel(v, ",") : []);
  const sizes = list(bg.size);
  const positions = list(bg.position);
  const repeats = list(bg.repeat);
  // CSS repeats shorter lists, so mirror that when reading.
  const at = (arr: string[], i: number, fallback: string) => (arr.length ? arr[i % arr.length] : fallback);
  return images.map((image, i) => ({
    image,
    size: at(sizes, i, "auto"),
    position: at(positions, i, "0% 0%"),
    repeat: at(repeats, i, "repeat"),
  }));
}

export function serializeBackgroundLayers(layers: BackgroundLayer[]): {
  image: string | undefined;
  size: string | undefined;
  position: string | undefined;
  repeat: string | undefined;
} {
  if (!layers.length) return { image: undefined, size: undefined, position: undefined, repeat: undefined };
  const join = (key: keyof BackgroundLayer) => layers.map((l) => l[key]).join(", ");
  return { image: join("image"), size: join("size"), position: join("position"), repeat: join("repeat") };
}
