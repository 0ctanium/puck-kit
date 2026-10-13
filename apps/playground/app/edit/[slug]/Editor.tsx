"use client";

import { type Data } from "@puckeditor/core";
import { useEffect, useState } from "react";
import type { FontDefinition } from "puck-kit";
import { BuilderEditor } from "puck-kit/editor";
import { config } from "@/lib/config";

export function Editor({ slug, data, fonts: initialFonts }: { slug: string; data: Data | null; fonts: FontDefinition[] }) {
  // Fonts are managed on /settings/fonts (opened in a new tab so unpublished edits are kept);
  // refresh the list when coming back to the editor.
  const [fonts, setFonts] = useState(initialFonts);
  useEffect(() => {
    const refresh = () =>
      fetch("/api/fonts")
        .then((r) => r.json())
        .then(setFonts)
        .catch(() => {});
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  return (
    <BuilderEditor
      config={config}
      fonts={fonts}
      onAddFonts={() => window.open(`/settings/fonts?return=/edit/${slug}`, "_blank")}
      data={data ?? undefined}
      headerPath={`/${slug}`}
      onPublish={async (next) => {
        const res = await fetch(`/api/pages/${slug}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next),
        });
        if (res.ok) window.open(`/${slug}`, "_blank");
        else alert("Saving failed");
      }}
    />
  );
}
