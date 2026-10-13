"use client";

import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  Keyboard,
  MousePointer2,
  MousePointerClick,
  Rows2,
  Rows3,
  SquareDashedMousePointer,
  TextCursorInput,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Breakpoint } from "../breakpoints";
import { styleKey, type StyleState } from "../styles/states";
import type { Styles } from "../styles/types";
import css from "./StylePanel.module.css";
import { DropdownMenu } from "./ui/Dropdown";
import { usePopover } from "./ui/Popover";
import ui from "./ui/ui.module.css";

const ICONS: Record<string, ReactNode> = {
  hover: <MousePointer2 size={13} />,
  "focus-visible": <Keyboard size={13} />,
  focus: <TextCursorInput size={13} />,
  "focus-within": <SquareDashedMousePointer size={13} />,
  active: <MousePointerClick size={13} />,
  "first-child": <ArrowUpToLine size={13} />,
  "last-child": <ArrowDownToLine size={13} />,
  odd: <Rows3 size={13} />,
  even: <Rows2 size={13} />,
};

/**
 * "State: None ▾" — picks the pseudo-class being styled. Kept separate from the breakpoint bar
 * so a future class selector can sit next to it (Webflow's "Selector · State" row).
 */
export function StateBar({
  states,
  styles,
  breakpoint,
  value,
  onChange,
}: {
  states: StyleState[];
  styles: Styles;
  breakpoint: Breakpoint;
  value: string | undefined;
  onChange: (state: string | undefined) => void;
}) {
  const menu = usePopover();
  const current = states.find((s) => s.key === value);
  const count = (state?: string) => Object.keys(styles[styleKey(breakpoint.key, state)] ?? {}).length;

  return (
    <div className={css.stateBar} data-active={!!current}>
      <button
        ref={(el) => {
          menu.anchorRef.current = el;
        }}
        type="button"
        className={css.stateTrigger}
        aria-haspopup="listbox"
        aria-expanded={menu.open}
        onClick={menu.toggle}
      >
        <span className={css.stateLabel}>State</span>
        {current ? ICONS[current.key] : null}
        <strong>{current?.label ?? "None"}</strong>
        <ChevronDown size={12} className={ui.dropdownChevron} />
      </button>
      {current && (
        <button type="button" className={ui.iconButton} title="Back to the normal state" aria-label="Clear state" onClick={() => onChange(undefined)}>
          <X size={13} />
        </button>
      )}
      <DropdownMenu
        state={menu}
        width={250}
        value={value}
        emptyLabel="None"
        onSelect={onChange}
        options={states.map((s, i) => ({
          value: s.key,
          label: s.label,
          icon: ICONS[s.key],
          hint: count(s.key) ? `${count(s.key)} set` : s.selector,
          group: i < 5 ? "Interaction" : "Structure",
        }))}
      />
    </div>
  );
}
