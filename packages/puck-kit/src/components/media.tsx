import type { ComponentConfig, Fields } from "@puckeditor/core";
import type { CSSProperties } from "react";
import { styleField } from "../fields/styleField";
import type { Styles } from "../styles/types";
import { advancedField, elementClass, htmlAttrs, Style, type Advanced, type KitContext } from "./shared";
import { vimeoEmbedUrl, vimeoId, youtubeEmbedUrl, youtubeId, youtubeStart } from "./video";

/* ---------------------------------------------------------------- Image */

export interface ImageProps {
  src: string;
  alt: string;
  loading: "lazy" | "eager";
  styles: Styles;
  advanced: Advanced;
}

/** Shown in the editor while an Image has no source. */
const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='#e5e7eb'/>" +
      "<path d='M300 320l70-90 50 60 35-40 65 70z' fill='#9ca3af'/><circle cx='470' cy='215' r='20' fill='#9ca3af'/></svg>",
  );

/**
 * `<img>`. Its source uses the `image` field type: a URL input by default, your media library
 * once you override `fieldTypes.image`.
 */
export function createImage(ctx: KitContext): ComponentConfig<ImageProps> {
  return {
    label: "Image",
    inline: true,
    fields: {
      src: { type: "image", label: "Image" },
      alt: { type: "text", label: "Alt text" },
      loading: {
        type: "select",
        label: "Loading",
        options: [
          { label: "Lazy (below the fold)", value: "lazy" },
          { label: "Eager (above the fold)", value: "eager" },
        ],
      },
      styles: styleField({ breakpoints: ctx.breakpoints }),
      advanced: advancedField,
    } as unknown as Fields<ImageProps>,
    metadata: { icon: "image" },
    defaultProps: {
      src: "",
      alt: "",
      loading: "lazy",
      styles: { base: { display: "block", maxWidth: "100%", height: "auto" } },
      advanced: {},
    },
    render: ({ id, puck, src, alt, loading, styles, advanced }) => {
      if (!src && !puck.isEditing) return <></>;
      return (
        <>
          <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={puck.dragRef}
            src={src || PLACEHOLDER}
            alt={alt}
            loading={loading === "eager" ? undefined : "lazy"}
            decoding="async"
            className={elementClass(id, advanced)}
            {...htmlAttrs(advanced)}
          />
        </>
      );
    },
  };
}

/* ---------------------------------------------------------------- Videos */

export interface VideoProps {
  url: string;
  title: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  /** Seconds. */
  start: number;
  /** YouTube: privacy-enhanced mode (youtube-nocookie.com). Vimeo: "do not track". */
  privacy: boolean;
  styles: Styles;
  advanced: Advanced;
}

const videoStyles: Styles = {
  base: { display: "block", width: "100%", height: "auto", aspectRatio: "16/9", borderWidth: "0", borderStyle: "none" },
};

/** Editor-only box shown while the URL isn't a video; sized by the element's styles. */
const emptyStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "#f1f3f5",
  color: "#6b7280",
  font: "14px/1.4 system-ui, sans-serif",
  textAlign: "center",
};

function createVideo(
  ctx: KitContext,
  opts: {
    label: string;
    icon: string;
    example: string;
    privacyText: string;
    /** The iframe src, or null if the URL isn't a video of this provider. */
    embed: (props: VideoProps, editing: boolean) => string | null;
  },
): ComponentConfig<VideoProps> {
  return {
    label: opts.label,
    inline: true,
    fields: {
      // A video link, not a link target: plain text, so overriding `fieldTypes.url` doesn't affect it.
      url: { type: "text", label: `${opts.label} URL`, placeholder: opts.example },
      title: { type: "text", label: "Title (for screen readers)" },
      autoplay: { type: "checkbox", label: "Autoplay", text: "Autoplay (muted)" },
      muted: { type: "checkbox", label: "Sound", text: "Start muted" },
      loop: { type: "checkbox", label: "Loop", text: "Loop" },
      controls: { type: "checkbox", label: "Controls", text: "Show player controls" },
      start: { type: "number", label: "Start at (seconds)", min: 0 },
      privacy: { type: "checkbox", label: "Privacy", text: opts.privacyText },
      styles: styleField({ breakpoints: ctx.breakpoints }),
      advanced: advancedField,
    } as unknown as Fields<VideoProps>,
    // Autoplay is always muted (browsers block it otherwise), so the sound switch is moot then.
    resolveFields: (data, { fields }) => {
      if (!data.props.autoplay) return fields;
      const { muted: _m, ...rest } = fields;
      return rest as typeof fields;
    },
    metadata: { icon: opts.icon },
    defaultProps: {
      url: opts.example,
      title: "",
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      start: 0,
      privacy: true,
      styles: videoStyles,
      advanced: {},
    },
    render: (props) => {
      const { id, puck, styles, advanced } = props;
      const src = opts.embed(props, puck.isEditing);
      if (!src && !puck.isEditing) return <></>;
      return (
        <>
          <Style id={id} styles={styles} editing={puck.isEditing} ctx={ctx} />
          {src ? (
            <iframe
              ref={puck.dragRef}
              src={src}
              title={props.title || `${opts.label} video`}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className={elementClass(id, advanced)}
              // In the editor, clicks must select the element instead of reaching the player.
              style={puck.isEditing ? { pointerEvents: "none" } : undefined}
              {...htmlAttrs(advanced)}
            />
          ) : (
            <div ref={puck.dragRef} className={elementClass(id, advanced)} style={emptyStyle}>
              Paste a {opts.label} link in the settings, e.g. {opts.example}
            </div>
          )}
        </>
      );
    },
  };
}

/** Video options for the embed; autoplay is off in the editor so the canvas stays quiet. */
function playerOptions(p: VideoProps, editing: boolean) {
  const autoplay = p.autoplay && !editing;
  return { autoplay, muted: p.autoplay || p.muted, loop: p.loop, controls: p.controls, start: p.start || undefined };
}

export function createYouTube(ctx: KitContext): ComponentConfig<VideoProps> {
  return createVideo(ctx, {
    label: "YouTube",
    icon: "square-play",
    example: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    privacyText: "Privacy-enhanced mode (no cookies until play)",
    embed: (p, editing) => {
      const id = youtubeId(p.url);
      if (!id) return null;
      const opts = playerOptions(p, editing);
      return youtubeEmbedUrl(id, { ...opts, start: opts.start ?? youtubeStart(p.url), privacy: p.privacy });
    },
  });
}

export function createVimeo(ctx: KitContext): ComponentConfig<VideoProps> {
  return createVideo(ctx, {
    label: "Vimeo",
    icon: "video",
    example: "https://vimeo.com/76979871",
    privacyText: "Do not track viewers",
    embed: (p, editing) => {
      const video = vimeoId(p.url);
      return video ? vimeoEmbedUrl(video, { ...playerOptions(p, editing), dnt: p.privacy }) : null;
    },
  });
}
