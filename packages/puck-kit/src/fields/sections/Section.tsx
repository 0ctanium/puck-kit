"use client";

import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import s from "./sections.module.css";

// Open/closed state survives selecting another component.
const openState = new Map<string, boolean>();

export function Section({
  id,
  title,
  icon,
  props,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  /** Properties edited here, for the "set at this breakpoint" counter. */
  props: StyleProp[];
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const panel = usePanel();
  const [open, setOpen] = useState(() => openState.get(id) ?? defaultOpen);
  const decl = panel.styles[panel.key] ?? {};
  const count = props.filter((p) => decl[p] !== undefined).length;

  return (
    <section className={s.section} data-open={open}>
      <button
        type="button"
        className={s.header}
        aria-expanded={open}
        onClick={() => {
          openState.set(id, !open);
          setOpen(!open);
        }}
      >
        <ChevronRight size={14} className={s.chevron} />
        <span>{title}</span>
        {count > 0 && (
          <em className={s.count} title={`${count} set on ${panel.active.label}`}>
            {count}
          </em>
        )}
        <span className={s.headerIcon} style={{ flex: "none", display: "inline-flex" }}>
          {icon}
        </span>
      </button>
      {open && <div className={s.body}>{children}</div>}
    </section>
  );
}
