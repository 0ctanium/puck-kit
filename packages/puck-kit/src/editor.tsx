"use client";

import { Puck, type Config, type Data } from "@puckeditor/core";
import type { ComponentProps } from "react";
import { toViewports } from "./breakpoints";
import { getBreakpoints } from "./config";
import { FieldsPanel } from "./editor/FieldsPanel";
import {
  CompactComponentDrawer,
  CompactComponentItem,
} from "./editor/CompactComponent";

export type BuilderEditorProps = Omit<
  ComponentProps<typeof Puck>,
  "config" | "data"
> & {
  config: Config;
  data?: Partial<Data>;
};

/** `<Puck>` preconfigured for the kit: viewports matching the breakpoints, smooth DnD. */
export function BuilderEditor({
  config,
  data,
  viewports,
  overrides,
  ...rest
}: BuilderEditorProps) {
  const breakpoints = getBreakpoints(config);
  return (
    <Puck
      config={config}
      data={data ?? { content: [], root: { props: {} } }}
      viewports={viewports ?? toViewports(breakpoints)}
      overrides={{
        ...overrides,
        fields: FieldsPanel,
        drawer: CompactComponentDrawer,
        drawerItem: CompactComponentItem,
      }}
      {...rest}
    />
  );
}

export { StylePanel, useActiveBreakpoint } from "./fields/StylePanel";
export { ColorValueField } from "./fields/ColorValueField";
