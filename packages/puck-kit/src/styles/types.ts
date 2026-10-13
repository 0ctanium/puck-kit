/** A flat set of CSS declarations, camelCase keys, string values (`"16px"`, `"var(--pk-color-primary)"`). */
export type StyleDecl = Partial<Record<StyleProp, string>>;

/** Per-breakpoint declarations. Keys are breakpoint keys (`base`, `md`, ...). Mobile-first cascade. */
export type Styles = Record<string, StyleDecl | undefined>;

export const STYLE_PROPS = [
  // Layout
  "display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap",
  "gridTemplateColumns", "gridTemplateRows", "gridAutoFlow", "justifyItems",
  // Child
  "alignSelf", "justifySelf", "flexGrow", "flexShrink", "flexBasis", "order", "gridColumn", "gridRow",
  // Spacing
  "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  // Size
  "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "aspectRatio", "overflow",
  // Position
  "position", "top", "right", "bottom", "left", "zIndex",
  // Typography
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "textAlign",
  "textTransform", "textDecoration", "fontStyle", "whiteSpace",
  // Background
  "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat",
  // Border
  "borderWidth", "borderStyle", "borderColor", "borderRadius",
  // Effects
  "opacity", "boxShadow", "transform", "transition", "cursor",
] as const;

export type StyleProp = (typeof STYLE_PROPS)[number];

/** Properties whose bare numbers must not get a `px` suffix. */
export const UNITLESS_PROPS = new Set<StyleProp>([
  "flexGrow", "flexShrink", "order", "zIndex", "fontWeight", "lineHeight", "opacity", "aspectRatio",
]);
