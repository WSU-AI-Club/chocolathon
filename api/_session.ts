/* ═══════════════════════════════════════════════════════════════════
   SESSION — competitor codes in, signed cookie out. Server only.

   No database, no accounts, no email. For an event with ~25 teams that
   is the right amount of machinery: the roster already lives in the
   registration spreadsheet, and a login system that can fail on the
   morning of September 14 is worse than no login system.

   ── ENV VARS ──────────────────────────────────────────────────────
   COMPETITOR_CODES  (required in production)
       Newline- or comma-separated. Each entry is either
           CODE
       or  CODE:Team Name
       One entry  = one shared event passcode for everyone.
       Many entries = per-team codes, and the hub greets them by name.
       Switching between the two is an env-var edit, not a rebuild.

   SESSION_SECRET    (required in production)
       Any long random string. Signs the cookie. Change it to force
       every logged-in team back to the gate.

   PROMPTS_RELEASE_AT   ISO datetime, default 2026-09-14T05:00:00Z
       (= midnight Sep 14, Wichita time). Before this, a valid code
       gets the briefing but NOT the prompts.

   PROMPTS_UNLOCKED     "true" to ignore the clock. For your own
       preview before the 14th. Remember to remove it.

   HUB_PUBLIC           "true" to drop the gate entirely after the
       event, when prompts and projects go public.
   ═══════════════════════════════════════════════════════════════════ */

import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "choco_team";
const SESSION_DAYS = 45;

/* Local dev only. In production a missing COMPETITOR_CODES is a hard
   503, never a default password — an accidentally open door is the one
   failure mode worse than a locked one. */
const DEV_FALLBACK_CODE = "chocolate";

export type Team = { code: string; name: string };

function isProd(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/* ── the code list ────────────────────────────────────────────────── */

export function loadTeams(): Team[] | null {
  const raw = process.env.COMPETITOR_CODES?.trim();
  if (!raw) {
    if (isProd()) return null;
    return [{ code: DEV_FALLBACK_CODE, name: "Dev Team" }];
  }
  return raw
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf(":");
      if (at === -1) return { code: line, name: "" };
      return {
        code: line.slice(0, at).trim(),
        name: line.slice(at + 1).trim(),
      };
    })
    .filter((t) => t.code.length > 0);
}

/* Codes are compared case-insensitively with whitespace stripped, because
   they get typed off a phone screen by a tired student. No early return:
   every entry is checked so the loop's timing says nothing about which
   code was close. */
function normalize(code: string): string {
  return code.replace(/\s+/g, "").toLowerCase();
}

export function matchTeam(input: string, teams: Team[]): Team | null {
  const given = normalize(input);
  let found: Team | null = null;
  for (const team of teams) {
    if (normalize(team.code) === given && given.length > 0) found = team;
  }
  return found;
}

/* ── the cookie ───────────────────────────────────────────────────── */

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return s;
  if (isProd()) throw new Error("SESSION_SECRET is not set");
  return "dev-only-insecure-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function mintCookie(team: Team): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ n: team.name, x: expires }),
  ).toString("base64url");
  const value = `${payload}.${sign(payload)}`;

  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
  ];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(): string {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}

/* Returns the team NAME (possibly "") if the cookie is valid, else null. */
export function readCookie(header: string | undefined): string | null {
  if (!header) return null;
  const hit = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!hit) return null;

  const value = hit.slice(COOKIE_NAME.length + 1);
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  if (!safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.x !== "number" || data.x < Date.now()) return null;
    return typeof data.n === "string" ? data.n : "";
  } catch {
    return null;
  }
}

/* ── the release clock ────────────────────────────────────────────── */

export const DEFAULT_RELEASE = "2026-09-14T05:00:00.000Z"; // midnight CT, Sep 14

export function releaseAt(): Date {
  const raw = process.env.PROMPTS_RELEASE_AT?.trim();
  const parsed = raw ? new Date(raw) : new Date(DEFAULT_RELEASE);
  return Number.isNaN(parsed.getTime()) ? new Date(DEFAULT_RELEASE) : parsed;
}

export function promptsUnlocked(): boolean {
  if (process.env.PROMPTS_UNLOCKED?.trim().toLowerCase() === "true") return true;
  return Date.now() >= releaseAt().getTime();
}

export function hubIsPublic(): boolean {
  return process.env.HUB_PUBLIC?.trim().toLowerCase() === "true";
}
