"use client";

import { TextInput } from "./controls";
import css from "./panel.module.css";

/** Plain color input (picker + text), used for color tokens. */
export function ColorValueField({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className={css.root}>
      <div className={css.color}>
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#000000"}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pick color"
        />
        <TextInput value={value} placeholder="#000000" onChange={(v) => onChange(v ?? "")} readOnly={readOnly} />
      </div>
    </div>
  );
}
