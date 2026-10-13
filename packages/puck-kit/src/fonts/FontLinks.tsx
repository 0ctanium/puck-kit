import { preconnect } from "react-dom";
import { hash } from "../styles/hash";
import { getFontAssets } from "./load";
import type { FontDefinition } from "./types";

/**
 * Loads fonts: <link> stylesheets (Google, CSS sources) + @font-face for self-hosted files.
 * Default: React 19 hoisted resources (in <head>, deduplicated, SSR/RSC friendly).
 * `inline`: rendered in place — for Puck's editor iframe, where hoisting would target the host page.
 * Server-safe: no hooks.
 */
export function FontLinks({ fonts, inline }: { fonts: FontDefinition[] | undefined; inline?: boolean }) {
  if (!fonts?.length) return null;
  const { stylesheets, fontFaceCss, google } = getFontAssets(fonts);
  if (!inline && google) {
    preconnect("https://fonts.googleapis.com");
    preconnect("https://fonts.gstatic.com", { crossOrigin: "anonymous" });
  }
  return (
    <>
      {stylesheets.map((href) =>
        inline ? <link key={href} rel="stylesheet" href={href} /> : <link key={href} rel="stylesheet" href={href} precedence="puck-kit-fonts" />,
      )}
      {fontFaceCss &&
        (inline ? (
          <style>{fontFaceCss}</style>
        ) : (
          <style href={`pk-fonts-${hash(fontFaceCss)}`} precedence="puck-kit-fonts">
            {fontFaceCss}
          </style>
        ))}
    </>
  );
}
