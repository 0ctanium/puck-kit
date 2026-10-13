import type { Fields, RootConfig } from "@puckeditor/core";
import type { ReactNode } from "react";
import { styleField } from "./fields/styleField";
import { FontLinks } from "./fonts/FontLinks";
import { FONT_METADATA_KEY } from "./fonts/load";
import type { FontDefinition } from "./fonts/types";
import { baseCss, columnsCss, editorCss } from "./styles/base";
import { ElementStyle } from "./styles/ElementStyle";
import { styleClass } from "./styles/compile";
import { hash } from "./styles/hash";
import { tokensToCss, type Tokens } from "./styles/tokens";
import type { Styles } from "./styles/types";
import type { KitContext } from "./components/shared";

export interface KitRootProps {
  title?: string;
  tokens?: Tokens;
  styles?: Styles;
  [key: string]: unknown;
}

export const PAGE_STYLE_ID = "page";

export function createKitRoot(ctx: KitContext, defaults: { tokens: Tokens }): RootConfig<{ props: KitRootProps }> {
  return {
    fields: {
      title: { type: "text", label: "Page title" },
      styles: styleField({ label: "Page style", breakpoints: ctx.breakpoints, states: false }),
    } as Fields<KitRootProps>,
    // `tokens` has no field: it's edited in the Tokens plugin (left rail) and kept in root props.
    defaultProps: { title: "", tokens: defaults.tokens, styles: {} },
    render: ({
      children,
      tokens,
      styles,
      puck,
    }: KitRootProps & { children: ReactNode; puck: { isEditing: boolean; metadata?: Record<string, unknown> } }) => {
      const fonts = puck.metadata?.[FONT_METADATA_KEY] as FontDefinition[] | undefined;
      const globalCss = baseCss + columnsCss + tokensToCss(tokens);
      return (
        <div className={`pk-page ${styleClass(PAGE_STYLE_ID)}`}>
          {puck.isEditing ? (
            <style>{globalCss + editorCss}</style>
          ) : (
            <style href={`puck-kit-global-${hash(globalCss)}`} precedence="puck-kit-base">
              {globalCss}
            </style>
          )}
          <FontLinks fonts={fonts} inline={puck.isEditing} />
          <ElementStyle id={PAGE_STYLE_ID} styles={styles} editing={puck.isEditing} breakpoints={ctx.breakpoints} />
          {children}
        </div>
      );
    },
  };
}
