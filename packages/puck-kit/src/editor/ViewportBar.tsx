"use client";

import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { defaultBreakpoints, sortBreakpoints, type Breakpoint } from "../breakpoints";
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
  const index = bps.findIndex((bp) => bp.key === active.key);
  return (
    <div className={`${ui.theme} ${css.bar}`} role="group" aria-label="Breakpoint">
      {/* Left of the buttons: the header is right-aligned, so a longer label moves nothing else. */}
      <span className={css.label}>
        <strong>{active.label}</strong> {active.viewport}px
      </span>
      <div className={css.buttons} style={{ "--pk-bp-index": index, "--pk-bp-count": bps.length } as CSSProperties}>
        {bps.map((bp, i) => {
          const Icon = ICONS[bp.icon ?? "Monitor"] ?? Monitor;
          return (
            <button
              key={bp.key}
              type="button"
              className={css.button}
              aria-pressed={bp.key === active.key}
              data-covered={i > index || undefined}
              aria-label={bp.label}
              title={`${bp.label} — ${bp.viewport}px${bp.minWidth ? ` (styles from ${bp.minWidth}px)` : " (base styles)"}`}
              onClick={() => setActive(bp)}
            >
              <Icon size={15} />
            </button>
          );
        })}
        {/* Mobile-first: styles set on the active breakpoint also apply to every larger one. */}
        <span className={css.coverage} aria-hidden />
      </div>
    </div>
  );
}

/** Wraps the editor so its chrome tweaks (no canvas gutter, hidden in-canvas controls) stay scoped. */
export function EditorChrome({ children }: { children: ReactNode }) {
  return <div className={css.chrome}>{children}</div>;
}
