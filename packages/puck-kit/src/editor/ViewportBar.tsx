"use client";

import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { coverageVars, coveredBy, defaultBreakpoints, rangeLabel, sortBreakpoints, type Breakpoint } from "../breakpoints";
import { useActiveBreakpoint } from "../fields/StylePanel";
import ui from "../fields/ui/ui.module.css";
import css from "./ViewportBar.module.css";

const ICONS: Record<string, ComponentType<{ size?: number }>> = { Smartphone, Tablet, Laptop, Monitor };

/**
 * Breakpoint switcher for Puck's header (replaces the viewport controls Puck renders above the
 * canvas). Zoom is left to Puck's auto-zoom, which fits the frame to the canvas.
 */
export function ViewportBar({ breakpoints = defaultBreakpoints }: { breakpoints?: Breakpoint[] }) {
  const bps = sortBreakpoints(breakpoints);
  const [active, setActive] = useActiveBreakpoint(bps);
  const covered = new Set(coveredBy(bps, active.key).map((bp) => bp.key));
  return (
    <div className={`${ui.theme} ${css.bar}`} role="group" aria-label="Breakpoint">
      {/* Left of the buttons: the header is right-aligned, so a longer label moves nothing else. */}
      <span className={css.label}>
        <strong>{active.label}</strong> {active.viewport}px
      </span>
      <div className={css.buttons} style={coverageVars(bps, active.key) as CSSProperties}>
        {bps.map((bp) => {
          const Icon = ICONS[bp.icon ?? "Monitor"] ?? Monitor;
          return (
            <button
              key={bp.key}
              type="button"
              className={css.button}
              aria-pressed={bp.key === active.key}
              data-covered={(bp.key !== active.key && covered.has(bp.key)) || undefined}
              aria-label={bp.label}
              title={`${bp.label} — ${bp.viewport}px (${rangeLabel(bp) === "base" ? "base styles, inherited by all" : `styles at ${rangeLabel(bp)}`})`}
              onClick={() => setActive(bp)}
            >
              <Icon size={15} />
            </button>
          );
        })}
        {/* Styles set on the active breakpoint also apply to the ones that inherit from it. */}
        <span className={css.coverage} aria-hidden />
      </div>
    </div>
  );
}

/** Wraps the editor so its chrome tweaks (no canvas gutter, hidden in-canvas controls) stay scoped. */
export function EditorChrome({ children }: { children: ReactNode }) {
  return <div className={css.chrome}>{children}</div>;
}
