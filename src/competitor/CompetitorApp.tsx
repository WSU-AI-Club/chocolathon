/* ═══════════════════════════════════════════════════════════════════
   PROMPTS APP — the public prompts page, fed by the server.

   The client never decides whether the prompts are out. It asks
   /api/hub; before the release clock the answer carries no prompt text,
   after it the answer carries all eight. If the client held the text,
   View Source would too.

   When the page is open across the release instant it asks again on
   its own, so a team watching the countdown sees the prompts appear
   without touching refresh.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";

import CompetitorHub from "./CompetitorHub";
import type { HubData } from "./types";
import "../chocolathon.css";

type State =
  | { status: "loading" }
  | { status: "ready"; data: HubData }
  | { status: "error"; message: string };

export default function CompetitorApp() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hub", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({
          status: "error",
          message:
            body?.error ??
            "Competition HQ is having a problem. Try again in a minute.",
        });
        return;
      }
      setState({ status: "ready", data: (await res.json()) as HubData });
    } catch {
      setState({
        status: "error",
        message: "Could not reach the server. Check your connection.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Ask again a beat after the release instant. The server is the
     authority on the time, so the delay comes from its releaseAt, not
     the device clock alone; the extra second covers clock skew. */
  useEffect(() => {
    if (state.status !== "ready" || state.data.promptsUnlocked) return;
    const wait = new Date(state.data.releaseAt).getTime() - Date.now() + 1_500;
    const id = window.setTimeout(() => void load(), Math.max(wait, 1_000));
    return () => window.clearTimeout(id);
  }, [state, load]);

  /* The sections do not exist until the data arrives, so the browser's
     own hash scroll (from a /hq#tracks link on the landing page) fires
     into an empty page and lands on the top. Redo it once the content
     is rendered, and again whenever the hash changes in-page. */
  useEffect(() => {
    if (state.status !== "ready") return;
    const go = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start" });
    };
    const raf = window.requestAnimationFrame(go);
    window.addEventListener("hashchange", go);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", go);
    };
  }, [state.status]);

  /* Belt and braces with the X-Robots-Tag header in vercel.json: that
     header covers crawlers that never run JS, this covers the ones that
     do and only look at the DOM. Public, but not something to rank. */
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    const previousTitle = document.title;
    document.title = "Chocolathon — Competition HQ";
    return () => {
      tag.remove();
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="choco-root">
      {state.status === "loading" ? (
        <Centered>
          <p className="label">Loading…</p>
        </Centered>
      ) : state.status === "error" ? (
        <Centered>
          <p className="max-w-sm text-base leading-relaxed text-ink/70">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              void load();
            }}
            className="btn-ghost mt-7"
          >
            Try again
          </button>
        </Centered>
      ) : (
        <CompetitorHub data={state.data} />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
      {children}
    </div>
  );
}
