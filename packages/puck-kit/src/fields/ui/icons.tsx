/** Small custom icons for values lucide doesn't cover. 14×14, currentColor. */

const box = { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;

/** A rectangle with the given aspect ratio (w / h). */
export function RatioIcon({ ratio }: { ratio: number }) {
  const max = 12;
  const w = ratio >= 1 ? max : max * ratio;
  const h = ratio >= 1 ? max / ratio : max;
  return (
    <svg {...box} aria-hidden>
      <rect x={(14 - w) / 2} y={(14 - h) / 2} width={w} height={h} rx={1.5} />
    </svg>
  );
}

/** object-fit: a frame (dashed) and how a landscape image sits inside it. */
export function FitIcon({ fit }: { fit: "fill" | "contain" | "cover" | "none" | "scale-down" }) {
  const img = {
    fill: { x: 2, y: 2, w: 10, h: 10 },
    contain: { x: 2, y: 4.5, w: 10, h: 5 },
    cover: { x: -1, y: 2, w: 16, h: 10 },
    none: { x: 4, y: 5.5, w: 6, h: 3 },
    "scale-down": { x: 3, y: 5, w: 8, h: 4 },
  }[fit];
  return (
    <svg {...box} aria-hidden>
      <defs>
        <clipPath id={`fit-${fit}`}>
          <rect x={2} y={2} width={10} height={10} />
        </clipPath>
      </defs>
      <rect x={2} y={2} width={10} height={10} strokeDasharray="2 1.5" strokeWidth={1} />
      <rect x={img.x} y={img.y} width={img.w} height={img.h} fill="currentColor" fillOpacity={0.35} stroke="none" clipPath={`url(#fit-${fit})`} />
    </svg>
  );
}

const BEZIERS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/** The curve of a CSS easing function. */
export function EasingIcon({ easing }: { easing: string }) {
  const m = /cubic-bezier\(([^)]+)\)/.exec(easing);
  const p = m ? (m[1].split(",").map(Number) as [number, number, number, number]) : BEZIERS[easing] ?? BEZIERS.ease;
  const X = (x: number) => 2 + x * 10;
  const Y = (y: number) => 12 - y * 10;
  return (
    <svg {...box} aria-hidden>
      <path d={`M${X(0)} ${Y(0)} C${X(p[0])} ${Y(p[1])} ${X(p[2])} ${Y(p[3])} ${X(1)} ${Y(1)}`} strokeLinecap="round" />
    </svg>
  );
}

/** "Aa" rendered with a font weight or family. */
export function SampleIcon({ weight, family }: { weight?: string; family?: string }) {
  return (
    <span aria-hidden style={{ fontWeight: weight, fontFamily: family, fontSize: 12, lineHeight: 1, color: "var(--pk-ui-text)" }}>
      Aa
    </span>
  );
}
