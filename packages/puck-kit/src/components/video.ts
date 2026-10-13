/* Video embed URLs. Pure functions, shared by the components and the tests. */

export interface VideoOptions {
  autoplay?: boolean;
  /** Needed for autoplay in most browsers. */
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  /** Start time in seconds. */
  start?: number;
}

const YOUTUBE_ID = /^[\w-]{11}$/;

/** The video id from a YouTube URL (watch, youtu.be, embed, shorts, live) or a bare id. */
export function youtubeId(input: string | undefined): string | null {
  const value = input?.trim() ?? "";
  if (YOUTUBE_ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, rest] = url.pathname.split("/");
    id = kind === "watch" ? url.searchParams.get("v") : ["embed", "shorts", "live", "v"].includes(kind) ? rest : null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** `?t=` / `&start=` from a YouTube URL (`90`, `90s`, `1m30s`), in seconds. */
export function youtubeStart(input: string | undefined): number | undefined {
  try {
    const url = new URL(input ?? "");
    const t = url.searchParams.get("t") ?? url.searchParams.get("start");
    if (!t) return undefined;
    const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(t);
    if (!m) return undefined;
    const seconds = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
    return seconds || undefined;
  } catch {
    return undefined;
  }
}

export function youtubeEmbedUrl(id: string, opts: VideoOptions & { privacy?: boolean } = {}): string {
  const params = new URLSearchParams({ rel: "0" });
  if (opts.autoplay) params.set("autoplay", "1");
  if (opts.muted) params.set("mute", "1");
  if (opts.loop) {
    params.set("loop", "1");
    params.set("playlist", id); // YouTube only loops a single video as a playlist of itself
  }
  if (opts.controls === false) params.set("controls", "0");
  if (opts.start) params.set("start", String(Math.floor(opts.start)));
  const host = opts.privacy === false ? "www.youtube.com" : "www.youtube-nocookie.com";
  return `https://${host}/embed/${id}?${params}`;
}

/** Id (and the private-link hash of unlisted videos) from a Vimeo URL or a bare id. */
export function vimeoId(input: string | undefined): { id: string; hash?: string } | null {
  const value = input?.trim() ?? "";
  if (/^\d+$/.test(value)) return { id: value };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  // vimeo.com/123, vimeo.com/123/abcdef, vimeo.com/channels/x/123, player.vimeo.com/video/123?h=abc
  const parts = url.pathname.split("/").filter(Boolean);
  const index = parts.findIndex((p) => /^\d+$/.test(p));
  if (index < 0) return null;
  const hash = url.searchParams.get("h") ?? (/^[\da-f]+$/i.test(parts[index + 1] ?? "") ? parts[index + 1] : undefined);
  return hash ? { id: parts[index], hash } : { id: parts[index] };
}

export function vimeoEmbedUrl(video: { id: string; hash?: string }, opts: VideoOptions & { dnt?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (video.hash) params.set("h", video.hash);
  if (opts.autoplay) params.set("autoplay", "1");
  if (opts.muted) params.set("muted", "1");
  if (opts.loop) params.set("loop", "1");
  if (opts.controls === false) params.set("controls", "0");
  if (opts.dnt !== false) params.set("dnt", "1");
  const query = params.toString();
  const start = opts.start ? `#t=${Math.floor(opts.start)}s` : "";
  return `https://player.vimeo.com/video/${video.id}${query ? `?${query}` : ""}${start}`;
}
