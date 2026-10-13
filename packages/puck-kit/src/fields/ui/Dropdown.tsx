"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../../components/shared";
import { Popover, usePopover, type PopoverState } from "./Popover";
import ui from "./ui.module.css";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  /** Small text on the right (e.g. a token's value). */
  hint?: string;
  /** Options with the same group are listed under a header. */
  group?: string;
}

/**
 * The list part of a dropdown, in a popover under its trigger. Keyboard: ↑ ↓ Home End to move,
 * Enter/Space to pick, Escape to close, letters to jump.
 */
export function DropdownMenu({
  state,
  options,
  value,
  onSelect,
  width = "anchor",
  emptyLabel,
}: {
  state: PopoverState;
  options: DropdownOption[];
  value: string | undefined;
  onSelect: (value: string | undefined) => void;
  width?: number | "anchor";
  /** Adds a first option that clears the value. */
  emptyLabel?: string;
}) {
  const all: (DropdownOption & { empty?: boolean })[] = emptyLabel
    ? [{ value: "", label: emptyLabel, empty: true, icon: <RotateCcw size={12} /> }, ...options]
    : options;
  const selectedIndex = Math.max(0, all.findIndex((o) => (o.empty ? !value : o.value === value)));
  const [active, setActive] = useState(selectedIndex);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.open) return;
    setActive(selectedIndex);
    // Focus after the popover has been positioned.
    requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (i: number) => {
    const o = all[i];
    if (!o) return;
    onSelect(o.empty ? undefined : o.value);
    state.close();
    state.anchorRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const last = all.length - 1;
    if (e.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Tab") state.close();
    else if (e.key.length === 1) {
      const start = (active + 1) % all.length;
      const order = [...all.slice(start), ...all.slice(0, start)];
      const hit = order.find((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (hit) setActive(all.indexOf(hit));
      return;
    } else return;
    e.preventDefault();
  };

  let lastGroup: string | undefined;
  return (
    <Popover state={state} width={width} placement="below" bodyClassName={ui.menu}>
      <div
        ref={listRef}
        role="listbox"
        tabIndex={-1}
        className={ui.listbox}
        aria-activedescendant={`opt-${active}`}
        onKeyDown={onKeyDown}
      >
        {all.map((o, i) => {
          const header = o.group && o.group !== lastGroup ? o.group : undefined;
          lastGroup = o.group;
          const selected = o.empty ? !value : o.value === value;
          return (
            <div key={`${o.group ?? ""}:${o.value}:${i}`}>
              {header && <div className={ui.menuGroup}>{header}</div>}
              <div
                id={`opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                className={cx(ui.option, i === active && ui.optionActive, o.empty && ui.optionEmpty)}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(i)}
              >
                <span className={ui.optionIcon}>{o.icon}</span>
                <span className={ui.optionLabel}>{o.label}</span>
                {o.hint && <span className={ui.optionHint}>{o.hint}</span>}
                <Check size={13} className={ui.optionCheck} />
              </div>
            </div>
          );
        })}
      </div>
    </Popover>
  );
}

/** A select replacement: trigger shows the icon + label of the current (or inherited) value. */
export function Dropdown({
  value,
  inherited,
  options,
  onChange,
  placeholder = "—",
  clearable = true,
  readOnly,
  menuWidth,
  "aria-label": ariaLabel,
}: {
  value: string | undefined;
  inherited?: string;
  options: DropdownOption[];
  onChange: (value: string | undefined) => void;
  /** Shown when nothing is set or inherited; also the label of the "clear" option. */
  placeholder?: string;
  clearable?: boolean;
  readOnly?: boolean;
  menuWidth?: number | "anchor";
  "aria-label"?: string;
}) {
  const pop = usePopover();
  const effective = value ?? inherited;
  const current = options.find((o) => o.value === effective);
  const state = value ? "set" : inherited ? "inherited" : "empty";
  return (
    <>
      <button
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        type="button"
        className={ui.dropdown}
        data-state={state}
        aria-haspopup="listbox"
        aria-expanded={pop.open}
        aria-label={ariaLabel}
        disabled={readOnly}
        onClick={pop.toggle}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            pop.show();
          }
        }}
      >
        {current?.icon && <span className={ui.optionIcon}>{current.icon}</span>}
        <span className={ui.dropdownLabel}>{current?.label ?? effective ?? placeholder}</span>
        <ChevronDown size={12} className={ui.dropdownChevron} />
      </button>
      <DropdownMenu
        state={pop}
        options={value && !current ? [...options, { value, label: value }] : options}
        value={value}
        onSelect={onChange}
        width={menuWidth}
        emptyLabel={clearable ? (inherited ? `Inherit · ${current?.label ?? inherited}` : "Default") : undefined}
      />
    </>
  );
}
