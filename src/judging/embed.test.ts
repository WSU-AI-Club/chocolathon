import { describe, expect, it } from "vitest";
import { videoEmbed } from "./embed";

describe("videoEmbed", () => {
  it.each([
    ["https://youtu.be/JWhICz1QR8M?is=8YoLJSXG6nEfL5hn", "youtube", "https://www.youtube-nocookie.com/embed/JWhICz1QR8M"],
    ["https://www.youtube.com/watch?v=Aq5WXmQQooo&t=10s", "youtube", "https://www.youtube-nocookie.com/embed/Aq5WXmQQooo"],
    ["https://youtube.com/shorts/Aq5WXmQQooo", "youtube", "https://www.youtube-nocookie.com/embed/Aq5WXmQQooo"],
    ["https://m.youtube.com/watch?v=Aq5WXmQQooo", "youtube", "https://www.youtube-nocookie.com/embed/Aq5WXmQQooo"],
    ["https://vimeo.com/123456789", "vimeo", "https://player.vimeo.com/video/123456789"],
    ["https://vimeo.com/123456789/abcdef1234", "vimeo", "https://player.vimeo.com/video/123456789?h=abcdef1234"],
    ["https://drive.google.com/file/d/1AbC_dEf-GhI/view?usp=sharing", "drive", "https://drive.google.com/file/d/1AbC_dEf-GhI/preview"],
    ["https://drive.google.com/open?id=1AbC_dEf-GhI", "drive", "https://drive.google.com/file/d/1AbC_dEf-GhI/preview"],
    ["https://www.loom.com/share/0abc123def4567890abc123def456789", "loom", "https://www.loom.com/embed/0abc123def4567890abc123def456789"],
  ])("%s", (url, kind, src) => {
    expect(videoEmbed(url)).toEqual({ kind, src });
  });

  it.each([
    "https://wichitastate-my.sharepoint.com/:v:/g/personal/x/abc",
    "https://1drv.ms/v/s!abc",
    "Trat",
    "",
    "https://example.com/video.mp4",
    "https://www.youtube.com/",
  ])("no embed for %s", (url) => {
    expect(videoEmbed(url)).toBeNull();
  });
});
