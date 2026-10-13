"use client";

import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "../../components/shared";
import ui from "./ui.module.css";

export interface PopoverState {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  toggle: () => void;
  show: () => void;
  close: () => void;
}

export function usePopover(): PopoverState {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  return {
    open,
    anchorRef,
    toggle: useCallback(() => setOpen((o) => !o), []),
    show: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
  };
}

// Open popovers, innermost last: Escape closes only the top one.
const stack: symbol[] = [];

const GAP = 8;
const MARGIN = 8;

/**
 * Floating panel portaled to <body>. Opens to the left of its anchor (the style panel lives in
 * Puck's right sidebar), falling back to below it. Closes on outside click and Escape.
 * Nested popovers count as "inside" their parent: React events bubble through portals.
 */
export function Popover({
  state,
  title,
  width: widthProp = 248,
  placement = "side",
  children,
  bodyClassName,
  className,
}: {
  state: PopoverState;
  title?: ReactNode;
  /** Pixel width, or `"anchor"` to match the trigger (at least 160px). */
  width?: number | "anchor";
  /** `side`: next to the panel (editors). `below`: under the trigger (menus). */
  placement?: "side" | "below";
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const insideRef = useRef(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const { open, anchorRef, close } = state;

  const [anchorWidth, setAnchorWidth] = useState(0);
  const width = widthProp === "anchor" ? Math.max(160, anchorWidth) : widthProp;

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const el = ref.current;
    if (!anchor || !el) return;
    const a = anchor.getBoundingClientRect();
    if (widthProp === "anchor") setAnchorWidth(a.width);
    if (placement === "below") {
      const w = widthProp === "anchor" ? Math.max(160, a.width) : widthProp;
      const h = el.offsetHeight;
      let top = a.bottom + 4;
      if (top + h > window.innerHeight - MARGIN && a.top - 4 - h > MARGIN) top = a.top - 4 - h;
      const left = Math.min(Math.max(MARGIN, a.left), window.innerWidth - w - MARGIN);
      setPos({ top: Math.max(MARGIN, top), left });
      return;
    }
    // Sit next to the whole panel (or the parent popover), like Webflow, not over it.
    const side = (anchor.closest("[data-pk-panel]") ?? anchor).getBoundingClientRect();
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = side.left - width - GAP;
    let top = a.top - 8;
    if (left < MARGIN) {
      left = Math.min(Math.max(MARGIN, a.right - width), vw - width - MARGIN);
      top = a.bottom + GAP;
      if (top + h > vh - MARGIN && a.top - GAP - h > MARGIN) top = a.top - GAP - h;
    }
    top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - h - MARGIN));
    setPos({ top, left });
  }, [anchorRef, width, widthProp, placement]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const id = Symbol("popover");
    stack.push(id);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || stack[stack.length - 1] !== id) return;
      e.stopPropagation();
      close();
      anchorRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      stack.splice(stack.indexOf(id), 1);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, close, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const inside = insideRef.current;
      insideRef.current = false;
      if (inside || anchorRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      data-pk-panel=""
      aria-label={typeof title === "string" ? title : undefined}
      className={cx(ui.theme, ui.popover, className)}
      style={{ width, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      onPointerDownCapture={() => {
        insideRef.current = true;
      }}
    >
      {title !== undefined && (
        <div className={ui.popoverHeader}>
          <span>{title}</span>
          <button type="button" className={ui.iconButton} onClick={close} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      )}
      <div className={cx(ui.popoverBody, bodyClassName)}>{children}</div>
    </div>,
    document.body,
  );
}

/** Small menu of actions in a popover (e.g. "Add layer"). */
export function MenuPopover({
  state,
  items,
  width = 180,
}: {
  state: PopoverState;
  items: { label: string; icon?: ReactNode; onSelect: () => void }[];
  width?: number;
}) {
  return (
    <Popover state={state} width={width} placement="below" bodyClassName={ui.menu}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={ui.menuItem}
          onClick={() => {
            item.onSelect();
            state.close();
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </Popover>
  );
}
