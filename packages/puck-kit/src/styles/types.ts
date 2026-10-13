/** A flat set of CSS declarations, camelCase keys, string values (`"16px"`, `"var(--pk-color-primary)"`). */
export type StyleDecl = Partial<Record<StyleProp, string>>;

/**
 * Per-breakpoint (and per-state) declarations. Keys are breakpoint keys (`base`, `md`, ...) or
 * `<breakpoint>:<state>` (`base:hover`, `md:active`). Mobile-first cascade.
 */
export type Styles = Record<string, StyleDecl | undefined>;

export const STYLE_PROPS = [
  // Order matters: CSS is emitted in this order, so shorthands come before their longhands.
  // Layout
  "display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap",
  "gridTemplateColumns", "gridTemplateRows", "gridAutoFlow", "justifyItems",
  // Child
  "alignSelf", "justifySelf", "flexGrow", "flexShrink", "flexBasis", "order", "gridColumn", "gridRow",
  // Spacing
  "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  // Size
  "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "aspectRatio", "overflow", "objectFit",
  // Position
  "position", "top", "right", "bottom", "left", "zIndex",
  // Typography
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "textAlign",
  "textTransform", "textDecoration", "fontStyle", "whiteSpace", "textShadow",
  // Background
  "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundAttachment",
  // Border
  "borderWidth", "borderStyle", "borderColor",
  "borderTopWidth", "borderTopStyle", "borderTopColor",
  "borderRightWidth", "borderRightStyle", "borderRightColor",
  "borderBottomWidth", "borderBottomStyle", "borderBottomColor",
  "borderLeftWidth", "borderLeftStyle", "borderLeftColor",
  "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius",
  // Effects
  "opacity", "boxShadow", "transform", "transformOrigin", "transition", "filter", "backdropFilter", "mixBlendMode", "cursor",
] as const;

export type StyleProp = (typeof STYLE_PROPS)[number];

/** Properties whose bare numbers must not get a `px` suffix. */
export const UNITLESS_PROPS = new Set<StyleProp>([
  "flexGrow", "flexShrink", "order", "zIndex", "fontWeight", "lineHeight", "opacity", "aspectRatio",
]);
