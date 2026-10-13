"use client";

import { Ban, Pipette } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cx } from "../../components/shared";
import { tokenRef, type Tokens } from "../../styles/tokens";
import { formatColor, hsvaToRgba, parseColor, rgbaToHsva, toHex, type HSVA } from "../css/color";
import { Popover, usePopover } from "./Popover";
import { TextInput } from "./inputs";
import ui from "./ui.module.css";

/** Resolve a color token reference to its raw value, for previews. */
export function resolveColor(value: string | undefined, tokens: Tokens): string | undefined {
  if (!value) return undefined;
  const t = tokens.colors?.find((c) => tokenRef("colors", c.name) === value);
  return t?.value ?? value;
}

export function colorLabel(value: string | undefined, tokens: Tokens): string | undefined {
  if (!value) return undefined;
  return tokens.colors?.find((c) => tokenRef("colors", c.name) === value)?.name ?? value;
}

function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const update = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    onMove(
      Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    );
  };
  return {
    ref,
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      update(e);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e);
    },
  };
}

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

/** HSV color picker with alpha, hex input, eyedropper and token swatches. */
export function ColorPicker({
  value,
  onChange,
  tokens,
  allowClear = true,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  tokens: Tokens;
  allowClear?: boolean;
}) {
  const resolved = parseColor(resolveColor(value, tokens));
  // Keep HSV locally so hue survives when saturation/value hit 0.
  const [hsva, setHsva] = useState<HSVA>(() => rgbaToHsva(resolved ?? { r: 0, g: 0, b: 0, a: 1 }));
  const lastEmitted = useRef<string | undefined>(value);
  useEffect(() => {
    if (value !== lastEmitted.current && resolved) setHsva(rgbaToHsva(resolved));
    lastEmitted.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (next: HSVA) => {
    setHsva(next);
    const out = formatColor(hsvaToRgba(next));
    lastEmitted.current = out;
    onChange(out);
  };

  const sv = useDrag((x, y) => emit({ ...hsva, s: x, v: 1 - y }));
  const hue = useDrag((x) => emit({ ...hsva, h: x * 360 }));
  const alpha = useDrag((x) => emit({ ...hsva, a: Math.round(x * 100) / 100 }));
  const rgb = hsvaToRgba({ ...hsva, a: 1 });
  const hueColor = toHex(hsvaToRgba({ h: hsva.h, s: 1, v: 1, a: 1 }));
  const colors = tokens.colors?.filter((c) => c.name && c.value) ?? [];

  return (
    <div className={ui.picker}>
      <div {...sv} className={ui.saturation} style={{ backgroundColor: hueColor }}>
        <span className={ui.thumb} style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: toHex(rgb) }} />
      </div>
      <div {...hue} className={cx(ui.track, ui.hue)}>
        <span className={ui.thumb} style={{ left: `${(hsva.h / 360) * 100}%`, background: hueColor }} />
      </div>
      <div {...alpha} className={cx(ui.track, ui.alpha)}>
        <i style={{ background: `linear-gradient(to right, transparent, ${toHex(rgb)})` }} />
        <span className={ui.thumb} style={{ left: `${hsva.a * 100}%`, background: formatColor(hsvaToRgba(hsva)) }} />
      </div>
      <div className={ui.inline}>
        <div className={ui.grow}>
          <TextInput
            value={value}
            placeholder="#000000"
            aria-label="Color value"
            onChange={(v) => {
              lastEmitted.current = undefined;
              onChange(v);
            }}
          />
        </div>
        <div style={{ width: 56 }}>
          <TextInput
            value={String(Math.round(hsva.a * 100))}
            aria-label="Opacity %"
            title="Opacity %"
            onChange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n)) emit({ ...hsva, a: Math.min(100, Math.max(0, n)) / 100 });
            }}
          />
        </div>
        {typeof window !== "undefined" && window.EyeDropper && (
          <button
            type="button"
            className={ui.iconButton}
            title="Pick from screen"
            onClick={async () => {
              try {
                const { sRGBHex } = await new window.EyeDropper!().open();
                const c = parseColor(sRGBHex);
                if (c) emit({ ...rgbaToHsva(c), a: hsva.a });
              } catch {
                /* cancelled */
              }
            }}
          >
            <Pipette size={14} />
          </button>
        )}
        {allowClear && (
          <button type="button" className={ui.iconButton} title="No color" onClick={() => onChange(undefined)}>
            <Ban size={14} />
          </button>
        )}
      </div>
      {colors.length > 0 && (
        <>
          <div className={ui.muted}>Tokens</div>
          <div className={ui.tokenSwatches}>
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                className={ui.tokenSwatch}
                title={c.name}
                aria-label={c.name}
                aria-pressed={value === tokenRef("colors", c.name)}
                onClick={() => {
                  const parsed = parseColor(c.value);
                  if (parsed) setHsva(rgbaToHsva(parsed));
                  lastEmitted.current = tokenRef("colors", c.name);
                  onChange(tokenRef("colors", c.name));
                }}
              >
                <i style={{ background: c.value }} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Swatch({ color }: { color: string | undefined }) {
  return (
    <span className={cx(ui.swatch, !color && ui.swatchEmpty)}>
      <i style={color ? { background: color } : undefined} />
    </span>
  );
}

/** Swatch + label button opening a color picker popover. */
export function ColorInput({
  value,
  inherited,
  onChange,
  tokens,
  readOnly,
  title = "Color",
}: {
  value: string | undefined;
  inherited?: string;
  onChange: (value: string | undefined) => void;
  tokens: Tokens;
  readOnly?: boolean;
  title?: string;
}) {
  const pop = usePopover();
  const effective = value ?? inherited;
  return (
    <>
      <button
        ref={(el) => {
          pop.anchorRef.current = el;
        }}
        type="button"
        className={ui.colorTrigger}
        data-state={value ? "set" : inherited ? "inherited" : "empty"}
        disabled={readOnly}
        onClick={pop.toggle}
        aria-expanded={pop.open}
      >
        <Swatch color={resolveColor(effective, tokens)} />
        <span>{colorLabel(effective, tokens) ?? "None"}</span>
      </button>
      <Popover state={pop} title={title} width={232}>
        <ColorPicker value={value ?? inherited} onChange={onChange} tokens={tokens} />
      </Popover>
    </>
  );
}
