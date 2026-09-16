/* Turn the video link a team pasted into something an iframe can show.
   Four hosts embed cleanly; everything else returns null and the card
   falls back to a button. Never throws on garbage. */
import type { Embed } from "./types";
export type { Embed };

export function videoEmbed(raw: string): Embed | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
  const id = (s: string | null | undefined) => (s && /^[\w-]{6,}$/.test(s) ? s : null);

  if (host === "youtu.be") {
    const v = id(u.pathname.split("/")[1]);
    return v ? { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${v}` } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const v = id(u.searchParams.get("v")) ?? (["shorts", "embed", "live"].includes(parts[0]) ? id(parts[1]) : null);
    return v ? { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${v}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const num = parts.find((p) => /^\d{6,}$/.test(p));
    if (!num) return null;
    const hash = parts[parts.indexOf(num) + 1];
    const h = hash && /^[a-f0-9]{6,}$/i.test(hash) ? `?h=${hash}` : "";
    return { kind: "vimeo", src: `https://player.vimeo.com/video/${num}${h}` };
  }
  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([\w-]+)/);
    const fid = id(m?.[1]) ?? id(u.searchParams.get("id"));
    return fid ? { kind: "drive", src: `https://drive.google.com/file/d/${fid}/preview` } : null;
  }
  if (host === "loom.com") {
    const m = u.pathname.match(/\/(?:share|embed)\/([a-f0-9]{16,})/i);
    return m ? { kind: "loom", src: `https://www.loom.com/embed/${m[1]}` } : null;
  }
  return null;
}
