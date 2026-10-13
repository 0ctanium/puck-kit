import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Data } from "@puckeditor/core";

import { appPath } from "./paths";

const dir = appPath("data");

export function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

export async function loadPage(slug: string): Promise<Data | null> {
  if (!isValidSlug(slug)) return null;
  try {
    return JSON.parse(await readFile(path.join(dir, `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function savePage(slug: string, data: Data) {
  if (!isValidSlug(slug)) throw new Error("Invalid slug");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${slug}.json`), JSON.stringify(data, null, 2));
}
