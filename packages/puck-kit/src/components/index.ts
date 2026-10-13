import type { ComponentConfig } from "@puckeditor/core";
import { createButton } from "./button";
import { createColumns } from "./columns";
import { createContainer } from "./container";
import type { KitContext } from "./shared";
import { createTextElement } from "./text";

const BOX_TAGS = [
  "div",
  "section",
  "article",
  "aside",
  "header",
  "footer",
  "nav",
  "main",
];
const SECTION_TAGS = [
  "section",
  "div",
  "header",
  "footer",
  "main",
  "article",
  "aside",
];

export const kitCategories = {
  structure: {
    title: "Structure",
    components: [
      "Section",
      "Container",
      "VerticalFlex",
      "HorizontalFlex",
      "Grid",
      "Columns",
    ],
  },
  basic: {
    title: "Basic",
    components: ["Box", "List", "ListItem", "LinkBlock", "Button"],
  },
  typography: {
    title: "Typography",
    components: ["Heading", "Paragraph", "Text", "Quote"],
  },
};

export function createKitComponents(
  ctx: KitContext,
): Record<string, ComponentConfig<any>> {
  const bps = [...ctx.breakpoints]
    .sort((a, b) => a.minWidth - b.minWidth)
    .map((b) => b.key);
  const [, md, lg, xl] = bps;
  const containerWidths: Record<string, { maxWidth: string }> = {};
  if (md) containerWidths[md] = { maxWidth: "728px" };
  if (lg) containerWidths[lg] = { maxWidth: "960px" };
  if (xl) containerWidths[xl] = { maxWidth: "1200px" };

  return {
    // Structure
    Section: createContainer(
      {
        label: "Section",
        tags: SECTION_TAGS,
        defaultStyles: { base: { paddingTop: "64px", paddingBottom: "64px" } },
        metadata: {
          icon: "square-dashed-text",
        },
      },
      ctx,
    ),
    Container: createContainer(
      {
        label: "Container",
        tags: BOX_TAGS,
        defaultStyles: {
          base: {
            width: "100%",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "16px",
            paddingRight: "16px",
          },
          ...containerWidths,
        },
        metadata: {
          icon: "panel-left-right-dashed",
        },
      },
      ctx,
    ),
    VerticalFlex: createContainer(
      {
        label: "V Flex",
        tags: BOX_TAGS,
        defaultStyles: {
          base: { display: "flex", flexDirection: "column", gap: "16px" },
        },
        metadata: {
          icon: "layout-arrow-down",
        },
      },
      ctx,
    ),
    HorizontalFlex: createContainer(
      {
        label: "H Flex",
        tags: BOX_TAGS,
        defaultStyles: {
          base: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "16px",
          },
        },
        metadata: {
          icon: "layout-arrow-right",
        },
      },
      ctx,
    ),
    Grid: createContainer(
      {
        label: "Grid",
        tags: BOX_TAGS,
        defaultStyles: {
          base: {
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gridTemplateRows: "auto auto",
            gap: "16px",
          },
        },
        metadata: {
          icon: "grid-2x2",
        },
      },
      ctx,
    ),
    Columns: createColumns(ctx),

    // Basic
    Box: createContainer(
      { label: "Box", tags: BOX_TAGS, metadata: { icon: "square" } },
      ctx,
    ),
    List: createContainer(
      {
        label: "List",
        tags: ["ul", "ol"],
        allow: ["ListItem"],
        defaultStyles: { base: { paddingLeft: "24px" } },
        metadata: {
          icon: "layout-list",
        },
      },
      ctx,
    ),
    ListItem: createContainer(
      {
        label: "List Item",
        tags: ["li"],
        minEmptyHeight: 24,
        metadata: {
          icon: "stretch-horizontal",
        },
      },
      ctx,
    ),
    LinkBlock: createContainer(
      {
        label: "Link Block",
        tags: ["a"],
        disallow: ["LinkBlock", "Button"],
        fields: {
          href: { type: "text", label: "Link URL" },
          target: {
            type: "radio",
            label: "Open in",
            options: [
              { label: "Same tab", value: "" },
              { label: "New tab", value: "_blank" },
            ],
          },
        },
        metadata: {
          icon: "link",
        },
        defaultProps: { href: "#", target: "" },
        defaultStyles: {
          base: { display: "block", color: "inherit", textDecoration: "none" },
        },
        attrs: (p) => ({
          href: (p.href as string) || undefined,
          target: (p.target as string) || undefined,
          rel: p.target === "_blank" ? "noopener noreferrer" : undefined,
        }),
      },
      ctx,
    ),
    Button: createButton(ctx),

    // Typography
    Heading: createTextElement(
      {
        label: "Heading",
        kind: "text",
        tags: ["h2", "h1", "h3", "h4", "h5", "h6"],
        defaultText: "Heading",
        defaultStyles: {
          base: { fontSize: "32px", fontWeight: "700", lineHeight: "1.2" },
        },
        metadata: {
          icon: "heading",
        },
      },
      ctx,
    ),
    Paragraph: createTextElement(
      {
        label: "Paragraph",
        kind: "richtext",
        tags: ["p"],
        defaultText:
          "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>",
        richtextOptions: {
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
        },
        metadata: {
          icon: "square-text",
        },
      },
      ctx,
    ),
    Text: createTextElement(
      {
        label: "Text",
        kind: "richtext",
        tags: ["div"],
        defaultText: "<p>Text block</p>",
        metadata: {
          icon: "text-align-justify-start",
        },
      },
      ctx,
    ),
    Quote: createTextElement(
      {
        label: "Quote",
        kind: "richtext",
        tags: ["blockquote"],
        defaultText: "<p>A memorable quote.</p>",
        defaultStyles: {
          base: { paddingLeft: "16px", fontStyle: "italic", fontSize: "20px" },
        },
        richtextOptions: { heading: false, blockquote: false },
        metadata: {
          icon: "message-square-quote",
        },
      },
      ctx,
    ),
  };
}
