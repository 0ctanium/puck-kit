"use client";

import { Puck, type Config, type Data } from "@puckeditor/core";
import { useMemo, type ComponentProps } from "react";
import { toViewports } from "./breakpoints";
import { getBreakpoints } from "./config";
import { FieldsPanel } from "./editor/FieldsPanel";
import { tokensPlugin } from "./editor/TokensPlugin";
import { KitEditorProvider, type KitEditorOptions } from "./editor/context";
import { fontMetadata } from "./fonts/load";
import {
  CompactComponentDrawer,
  CompactComponentItem,
} from "./editor/CompactComponent";

export type BuilderEditorProps = Omit<
  ComponentProps<typeof Puck>,
  "config" | "data"
> &
  KitEditorOptions & {
    config: Config;
    data?: Partial<Data>;
  };

/**
 * `<Puck>` preconfigured for the kit: viewports matching the breakpoints, the Tokens plugin,
 * the font library (`fonts`, loaded in the canvas and offered in font pickers) and an optional
 * `onAddFonts` callback (e.g. open your font settings page).
 */
export function BuilderEditor({
  config,
  data,
  viewports,
  overrides,
  plugins,
  metadata,
  fonts,
  onAddFonts,
  addFontsLabel,
  ...rest
}: BuilderEditorProps) {
  const breakpoints = getBreakpoints(config);
  const mergedMetadata = useMemo(() => ({ ...metadata, ...fontMetadata(fonts) }), [metadata, fonts]);
  return (
    <KitEditorProvider fonts={fonts} onAddFonts={onAddFonts} addFontsLabel={addFontsLabel}>
      <Puck
      config={config}
      metadata={mergedMetadata}
      data={data ?? { content: [], root: { props: {} } }}
      viewports={viewports ?? toViewports(breakpoints)}
      plugins={[defaultTokensPlugin, ...(plugins ?? [])]}
      overrides={{
        ...overrides,
        fields: FieldsPanel,
        drawer: CompactComponentDrawer,
        drawerItem: CompactComponentItem,
      }}
      {...rest}
      />
    </KitEditorProvider>
  );
}

const defaultTokensPlugin = tokensPlugin();

export { StylePanel, useActiveBreakpoint } from "./fields/StylePanel";
export { tokensPlugin, TokensPanel } from "./editor/TokensPlugin";
export { KitEditorProvider, useKitEditor, type KitEditorOptions } from "./editor/context";
export { FontPicker } from "./fields/ui/FontPicker";
export { ColorValueField } from "./fields/ColorValueField";
