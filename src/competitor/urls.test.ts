import { describe, expect, it } from "vitest";

import { toHref, urlsIn } from "./urls";

describe("toHref", () => {
  it("keeps a proper URL", () => {
    expect(toHref("https://youtu.be/Eg227VpUvzY")).toBe("https://youtu.be/Eg227VpUvzY");
  });
  it("adds https to a bare domain, with or without a path", () => {
    expect(toHref("cocoa-dolce-visibility.lovable.app")).toBe("https://cocoa-dolce-visibility.lovable.app");
    expect(toHref("youtube.com/watch?v=heuRWnN647s&feature=youtu.be")).toBe(
      "https://youtube.com/watch?v=heuRWnN647s&feature=youtu.be",
    );
  });
  it("pulls the first link out of prose", () => {
    expect(toHref("Camera App: https://ai-chocolation.vercel.app/ Admin Dashboard: https://case-notes-delta.vercel.app/")).toBe(
      "https://ai-chocolation.vercel.app/",
    );
    expect(toHref("Quick Presentation Demo: https://drive.google.com/file/d/17b/view?usp=drive_link")).toBe(
      "https://drive.google.com/file/d/17b/view?usp=drive_link",
    );
  });
  it("trims a trailing comma or period", () => {
    expect(urlsIn("https://a.vercel.app/, https://youtu.be/x, https://docs.google.com/p/1.")).toEqual([
      "https://a.vercel.app/",
      "https://youtu.be/x",
      "https://docs.google.com/p/1",
    ]);
  });
  it("gives nothing for prose with no link", () => {
    expect(toHref("Contained in the presentation")).toBeUndefined();
    expect(toHref("")).toBeUndefined();
    expect(toHref(undefined)).toBeUndefined();
  });
});
