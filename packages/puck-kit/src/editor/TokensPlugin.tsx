"use client";

import { createUsePuck, type Data } from "@puckeditor/core";
import { Palette, Plus, Ruler, Trash, Type } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "../components/shared";
import { Swatch, ColorPicker } from "../fields/ui/ColorPicker";
import { Popover, usePopover } from "../fields/ui/Popover";
import { FontPicker } from "../fields/ui/FontPicker";
import { UnitInput } from "../fields/ui/inputs";
import { FontLinks } from "../fonts/FontLinks";
import { findFont, fontLabel, fontStack, fontWeights, systemFonts } from "../fonts/stack";
import { useKitEditor } from "./context";
import ui from "../fields/ui/ui.module.css";
import { countTokenUsage, replaceTokenRefs } from "../styles/tokenRefs";
import type { FontDefinition } from "../fonts/types";
import { slug, tokenRef, tokenVar, type Token, type TokenKind, type Tokens } from "../styles/tokens";
import css from "./TokensPlugin.module.css";

const usePuck = createUsePuck();

const KINDS: { kind: TokenKind; label: string; singular: string; icon: ReactNode; fresh: (n: number) => Token }[] = [
  { kind: "colors", label: "Colors", singular: "color", icon: <Palette size={14} />, fresh: (n) => ({ name: `Color ${n}`, value: "#4f46e5" }) },
  { kind: "fonts", label: "Fonts", singular: "font", icon: <Type size={14} />, fresh: (n) => ({ name: `Font ${n}`, value: "system-ui, sans-serif" }) },
  { kind: "sizes", label: "Sizes", singular: "size", icon: <Ruler size={14} />, fresh: (n) => ({ name: `Size ${n}`, value: "16px" }) },
];


// Selected tab survives closing the panel.
let lastTab: TokenKind = "colors";

/* ---------------------------------------------------------------- Data access */

function useTokens() {
  const rootProps = usePuck((s) => (s.appState.data.root?.props ?? s.appState.data.root ?? {}) as Record<string, unknown>);
  const content = usePuck((s) => s.appState.data.content);
  const zones = usePuck((s) => s.appState.data.zones);
  const dispatch = usePuck((s) => s.dispatch);
  const tokens = (rootProps.tokens ?? {}) as Tokens;
  const data = useMemo(() => ({ content, zones, root: { props: rootProps } }) as Partial<Data>, [content, zones, rootProps]);

  const withTokens = (d: Data, next: Tokens): Data => {
    const root = d.root as { props?: Record<string, unknown> };
    return { ...d, root: { ...root, props: { ...(root.props ?? {}), tokens: next } } } as Data;
  };

  return {
    tokens,
    usage: (kind: TokenKind, name: string) => countTokenUsage(data, tokenVar(kind, name)),
    /** Replace one kind's list. */
    setList: (kind: TokenKind, list: Token[]) =>
      dispatch({ type: "setData", data: (prev) => withTokens(prev, { ...tokens, [kind]: list }) }),
    /** Change a token and rewrite every `var(--old)` to `replacement` in one undo step. */
    setListAndRefs: (kind: TokenKind, list: Token[], oldName: string, replacement: string) =>
      dispatch({
        type: "setData",
        data: (prev) => withTokens(replaceTokenRefs(prev, tokenVar(kind, oldName), replacement), { ...tokens, [kind]: list }),
      }),
  };
}

/* ---------------------------------------------------------------- Rows */

