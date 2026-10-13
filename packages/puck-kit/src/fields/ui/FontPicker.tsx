"use client";

import { Check, ChevronDown, Plus, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "../../components/shared";
import { useKitEditor } from "../../editor/context";
import { FontLinks } from "../../fonts/FontLinks";
import { findFont, firstFamily, fontLabel, fontStack, fontWeights, systemFonts } from "../../fonts/stack";
import type { FontDefinition } from "../../fonts/types";
import { tokenRef, type Tokens } from "../../styles/tokens";
import { Popover, usePopover } from "./Popover";
import css from "./FontPicker.module.css";
import ui from "./ui.module.css";

interface FontOption {
  value: string;
  label: string;
  /** CSS font-family used to preview the option. */
  preview: string;
  hint?: string;
  group: string;
  empty?: boolean;
}

/** Resolve a font-family value (stack or font token reference) to the font it uses. */
export function resolveFont(value: string | undefined, tokens: Tokens | undefined, library: FontDefinition[]) {
  const token = tokens?.fonts?.find((t) => tokenRef("fonts", t.name) === value);
  const stack = token ? token.value : value;
  return { token, stack, font: findFont(stack, [...library, ...systemFonts]) };
}

/**
 * Font chooser: searchable list of font tokens (optional), the configured font library and
 * system fonts, each previewed in its own face. "Add fonts" calls the integrator's callback.
 * Values are stored as CSS stacks (`"Inter", sans-serif`) or token references.
 */
export function FontPicker({
  value,
  inherited,
  onChange,
  tokens,
  clearable = true,
  readOnly,
  placeholder = "Inherit",
  "aria-label": ariaLabel = "Font",
}: {
  value: string | undefined;
  inherited?: string;
  onChange: (value: string | undefined) => void;
  /** Offer font tokens first (element styles). Omit inside the token editor. */
  tokens?: Tokens;
  clearable?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const { fonts: library, onAddFonts, addFontsLabel } = useKitEditor();
  const pop = usePopover();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const effective = value ?? inherited;
  const current = resolveFont(effective, tokens, library);

  const options = useMemo(() => {
    const out: FontOption[] = [];
    for (const t of tokens?.fonts?.filter((x) => x.name) ?? []) {
      const f = findFont(t.value, [...library, ...systemFonts]);
      out.push({ value: tokenRef("fonts", t.name), label: t.name, preview: t.value, hint: f ? fontLabel(f) : undefined, group: "Tokens" });
    }
    for (const f of library) {
      out.push({
        value: fontStack(f),
        label: fontLabel(f),
        preview: fontStack(f),
        hint: f.source.type === "files" ? "Uploaded" : `${fontWeights(f).length} weight${fontWeights(f).length > 1 ? "s" : ""}`,
        group: "Your fonts",
      });
    }
    for (const f of systemFonts) out.push({ value: fontStack(f), label: fontLabel(f), preview: fontStack(f), group: "System" });
    return out;
  }, [tokens, library]);

  // The option matching the current value (tokens by reference, fonts by family name).
  const selectedValue = !value
    ? undefined
    : options.find((o) => o.value === value)?.value ??
      (() => {
        const f = findFont(value, [...library, ...systemFonts]);
        return f ? fontStack(f) : value;
      })();
  const unknown = !!value && !options.some((o) => o.value === selectedValue);

  const inheritedInfo = inherited ? resolveFont(inherited, tokens, library) : undefined;
  const inheritedLabel = inheritedInfo?.token?.name ?? (inheritedInfo?.font ? fontLabel(inheritedInfo.font) : inherited);
  const q = query.trim().toLowerCase();
  const visible: FontOption[] = [
    ...(clearable && !q
      ? [{ value: "", label: inherited ? `Inherit · ${inheritedLabel}` : "Default", preview: "inherit", group: "", empty: true }]
      : []),
    ...(unknown && !q ? [{ value: value!, label: `Custom: ${firstFamily(value) ?? value}`, preview: value!, group: "Current" }] : []),
    ...options.filter((o) => !q || o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)),
  ];

  useEffect(() => {
    if (!pop.open) return;
    setQuery("");
    const i = visible.findIndex((o) => (o.empty ? !value : o.value === selectedValue));
    setActive(Math.max(0, i));
    requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (o: FontOption | undefined) => {
    if (!o) return;
    onChange(o.empty ? undefined : o.value);
    pop.close();
    pop.anchorRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((i) => Math.min(visible.length - 1, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Enter") pick(visible[active]);
    else return;
    e.preventDefault();
  };

  const triggerLabel = current.token?.name ?? (current.font ? fontLabel(current.font) : effective ? `Custom: ${firstFamily(effective)}` : placeholder);
  let lastGroup = "";

  return (
    <>
      <FontLinks fonts={library} />
      <button
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        type="button"
        className={ui.dropdown}
        data-state={value ? "set" : inherited ? "inherited" : "empty"}
        aria-haspopup="listbox"
        aria-expanded={pop.open}
        aria-label={ariaLabel}
        disabled={readOnly}
        onClick={pop.toggle}
      >
        <span className={css.triggerSample} style={{ fontFamily: current.stack }}>
          Aa
        </span>
        <span className={ui.dropdownLabel}>{triggerLabel}</span>
        <ChevronDown size={12} className={ui.dropdownChevron} />
      </button>
      <Popover state={pop} width={280} placement="below" bodyClassName={css.body}>
        <label className={css.search}>
          <Search size={13} />
          <input
            ref={searchRef}
            value={query}
            placeholder="Search fonts"
            aria-label="Search fonts"
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
        </label>
        <div ref={listRef} role="listbox" className={css.list} aria-label="Fonts">
          {visible.length === 0 && <div className={css.empty}>No font matches “{query}”.</div>}
          {visible.map((o, i) => {
            const header = o.group && o.group !== lastGroup ? o.group : undefined;
            lastGroup = o.group;
            const selected = o.empty ? !value : o.value === selectedValue;
            return (
              <div key={`${o.group}:${o.value}`}>
                {header && <div className={ui.menuGroup}>{header}</div>}
                <div
                  role="option"
                  data-index={i}
                  aria-selected={selected}
                  className={cx(css.option, i === active && css.active)}
                  onPointerMove={() => setActive(i)}
                  onClick={() => pick(o)}
                >
                  {o.empty ? (
                    <RotateCcw size={12} className={css.resetIcon} />
                  ) : (
                    <span className={css.sample} style={{ fontFamily: o.preview }}>
                      Aa
                    </span>
                  )}
                  <span className={css.name} style={o.empty ? undefined : { fontFamily: o.preview }}>
                    {o.label}
                  </span>
                  {o.hint && <span className={css.hint}>{o.hint}</span>}
                  <Check size={13} className={css.check} />
                </div>
              </div>
            );
          })}
        </div>
        {onAddFonts && (
          <button
            type="button"
            className={css.add}
            onClick={() => {
              pop.close();
              onAddFonts();
            }}
          >
            <Plus size={14} /> {addFontsLabel}
          </button>
        )}
      </Popover>
    </>
  );
}
