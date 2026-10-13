import { existsSync } from "node:fs";
import path from "node:path";

/** Resolve a playground path whether `next dev` runs from this app or from the monorepo root. */
export function appPath(...segments: string[]) {
  const fromRoot = path.join(process.cwd(), "apps/playground");
  return path.join(existsSync(fromRoot) ? fromRoot : process.cwd(), ...segments);
}
