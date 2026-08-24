/* ═══════════════════════════════════════════════════════════════════
   COMPETITOR APP — gate or hub, decided by the server.

   The client never decides whether you are allowed in. It asks
   /api/hub; a 401 means gate, a 200 means hub. That ordering matters:
   if the client held the answer, the answer would be editable in
   devtools, and so would the prompts.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";

import CompetitorGate from "./CompetitorGate";
import CompetitorHub from "./CompetitorHub";
import type { HubData } from "./types";
import "../chocolathon.css";

type State =
  | { status: "loading" }
  | { status: "locked" }
  | { status: "ready"; data: HubData }
  | { status: "error"; message: string };

export default function CompetitorApp() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hub", { credentials: "same-origin" });
      if (res.status === 401) {
        setState({ status: "locked" });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({
          status: "error",
          message:
            body?.error ??
            "The competitor area is having a problem. Try again in a minute.",
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

  /* Belt and braces with the X-Robots-Tag header in vercel.json: that
     header covers crawlers that never run JS, this covers the ones that
     do and only look at the DOM. */
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    const previousTitle = document.title;
    document.title = "Chocolathon HQ — Competitors";
    return () => {
      tag.remove();
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="choco-root">
      {state.status === "loading" ? (
        <Centered>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            Loading…
          </p>
        </Centered>
      ) : state.status === "locked" ? (
        <CompetitorGate onUnlocked={() => void load()} />
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
        <CompetitorHub
          data={state.data}
          onSignedOut={() => setState({ status: "locked" })}
        />
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
