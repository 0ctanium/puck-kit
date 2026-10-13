"use client";

import { useRef, type PointerEvent } from "react";
import { formatNumber, parseLength } from "../css/split";

/**
 * Drag horizontally on an element to change a numeric value (like Webflow/Figma labels).
 * Returns pointer handlers; a click without movement is left alone.
 */
export function useScrub({
  value,
  fallback,
  onChange,
  step = 1,
  min,
  max,
  defaultUnit = "px",
  disabled,
}: {
  value: string | undefined;
  /** Value to start from when nothing is set (e.g. the inherited value). */
  fallback?: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  defaultUnit?: string;
  disabled?: boolean;
}) {
  const start = useRef<{ x: number; num: number; unit: string; moved: boolean } | null>(null);
  const parsed = parseLength(value) ?? parseLength(fallback);
  const enabled = !disabled && (parsed !== null || (value ?? fallback ?? "") === "");

  return {
    enabled,
    /** True right after a drag, so callers can ignore the trailing click. */
    consumeDrag: () => {
      const moved = start.current?.moved ?? false;
      start.current = null;
      return moved;
    },
    handlers: enabled
      ? {
          onPointerDown: (e: PointerEvent<HTMLElement>) => {
            if (e.button !== 0) return;
            start.current = {
              x: e.clientX,
              num: parsed?.num ?? 0,
              unit: parsed?.unit ?? defaultUnit,
              moved: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          },
          onPointerMove: (e: PointerEvent<HTMLElement>) => {
            const s = start.current;
            if (!s || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const dx = e.clientX - s.x;
            if (!s.moved && Math.abs(dx) < 3) return;
            s.moved = true;
            const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
            let next = s.num + Math.round(dx / 2) * step * mult;
            if (min !== undefined) next = Math.max(min, next);
            if (max !== undefined) next = Math.min(max, next);
            onChange(`${formatNumber(next)}${s.unit}`);
          },
          onPointerUp: (e: PointerEvent<HTMLElement>) => {
            e.currentTarget.releasePointerCapture?.(e.pointerId);
          },
        }
      : {},
  };
}
