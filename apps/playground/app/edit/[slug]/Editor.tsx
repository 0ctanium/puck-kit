"use client";

import { Puck, type Data } from "@puckeditor/core";
import { useEffect, useState } from "react";
import type { FontDefinition } from "puck-kit";
import { usePuckKit } from "puck-kit/editor";
import { config } from "@/lib/config";
import { MediaLibraryField } from "@/lib/MediaLibraryField";

// Replaces the default URL input of every `image` field (the kit's Image component included).
const overrides = { fieldTypes: { image: MediaLibraryField } };

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
  // The kit's plugin (tokens, field types, breakpoints, fonts) + matching viewports.
  const kit = usePuckKit(config, {
    fonts,
    onAddFonts: () => window.open(`/settings/fonts?return=/edit/${slug}`, "_blank"),
  });
  return (
    <Puck
      config={config}
      data={data ?? { content: [], root: { props: {} } }}
      {...kit}
      overrides={overrides}
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
