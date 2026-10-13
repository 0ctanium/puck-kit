import type { ComponentConfig, Config } from "@puckeditor/core";
import { defaultBreakpoints, validateBreakpoints, type Breakpoint } from "./breakpoints";
import { createKitComponents, kitCategories } from "./components/index";
import { createKitRoot } from "./root";
import { defaultTokens, type Tokens } from "./styles/tokens";

export const KIT = Symbol.for("puck-kit");

export interface BuilderConfigOptions {
  /**
   * Breakpoints. Default (desktop-first): Desktop `base`, Tablet `tablet` ≤1023, Mobile `mobile`
   * ≤767, Wide `wide` ≥1280. Use `mobileFirstBreakpoints` for the opposite.
   */
  breakpoints?: Breakpoint[];
  /** Tokens a new page starts with. */
  tokens?: Tokens;
  /** Your own components, added next to the kit's (same name overrides a kit component). */
  components?: Record<string, ComponentConfig<any>>;
  /** Extra categories, e.g. `{ media: { title: "Media", components: ["Image"] } }`. */
  categories?: Config["categories"];
  /** Kit components to leave out, e.g. `["Quote"]`. */
  exclude?: string[];
}

export type BuilderConfig = Config & { [KIT]?: { breakpoints: Breakpoint[] } };

export function createBuilderConfig(options: BuilderConfigOptions = {}): BuilderConfig {
  const breakpoints = options.breakpoints ?? defaultBreakpoints;
  validateBreakpoints(breakpoints);
  const ctx = { breakpoints };
  const exclude = new Set(options.exclude ?? []);

  const components: Record<string, ComponentConfig<any>> = {};
  for (const [name, c] of Object.entries(createKitComponents(ctx))) if (!exclude.has(name)) components[name] = c;
  Object.assign(components, options.components ?? {});

  const categories: Record<string, { title?: string; components?: string[] }> = {};
  for (const [key, cat] of Object.entries(kitCategories)) {
    categories[key] = { ...cat, components: cat.components.filter((c) => c in components) };
  }
  Object.assign(categories, options.categories ?? {});

  const config: BuilderConfig = {
    root: createKitRoot(ctx, { tokens: options.tokens ?? defaultTokens }) as Config["root"],
    components,
    categories: categories as Config["categories"],
  };
  Object.defineProperty(config, KIT, { value: { breakpoints }, enumerable: false });
  return config;
}

export function getBreakpoints(config: Config): Breakpoint[] {
  const fromKit = (config as BuilderConfig)[KIT]?.breakpoints;
  // Fallback if the config object was copied (the symbol isn't enumerable): the page style field.
  const root = config.root?.fields as Record<string, { metadata?: { breakpoints?: Breakpoint[] } }> | undefined;
  return fromKit ?? root?.styles?.metadata?.breakpoints ?? defaultBreakpoints;
}
