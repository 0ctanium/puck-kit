export interface Token {
  name: string;
  value: string;
}

export interface Tokens {
  colors?: Token[];
  fonts?: Token[];
  sizes?: Token[];
}

export type TokenKind = keyof Tokens;

const PREFIX: Record<TokenKind, string> = { colors: "color", fonts: "font", sizes: "size" };

export function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function tokenVar(kind: TokenKind, name: string): string {
  return `--pk-${PREFIX[kind]}-${slug(name)}`;
}

export function tokenRef(kind: TokenKind, name: string): string {
  return `var(${tokenVar(kind, name)})`;
}

export function tokensToCss(tokens: Tokens | null | undefined): string {
  if (!tokens) return "";
  const decls: string[] = [];
  for (const kind of Object.keys(PREFIX) as TokenKind[]) {
    for (const t of tokens[kind] ?? []) {
      if (!t?.name || !t.value || !slug(t.name)) continue;
      decls.push(`${tokenVar(kind, t.name)}:${t.value.replace(/[;{}<>]/g, "")}`);
    }
  }
  return decls.length ? `:root{${decls.join(";")}}` : "";
}

export const defaultTokens: Tokens = {
  colors: [
    { name: "Primary", value: "#4f46e5" },
    { name: "Text", value: "#111827" },
    { name: "Muted", value: "#6b7280" },
    { name: "Surface", value: "#f3f4f6" },
    { name: "White", value: "#ffffff" },
  ],
  fonts: [
    { name: "Sans", value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
    { name: "Serif", value: "ui-serif, Georgia, Cambria, 'Times New Roman', serif" },
    { name: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  ],
  sizes: [
    { name: "XS", value: "4px" },
    { name: "SM", value: "8px" },
    { name: "MD", value: "16px" },
    { name: "LG", value: "32px" },
    { name: "XL", value: "64px" },
  ],
};
