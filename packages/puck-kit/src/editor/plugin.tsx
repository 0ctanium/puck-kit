"use client";

import { createUsePuck, type Config, type Plugin } from "@puckeditor/core";
import { Palette } from "lucide-react";
import { useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { baseBreakpoint, toViewports } from "../breakpoints";
import { getBreakpoints } from "../config";
import { kitFieldTypes } from "../fieldTypes/renderers";
import { FontLinks } from "../fonts/FontLinks";
import { CompactComponentDrawer, CompactComponentItem } from "./CompactComponent";
import { KitEditorProvider, type KitEditorOptions } from "./context";
import { FieldsPanel } from "./FieldsPanel";
import { TokensPanel } from "./TokensPlugin";
import { EditorChrome, ViewportBar } from "./ViewportBar";

const usePuck = createUsePuck();

export interface PuckKitOptions extends KitEditorOptions {
  /** Left-rail tab of the Tokens panel. */
  label?: string;
  icon?: ReactNode;
}

/* Options live in a small store read by the overrides, so the overrides themselves never change
   identity (Puck would remount the editor) when options do, e.g. an inline `onAddFonts`. */
interface OptionsStore {
  get: () => PuckKitOptions;
  set: (options: PuckKitOptions) => void;
  subscribe: (listener: () => void) => () => void;
}

function createOptionsStore(initial: PuckKitOptions): OptionsStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next) => {
      const changed =
        next.fonts !== current.fonts || next.addFontsLabel !== current.addFontsLabel || !next.onAddFonts !== !current.onAddFonts;
      current = next;
      if (changed) listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createPlugin(store: OptionsStore): Plugin {
  const useOptions = () => useSyncExternalStore(store.subscribe, store.get, store.get);
  // Always calls the latest callback, so a new inline function doesn't re-render the pickers.
  const onAddFonts = () => store.get().onAddFonts?.();

  function KitProvider({ children }: { children: ReactNode }) {
    const { fonts, addFontsLabel, onAddFonts: enabled } = useOptions();
    return (
      <KitEditorProvider fonts={fonts} onAddFonts={enabled ? onAddFonts : undefined} addFontsLabel={addFontsLabel}>
        <EditorChrome>{children}</EditorChrome>
      </KitEditorProvider>
    );
  }

  /** Loads the font library in the canvas (public pages use `fontMetadata()` instead). */
  function CanvasFonts({ children }: { children: ReactNode }) {
    const { fonts } = useOptions();
    return (
      <>
        <FontLinks fonts={fonts} inline />
        {children}
      </>
    );
  }

  function HeaderActions({ children }: { children: ReactNode }) {
    const config = usePuck((s) => s.config);
    return (
      <>
        <ViewportBar breakpoints={getBreakpoints(config)} />
        {children}
      </>
    );
  }

  const { label = "Tokens", icon = <Palette /> } = store.get();
  return {
    name: "puck-kit",
    label,
    icon,
    render: TokensPanel,
    overrides: {
      puck: KitProvider,
      iframe: CanvasFonts,
      headerActions: HeaderActions,
      fields: FieldsPanel,
      drawer: CompactComponentDrawer,
      drawerItem: CompactComponentItem,
      fieldTypes: kitFieldTypes as unknown as NonNullable<Plugin["overrides"]>["fieldTypes"],
    } as Plugin["overrides"],
  };
}

/**
 * The kit's editor features as one Puck plugin: Tokens panel (left rail), field types (color,
 * background, font, range, checkbox, url, image, select, object), breakpoint switcher in the
 * header, fields panel with Settings/Style tabs, compact component drawer and the font library.
 *
 * Create it once (module level or `useMemo`). For options that change over time, and for the
 * matching viewports, use `usePuckKit()` instead.
 */
export function puckKit(options: PuckKitOptions = {}): Plugin {
  return createPlugin(createOptionsStore(options));
}

/**
 * Everything `<Puck>` needs for the kit: the plugin plus viewports matching the breakpoints and
 * an initial viewport on the base breakpoint. Spread it on Puck's own component:
 *
 * ```tsx
 * const kit = usePuckKit(config, { fonts, onAddFonts });
 * <Puck config={config} data={data} {...kit} plugins={[...kit.plugins, myPlugin]} />
 * ```
 */
export function usePuckKit(config: Config, options: PuckKitOptions = {}) {
  const [store] = useState(() => createOptionsStore(options));
  useLayoutEffect(() => store.set(options));
  const plugin = useMemo(() => createPlugin(store), [store]);
  const breakpoints = getBreakpoints(config);
  return useMemo(() => {
    const base = baseBreakpoint(breakpoints);
    return {
      plugins: [plugin],
      viewports: toViewports(breakpoints),
      // Open on the base breakpoint (Puck would pick the viewport closest to the window width).
      ui: {
        viewports: {
          options: [],
          controlsVisible: true,
          current: { width: base.viewport, height: "auto" as const },
        },
      },
    };
  }, [plugin, breakpoints]);
}
