"use client";

// Example override of the kit's `image` field type: a tiny "media library" (a few stock images)
// plus a URL input. Every component using `type: "image"` (the kit's Image included) gets it.
// Swap the list for your own uploads / DAM.
import { defineFieldType, type ImageField } from "puck-kit/editor";

const LIBRARY = ["mountains", "city", "forest", "ocean", "desk", "coffee"].map(
  (seed) => `https://picsum.photos/seed/${seed}/1200/800`,
);

export const MediaLibraryField = defineFieldType<ImageField, string>(({ field, value, onChange, readOnly, Label, label }) => (
    <Label label={label || field.label || "Image"} readOnly={readOnly}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 }}>
        {LIBRARY.map((src) => (
          <button
            key={src}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(src)}
            title="Use this image"
            style={{
              padding: 0,
              aspectRatio: "3 / 2",
              border: 0,
              borderRadius: 4,
              outline: value === src ? "2px solid var(--puck-color-azure-04, #3b82f6)" : "none",
              outlineOffset: 1,
              background: `url(${src.replace("1200/800", "240/160")}) center / cover`,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder="…or paste a URL"
        style={{ width: "100%", boxSizing: "border-box", padding: "4px 6px", font: "inherit", fontSize: 12 }}
      />
    </Label>
));
