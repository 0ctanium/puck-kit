"use client";

import { Plus, Trash } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { StyleProp } from "../../styles/types";
import { usePanel } from "../context";
import { MenuPopover, Popover, usePopover } from "./Popover";
import { PropLabel } from "./inputs";
import ui from "./ui.module.css";

function LayerItem({
  preview,
  label,
  title,
  editor,
  onRemove,
  readOnly,
  autoOpen,
  onAutoOpened,
}: {
  preview: ReactNode;
  label: ReactNode;
  title: string;
  editor: ReactNode;
  onRemove: () => void;
  readOnly: boolean;
  /** Open the editor on mount (freshly added layer). */
  autoOpen?: boolean;
  onAutoOpened?: () => void;
}) {
  const pop = usePopover();
  const { show } = pop;
  useEffect(() => {
    if (!autoOpen) return;
    show();
    onAutoOpened?.();
  }, [autoOpen, show, onAutoOpened]);
  return (
    <>
      <div
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        className={ui.listItem}
        data-open={pop.open}
        role="button"
        tabIndex={0}
        onClick={pop.toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pop.toggle();
          }
        }}
      >
        <span className={ui.listIcon}>{preview}</span>
        <span className={ui.listItemLabel}>{label}</span>
        {!readOnly && (
          <button
            type="button"
            className={ui.iconButton}
            title="Remove"
            aria-label="Remove"
            onClick={(e) => {
              e.stopPropagation();
              pop.close();
              onRemove();
            }}
          >
            <Trash size={13} />
          </button>
        )}
      </div>
      <Popover state={pop} title={title}>
        {editor}
      </Popover>
    </>
  );
}

/**
 * A list of layers stored in one or more CSS properties (shadows, transforms, filters,
 * background layers...). Each item opens an editor popover; "+" adds one (or opens a menu).
 */
export function LayerList<T>({
  label,
  props,
  items,
  onChange,
  add,
  renderPreview,
  renderLabel,
  renderEditor,
  itemTitle,
}: {
  label: string;
  props: StyleProp[];
  items: T[];
  onChange: (items: T[]) => void;
  /** A single factory, or a menu of choices. */
  add: (() => T) | { label: string; icon?: ReactNode; create: () => T }[];
  renderPreview: (item: T) => ReactNode;
  renderLabel: (item: T) => ReactNode;
  renderEditor: (item: T, update: (item: T) => void) => ReactNode;
  itemTitle: (item: T) => string;
}) {
  const panel = usePanel();
  const menu = usePopover();
  const [added, setAdded] = useState<number | null>(null);
  const addItem = (item: T) => {
    setAdded(items.length);
    onChange([...items, item]);
  };

  return (
    <div>
      <div className={ui.listHeader}>
        <PropLabel label={label} props={props} />
        {!panel.readOnly && (
          <button
            ref={(el) => {
              menu.anchorRef.current = el;
            }}
            type="button"
            className={ui.iconButton}
            title={`Add ${label.toLowerCase()}`}
            aria-label={`Add ${label.toLowerCase()}`}
            onClick={() => (typeof add === "function" ? addItem(add()) : menu.toggle())}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      {typeof add !== "function" && (
        <MenuPopover
          state={menu}
          items={add.map((a) => ({ label: a.label, icon: a.icon, onSelect: () => addItem(a.create()) }))}
        />
      )}
      {items.length > 0 && (
        <div className={ui.list}>
          {items.map((item, i) => (
            <LayerItem
              key={i}
              preview={renderPreview(item)}
              label={renderLabel(item)}
              title={itemTitle(item)}
              readOnly={panel.readOnly}
              autoOpen={added === i}
              onAutoOpened={() => setAdded(null)}
              editor={renderEditor(item, (next) => onChange(items.map((it, j) => (j === i ? next : it))))}
              onRemove={() => {
                setAdded(null);
                onChange(items.filter((_, j) => j !== i));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
