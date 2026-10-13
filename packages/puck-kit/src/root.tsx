import type { Fields, RootConfig } from "@puckeditor/core";
import type { ReactNode } from "react";
import { ColorValueField } from "./fields/ColorValueField";
import { styleField } from "./fields/styleField";
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

const tokenList = (label: string, valueField: Fields[string]) => ({
  type: "array" as const,
  label,
  arrayFields: { name: { type: "text" as const, label: "Name" }, value: valueField },
  defaultItemProps: { name: "", value: "" },
  getItemSummary: (item: { name?: string; value?: string }) => item.name || item.value || "Token",
});

export const PAGE_STYLE_ID = "page";

export function createKitRoot(ctx: KitContext, defaults: { tokens: Tokens }): RootConfig<{ props: KitRootProps }> {
  return {
    fields: {
      title: { type: "text", label: "Page title" },
      tokens: {
        type: "object",
        label: "Design tokens",
        objectFields: {
          colors: tokenList("Colors", {
            type: "custom",
            label: "Value",
            render: ColorValueField as never,
          }),
          fonts: tokenList("Fonts", { type: "text", label: "font-family" }),
          sizes: tokenList("Sizes", { type: "text", label: "Value (e.g. 16px, 1rem)" }),
        },
      },
      styles: styleField({ label: "Page style", breakpoints: ctx.breakpoints }),
    } as Fields<KitRootProps>,
    defaultProps: { title: "", tokens: defaults.tokens, styles: {} },
    render: ({ children, tokens, styles, puck }: KitRootProps & { children: ReactNode; puck: { isEditing: boolean } }) => {
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
          <ElementStyle id={PAGE_STYLE_ID} styles={styles} editing={puck.isEditing} breakpoints={ctx.breakpoints} />
          {children}
        </div>
      );
    },
  };
}
