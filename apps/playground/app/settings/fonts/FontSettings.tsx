"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FontLinks, fontStack, googleFontsUrl, type FontCategory, type FontDefinition, type FontFile } from "puck-kit";
import { googleCatalog, type CatalogFont } from "@/lib/googleCatalog";
import s from "./fonts.module.css";

const CATEGORIES: { value: FontCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sans-serif", label: "Sans serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
  { value: "display", label: "Display" },
  { value: "handwriting", label: "Handwriting" },
];

const SOURCE: Record<FontDefinition["source"]["type"], string> = { google: "Google Fonts", files: "Uploaded", css: "Stylesheet", system: "System" };
const SAMPLE = "The quick brown fox jumps over the lazy dog";

async function save(fonts: FontDefinition[]) {
  const res = await fetch("/api/fonts", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(fonts) });
  if (!res.ok) throw new Error("Saving failed");
  return (await res.json()) as FontDefinition[];
}

export function FontSettings({ initialFonts, returnTo }: { initialFonts: FontDefinition[]; returnTo: string }) {
  const [fonts, setFonts] = useState(initialFonts);
  const [error, setError] = useState<string>();

  const update = async (next: FontDefinition[]) => {
    setFonts(next);
    try {
      setFonts(await save(next));
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const has = (family: string) => fonts.some((f) => f.family.toLowerCase() === family.toLowerCase());

  return (
    <div className={s.shell}>
    <div className={s.page}>
      <FontLinks fonts={fonts} />
      <header className={s.header}>
        <Link href={returnTo} className={s.back}>
          ← Back to the editor
        </Link>
        <h1>Fonts</h1>
        <p>Fonts added here can be picked in the editor (font tokens and typography). They are loaded automatically on the pages that use them.</p>
        {error && <p className={s.error}>{error}</p>}
      </header>

      <section className={s.section}>
        <h2>Your fonts</h2>
        {fonts.length === 0 && <p className={s.muted}>No fonts yet: add one from Google Fonts or upload your own.</p>}
        <div className={s.yours}>
          {fonts.map((f) => (
            <div key={f.family} className={s.fontCard}>
              <div className={s.fontPreview} style={{ fontFamily: fontStack(f) }}>
                {f.label ?? f.family}
              </div>
              <div className={s.fontMeta}>
                {SOURCE[f.source.type]} · {(f.weights ?? [400, 700]).length} weights{f.italic ? " · italics" : ""}
              </div>
              <button type="button" className={s.ghost} onClick={() => update(fonts.filter((x) => x !== f))}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <GoogleFonts has={has} onAdd={(f) => update([...fonts, { family: f.family, category: f.category, weights: f.weights, italic: f.italic, source: { type: "google" } }])} />

      <CustomFont exists={has} onAdd={(f) => update([...fonts, f])} />
    </div>
    </div>
  );
}

function GoogleFonts({ has, onAdd }: { has: (family: string) => boolean; onAdd: (f: CatalogFont) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const list = googleCatalog.filter(
    (f) => (category === "all" || f.category === category) && f.family.toLowerCase().includes(query.trim().toLowerCase()),
  );
  // Previews only need the regular weight of each family.
  const previewUrl = useMemo(
    () => googleFontsUrl(googleCatalog.map((f) => ({ family: f.family, weights: [400], source: { type: "google" as const } }))),
    [],
  );

  return (
    <section className={s.section}>
      {previewUrl && <link rel="stylesheet" href={previewUrl} precedence="font-previews" />}
      <h2>Google Fonts</h2>
      <div className={s.toolbar}>
        <input className={s.input} placeholder="Search Google Fonts" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className={s.chips}>
          {CATEGORIES.map((c) => (
            <button key={c.value} type="button" className={s.chip} aria-pressed={category === c.value} onClick={() => setCategory(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className={s.catalog}>
        {list.map((f) => {
          const added = has(f.family);
          return (
            <div key={f.family} className={s.catalogCard}>
              <div className={s.catalogName}>
                <strong>{f.family}</strong>
                <span>
                  {f.weights.length} weight{f.weights.length > 1 ? "s" : ""}
                  {f.italic ? " · italics" : ""}
                </span>
              </div>
              <div className={s.catalogSample} style={{ fontFamily: `"${f.family}"` }}>
                {SAMPLE}
              </div>
              <button type="button" className={added ? s.added : s.primary} disabled={added} onClick={() => onAdd(f)}>
                {added ? "Added" : "Add"}
              </button>
            </div>
          );
        })}
        {list.length === 0 && <p className={s.muted}>No font matches.</p>}
      </div>
    </section>
  );
}

type PendingFile = { file: File; weight: number; style: "normal" | "italic" };

function CustomFont({ exists, onAdd }: { exists: (family: string) => boolean; onAdd: (f: FontDefinition) => void }) {
  const [mode, setMode] = useState<"files" | "css">("files");
  const [family, setFamily] = useState("");
  const [category, setCategory] = useState<FontCategory>("sans-serif");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [cssUrl, setCssUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const guess = (name: string): Pick<PendingFile, "weight" | "style"> => {
    const n = name.toLowerCase();
    const weight = /thin|hairline/.test(n) ? 100 : /extralight|ultralight/.test(n) ? 200 : /light/.test(n) ? 300 : /medium/.test(n) ? 500 : /semibold|demibold/.test(n) ? 600 : /extrabold|ultrabold/.test(n) ? 800 : /black|heavy/.test(n) ? 900 : /bold/.test(n) ? 700 : 400;
    return { weight, style: /italic|oblique/.test(n) ? "italic" : "normal" };
  };

  const submit = async () => {
    const name = family.trim();
    if (!name) return setError("Give the font a name.");
    if (exists(name)) return setError("A font with this name already exists.");
    setBusy(true);
    setError(undefined);
    try {
      if (mode === "css") {
        if (!/^https?:\/\//.test(cssUrl)) throw new Error("Enter the stylesheet URL (https://…).");
        onAdd({ family: name, category, source: { type: "css", url: cssUrl.trim() } });
      } else {
        if (!files.length) throw new Error("Choose at least one font file.");
        const uploaded: FontFile[] = [];
        for (const f of files) {
          const body = new FormData();
          body.append("file", f.file);
          const res = await fetch("/api/fonts/upload", { method: "POST", body });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Upload failed");
          uploaded.push({ url: json.url, weight: f.weight, style: f.style });
        }
        onAdd({
          family: name,
          category,
          weights: [...new Set(uploaded.map((u) => u.weight ?? 400))],
          italic: uploaded.some((u) => u.style === "italic"),
          source: { type: "files", files: uploaded },
        });
      }
      setFamily("");
      setFiles([]);
      setCssUrl("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.section}>
      <h2>Your own font</h2>
      <div className={s.form}>
        <div className={s.chips}>
          <button type="button" className={s.chip} aria-pressed={mode === "files"} onClick={() => setMode("files")}>
            Upload files
          </button>
          <button type="button" className={s.chip} aria-pressed={mode === "css"} onClick={() => setMode("css")}>
            Stylesheet URL (Adobe Fonts…)
          </button>
        </div>
        <label>
          Font name
          <input className={s.input} value={family} placeholder="Brand Sans" onChange={(e) => setFamily(e.target.value)} />
        </label>
        <label>
          Category
          <select className={s.input} value={category} onChange={(e) => setCategory(e.target.value as FontCategory)}>
            {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {mode === "files" ? (
          <>
            <label>
              Font files (.woff2, .woff, .ttf, .otf)
              <input
                type="file"
                multiple
                accept=".woff2,.woff,.ttf,.otf"
                onChange={(e) => setFiles([...(e.target.files ?? [])].map((file) => ({ file, ...guess(file.name) })))}
              />
            </label>
            {files.map((f, i) => (
              <div key={i} className={s.fileRow}>
                <span>{f.file.name}</span>
                <select className={s.input} value={f.weight} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))}>
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
                <select className={s.input} value={f.style} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, style: e.target.value as PendingFile["style"] } : x)))}>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            ))}
          </>
        ) : (
          <label>
            Stylesheet URL
            <input className={s.input} value={cssUrl} placeholder="https://use.typekit.net/xxxxxx.css" onChange={(e) => setCssUrl(e.target.value)} />
            <span className={s.muted}>The font name must match the font-family declared in that stylesheet.</span>
          </label>
        )}
        {error && <p className={s.error}>{error}</p>}
        <button type="button" className={s.primary} disabled={busy} onClick={submit}>
          {busy ? "Adding…" : "Add font"}
        </button>
      </div>
    </section>
  );
}
