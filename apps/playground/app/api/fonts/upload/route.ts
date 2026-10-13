import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { appPath } from "@/lib/paths";

// Demo storage: files in public/uploads/fonts (use object storage in a real app).
const uploadDir = appPath("public", "uploads", "fonts");

const ALLOWED = new Set(["woff2", "woff", "ttf", "otf"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.has(ext)) return Response.json({ error: "Use .woff2, .woff, .ttf or .otf" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Font files are limited to 5 MB" }, { status: 400 });
  const base = path.basename(file.name, `.${ext}`).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "font";
  const name = `${base}-${randomUUID().slice(0, 8)}.${ext}`;
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ url: `/uploads/fonts/${name}` });
}
