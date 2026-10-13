"use client";

import { type Data } from "@puckeditor/core";
import { BuilderEditor } from "puck-kit/editor";
import { config } from "@/lib/config";

export function Editor({ slug, data }: { slug: string; data: Data | null }) {
  return (
    <BuilderEditor
      config={config}
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
