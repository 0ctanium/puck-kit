import { describe, expect, it } from "vitest";
import { vimeoEmbedUrl, vimeoId, youtubeEmbedUrl, youtubeId, youtubeStart } from "../components/video";

describe("youtubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=aqz-KE-bpKQ", "aqz-KE-bpKQ"],
    ["https://youtube.com/watch?feature=share&v=aqz-KE-bpKQ&t=10", "aqz-KE-bpKQ"],
    ["https://youtu.be/aqz-KE-bpKQ?si=abc", "aqz-KE-bpKQ"],
    ["youtu.be/aqz-KE-bpKQ", "aqz-KE-bpKQ"],
    ["https://m.youtube.com/watch?v=aqz-KE-bpKQ", "aqz-KE-bpKQ"],
    ["https://www.youtube.com/embed/aqz-KE-bpKQ", "aqz-KE-bpKQ"],
    ["https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0", "aqz-KE-bpKQ"],
    ["https://www.youtube.com/shorts/aqz-KE-bpKQ", "aqz-KE-bpKQ"],
    ["  aqz-KE-bpKQ ", "aqz-KE-bpKQ"],
  ])("%s", (input, id) => expect(youtubeId(input)).toBe(id));

  it.each(["", "hello", "https://vimeo.com/76979871", "https://www.youtube.com/channel/UC123", "https://evil.com/watch?v=aqz-KE-bpKQ"])(
    "rejects %s",
    (input) => expect(youtubeId(input)).toBeNull(),
  );

  it("reads the start time", () => {
    expect(youtubeStart("https://youtu.be/aqz-KE-bpKQ?t=90")).toBe(90);
    expect(youtubeStart("https://youtu.be/aqz-KE-bpKQ?t=1m30s")).toBe(90);
    expect(youtubeStart("https://youtu.be/aqz-KE-bpKQ")).toBeUndefined();
  });
});

describe("youtubeEmbedUrl", () => {
  it("uses privacy-enhanced mode by default", () => {
    expect(youtubeEmbedUrl("aqz-KE-bpKQ")).toBe("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0");
  });
  it("encodes the player options", () => {
    const url = new URL(
      youtubeEmbedUrl("aqz-KE-bpKQ", { autoplay: true, muted: true, loop: true, controls: false, start: 12.7, privacy: false }),
    );
    expect(url.host).toBe("www.youtube.com");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      rel: "0", autoplay: "1", mute: "1", loop: "1", playlist: "aqz-KE-bpKQ", controls: "0", start: "12",
    });
  });
});

describe("vimeo", () => {
  it.each([
    ["https://vimeo.com/76979871", { id: "76979871" }],
    ["76979871", { id: "76979871" }],
    ["https://vimeo.com/channels/staffpicks/76979871", { id: "76979871" }],
    ["https://player.vimeo.com/video/76979871?h=abc123", { id: "76979871", hash: "abc123" }],
    ["https://vimeo.com/76979871/abc123", { id: "76979871", hash: "abc123" }],
  ])("%s", (input, expected) => expect(vimeoId(input)).toEqual(expected));

  it.each(["", "https://youtu.be/aqz-KE-bpKQ", "https://vimeo.com/about"])("rejects %s", (input) =>
    expect(vimeoId(input)).toBeNull(),
  );

  it("builds the embed URL", () => {
    expect(vimeoEmbedUrl({ id: "1" })).toBe("https://player.vimeo.com/video/1?dnt=1");
    expect(vimeoEmbedUrl({ id: "1", hash: "ab" }, { autoplay: true, muted: true, start: 30, dnt: false })).toBe(
      "https://player.vimeo.com/video/1?h=ab&autoplay=1&muted=1#t=30s",
    );
  });
});