function NameInput({
  value,
  taken,
  autoFocus,
  onCommit,
}: {
  value: string;
  /** Slugs used by other tokens of the same kind. */
  taken: Set<string>;
  autoFocus?: boolean;
  onCommit: (name: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (autoFocus) ref.current?.select();
  }, [autoFocus]);
  const s = slug(local);
  const error = !s ? "Name required" : taken.has(s) ? "Name already used" : undefined;
  const commit = () => {
    if (error || local.trim() === value) return setLocal(value);
    onCommit(local.trim());
  };
  return (
    <input
      ref={ref}
      className={css.name}
      value={local}
      aria-invalid={!!error}
      title={error ?? "Rename (references are updated)"}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setLocal(value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function DeleteButton({ usage, onDelete, onDetach }: { usage: number; onDelete: () => void; onDetach: () => void }) {
  const pop = usePopover();
  return (
    <>
      <button
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        type="button"
        className={cx(ui.iconButton, css.delete)}
        title="Delete token"
        aria-label="Delete token"
        onClick={() => (usage ? pop.toggle() : onDelete())}
      >
        <Trash size={13} />
      </button>
      <Popover state={pop} title="Delete token?" width={220}>
        <div className={ui.muted}>
          Used in {usage} place{usage > 1 ? "s" : ""}. Detaching keeps the current value on those elements.
        </div>
        <div className={ui.inline}>
          <button type="button" className={ui.button} style={{ flex: 1 }} onClick={pop.close}>
            Cancel
          </button>
          <button
            type="button"
            className={cx(ui.button, css.danger)}
            style={{ flex: 1 }}
            onClick={() => {
              pop.close();
              onDetach();
            }}
          >
            Detach & delete
          </button>
        </div>
      </Popover>
    </>
  );
}

function TokenRow({
  kind,
  token,
  preview,
  previewClassName,
  sub,
  editor,
  editorTitle,
  aside,
  taken,
  autoFocus,
  usage,
  onRename,
  onDelete,
  onDetach,
}: {
  kind: TokenKind;
  token: Token;
  preview: ReactNode;
  previewClassName?: string;
  sub?: ReactNode;
  /** Editor shown in a popover when clicking the preview. */
  editor?: ReactNode;
  editorTitle?: string;
  /** Inline control on the right (e.g. a size input). */
  aside?: ReactNode;
  taken: Set<string>;
  autoFocus?: boolean;
  usage: number;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDetach: () => void;
}) {
  const pop = usePopover();
  return (
    <div className={css.row} data-open={pop.open}>
      <button
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        type="button"
        className={cx(css.preview, previewClassName)}
        disabled={!editor}
        title={editor ? `Edit ${token.name}` : undefined}
        onClick={pop.toggle}
      >
        {preview}
      </button>
      <div className={css.main}>
        <NameInput value={token.name} taken={taken} autoFocus={autoFocus} onCommit={onRename} />
        <div className={css.sub} title={`var(${tokenVar(kind, token.name)})`}>
          {sub ?? <code>{tokenVar(kind, token.name)}</code>}
        </div>
      </div>
      {aside}
      <span className={css.usage} data-used={usage > 0} title={usage ? `Used in ${usage} place${usage > 1 ? "s" : ""}` : "Not used"}>
        {usage}
      </span>
      <DeleteButton usage={usage} onDelete={onDelete} onDetach={onDetach} />
      {editor && (
        <Popover state={pop} title={editorTitle ?? token.name} width={240}>
          {editor}
        </Popover>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Fonts */

const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "Extra light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi bold",
  700: "Bold",
  800: "Extra bold",
  900: "Black",
};

function FontSub({ value, library }: { value: string; library: FontDefinition[] }) {
  const font = findFont(value, [...library, ...systemFonts]);
  return (
    <span className={css.value}>
      {font ? `${fontLabel(font)} · ${font.source.type === "system" ? "System" : `${fontWeights(font).length} weights`}` : `Custom: ${value}`}
    </span>
  );
}

function FontTokenEditor({ value, library, onChange }: { value: string; library: FontDefinition[]; onChange: (v: string) => void }) {
  const font = findFont(value, [...library, ...systemFonts]);
  return (
    <>
      <FontPicker value={value} clearable={false} onChange={(v) => v && onChange(v)} />
      <div className={css.fontPreview} style={{ fontFamily: value }}>
        The quick brown fox jumps over the lazy dog
      </div>
      {font && font.source.type !== "system" && (
        <div className={css.weights}>
          {fontWeights(font).map((w) => (
            <span key={w} style={{ fontFamily: value, fontWeight: w }} title={`${w}`}>
              {WEIGHT_NAMES[w] ?? w}
              {font.italic && <em style={{ fontWeight: w }}> Italic</em>}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Panel */

export function TokensPanel() {
  const { tokens, usage, setList, setListAndRefs } = useTokens();
  const { fonts: library, onAddFonts, addFontsLabel } = useKitEditor();
  const [tab, setTab] = useState<TokenKind>(lastTab);
  const [added, setAdded] = useState<number | null>(null);
  const meta = KINDS.find((k) => k.kind === tab)!;
  const list = tokens[tab] ?? [];

  const update = (i: number, patch: Partial<Token>) => setList(tab, list.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const rowProps = (t: Token, i: number) => ({
    kind: tab,
    token: t,
    autoFocus: added === i,
    usage: usage(tab, t.name),
    taken: new Set(list.filter((_, j) => j !== i).map((x) => slug(x.name))),
    onRename: (name: string) => {
      setAdded(null);
      setListAndRefs(tab, list.map((x, j) => (j === i ? { ...x, name } : x)), t.name, tokenRef(tab, name));
    },
    onDelete: () => setList(tab, list.filter((_, j) => j !== i)),
    onDetach: () => setListAndRefs(tab, list.filter((_, j) => j !== i), t.name, t.value),
  });

  return (
    <div className={cx(ui.theme, css.panel)} data-pk-panel="">
      <header className={css.header}>
        <h2>Design tokens</h2>
        <p>Reusable values for the whole page. Pick them in any color, font or size field.</p>
      </header>
      <div className={css.tabs} role="tablist">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            role="tab"
            aria-selected={tab === k.kind}
            className={css.tab}
            onClick={() => {
              lastTab = k.kind;
              setTab(k.kind);
              setAdded(null);
            }}
          >
            {k.icon}
            {k.label}
            <span className={css.tabCount}>{tokens[k.kind]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={css.list}>
        {list.length === 0 && <div className={css.empty}>No {meta.label.toLowerCase()} yet.</div>}

        {tab === "colors" &&
          list.map((t, i) => (
            <TokenRow
              key={i}
              {...rowProps(t, i)}
              preview={<Swatch color={t.value} />}
              previewClassName={css.colorPreview}
              sub={
                <>
                  <span className={css.value}>{t.value}</span>
                  <code>{tokenVar("colors", t.name)}</code>
                </>
              }
              editorTitle={t.name}
              editor={<ColorPicker value={t.value} tokens={{}} allowClear={false} onChange={(v) => update(i, { value: v ?? "#000000" })} />}
            />
          ))}

        {tab === "fonts" &&
          list.map((t, i) => (
            <TokenRow
              key={i}
              {...rowProps(t, i)}
              preview={
                <span className={css.fontSample} style={{ fontFamily: t.value }}>
                  Aa
                </span>
              }
              sub={<FontSub value={t.value} library={library} />}
              editorTitle={t.name}
              editor={<FontTokenEditor value={t.value} library={library} onChange={(v) => update(i, { value: v })} />}
            />
          ))}

        {tab === "sizes" &&
          list.map((t, i) => {
            const px = parseFloat(t.value) * (/rem|em$/.test(t.value) ? 16 : 1);
            return (
              <TokenRow
                key={i}
                {...rowProps(t, i)}
                preview={<span className={css.sizeBar} style={{ width: Math.max(2, Math.min(24, Number.isFinite(px) ? px / 3 : 2)) }} />}
                sub={
                  <div className={css.sizeInput}>
                    <UnitInput value={t.value} onChange={(v) => update(i, { value: v ?? "0px" })} min={0} aria-label={`${t.name} value`} />
                  </div>
                }
              />
            );
          })}
      </div>

      <div className={css.actions}>
        <button
          type="button"
          className={cx(ui.button, css.add)}
          onClick={() => {
            const used = new Set(list.map((t) => slug(t.name)));
            let n = list.length + 1;
            while (used.has(slug(meta.fresh(n).name))) n++;
            const fresh = meta.fresh(n);
            // New font tokens start with the first library font.
            if (tab === "fonts") fresh.value = fontStack(library[0] ?? systemFonts[0]);
            setAdded(list.length);
            setList(tab, [...list, fresh]);
          }}
        >
          <Plus size={14} /> New {meta.singular}
        </button>
        {tab === "fonts" && onAddFonts && (
          <button type="button" className={cx(ui.button, css.add, css.addFonts)} onClick={onAddFonts}>
            <Type size={14} /> {addFontsLabel}
          </button>
        )}
      </div>
      <FontLinks fonts={library} />
    </div>
  );
}
