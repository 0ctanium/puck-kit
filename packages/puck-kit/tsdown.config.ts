import { defineConfig } from "tsdown";

// Unbundled build: one output file per source file, so "use client" directives stay on the
// editor-only modules and server code (React Server Components) never pulls in client hooks.
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.test.ts", "!src/**/*.d.ts"],
  format: ["esm"],
  unbundle: true,
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  inputOptions: {
    // "use client" survives because of `unbundle: true` (one output file per source file),
    // so rolldown's warning about directives being lost in bundling doesn't apply.
    onLog(level, log, handler) {
      if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
      handler(level, log);
    },
  },
  css: {
    // Keep `import "./X.css"` in the emitted JS so consumers load the styles automatically.
    inject: true,
    modules: {
      // Pattern for scoped class names (Lightning CSS pattern syntax)
      generateScopedName: "[hash]_[local]",
    },
  },
});
