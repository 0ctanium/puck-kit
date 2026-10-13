"use client";

import { ColorInput } from "./ui/ColorPicker";
import ui from "./ui/ui.module.css";

/** Color picker field, used for color tokens. */
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
    <div className={ui.theme}>
      <ColorInput value={value || undefined} onChange={(v) => onChange(v ?? "")} tokens={{}} readOnly={readOnly} />
    </div>
  );
}
